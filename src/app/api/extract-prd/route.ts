
import { NextResponse } from "next/server";
import { adminStorage, adminDb } from "@/lib/firebaseAdminConfig";
import { parseBufferToText, detectPhasesFromText } from "@/utils/parsePrd";
import { v4 as uuidv4 } from "uuid";
import axios from 'axios';
import 'dotenv/config';

type Body = {
  storagePath: string; // path like "uploads/....pdf"
  repoId: string;
  phase?: string; // optional selected phase name
  userEmail?: string;
};

export async function POST(req: Request) {
  try {
    const body: Body = await req.json();

    if (!body.storagePath) return NextResponse.json({ error: "storagePath required" }, { status: 400 });
    if (!body.repoId) return NextResponse.json({ error: "repoId required" }, { status: 400 });

    const bucket = adminStorage.bucket();
    const file = bucket.file(body.storagePath);
    const [exists] = await file.exists();
    if (!exists) return NextResponse.json({ error: "File not found in storage." }, { status: 404 });

    const [buffer] = await file.download();
    const text = await parseBufferToText(buffer, body.storagePath);

    const phases = detectPhasesFromText(text);

    if (!body.phase && phases.length > 1) {
      return NextResponse.json({ 
        needPhase: true, 
        phases: phases.map(p => p.name),
        storagePath: body.storagePath
      });
    }

    let snippet = text;
    let selectedPhaseName = "Initial";
    if (phases.length > 0) {
        if (body.phase) {
            const selected = phases.find(p => p.name === body.phase);
            if (selected) {
                snippet = selected.snippet;
                selectedPhaseName = selected.name;
            }
        } else {
            snippet = phases[0].snippet;
            selectedPhaseName = phases[0].name;
        }
    }

    const HF_API_TOKEN = process.env.HF_API_TOKEN;
    const API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";

    if (!HF_API_TOKEN) {
      throw new Error("Hugging Face API token is not configured.");
    }
    
    const userPrompt = `
      From the provided PRD excerpt, generate structured functional test cases.
      - Focus ONLY on the content below.
      - Each test case must include: id, title, preconditions, steps (an array of strings), and expectedResult.
      - Return ONLY a raw JSON array of test case objects.

      PRD EXCERPT:
      ${snippet.substring(0, 30000)}
    `;
    
    let testcases: any[] = [];
    try {
        const response = await axios.post(
          API_URL,
          { inputs: userPrompt, parameters: { max_new_tokens: 2000, return_full_text: false } },
          { headers: { Authorization: `Bearer ${HF_API_TOKEN}` } }
        );
        let generatedText = response.data[0]?.generated_text || "[]";
        generatedText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonStartIndex = generatedText.indexOf('[');
        const jsonEndIndex = generatedText.lastIndexOf(']');
        if (jsonStartIndex === -1 || jsonEndIndex === -1) throw new Error('No valid JSON array found.');
        const jsonString = generatedText.substring(jsonStartIndex, jsonEndIndex + 1);
        testcases = JSON.parse(jsonString);
    } catch (aiError) {
      console.error("AI generation failed, using fallback.", aiError);
      const paragraphs = snippet.split(/\n{2,}/).map(p => p.trim()).filter(Boolean).slice(0, 10);
      testcases = paragraphs.map((p, idx) => ({ 
          id: `TC_${String(idx + 1).padStart(3, "0")}`, 
          title: p.split(".")[0].slice(0, 80) || `Review feature: ${idx}`,
          steps: [p.slice(0, 200)],
      }));
    }

    if (!Array.isArray(testcases)) {
        throw new Error("Generated content is not a valid JSON array.");
    }
    
    const batch = adminDb.batch();
    const finalTestCases = [];

    for (const tc of testcases) {
      const docId = tc.id ? String(tc.id).replace(/[^a-zA-Z0-9]/g, '') : uuidv4();
      const newTestCase = {
          title: tc.title || 'Untitled Test Case',
          module: tc.module || selectedPhaseName,
          priority: tc.priority || 'Medium',
          status: 'Not Run',
          preconditions: tc.preconditions || 'N/A',
          testSteps: tc.steps || [],
          expectedResult: tc.expectedResult || 'TBD',
          lastUpdatedBy: body.userEmail || 'PRD-Extractor',
          lastUpdatedByUid: 'AI_GENERATED',
          createdAt: adminDb.FieldValue.serverTimestamp(),
          updatedAt: adminDb.FieldValue.serverTimestamp(),
          source: 'PRD',
          phase: selectedPhaseName,
      };
      
      const docRef = adminDb.collection("managedTestCases").doc(docId);
      batch.set(docRef, newTestCase);
      finalTestCases.push({ id: docId, ...newTestCase });
    }

    await batch.commit();

    return NextResponse.json({ success: true, testcases: finalTestCases });

  } catch (err: any) {
    console.error("extract-prd error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
