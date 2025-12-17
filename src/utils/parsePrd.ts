
import * as XLSX from "xlsx";
import mammoth from "mammoth";

export async function parseBufferToText(buffer: Buffer, filename: string): Promise<string> {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.text || "";
  }
  if (lower.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  }
   if (lower.endsWith(".doc")) {
    // Note: .doc support can be limited with mammoth.js
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  }
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".csv")) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const texts: string[] = [];
    workbook.SheetNames.forEach((name) => {
      const sheet = workbook.Sheets[name];
      const txt = XLSX.utils.sheet_to_csv(sheet);
      if (txt) texts.push(txt);
    });
    return texts.join("\n\n");
  }
  // fallback to plain text
  return buffer.toString("utf-8");
}

/**
 * Simple heuristic to detect phases (returns array of {name, snippet})
 */
export function detectPhasesFromText(text: string): { name: string; snippet: string }[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  
  const phases: { name: string; snippet: string }[] = [];
  let currentName = "Initial";
  let buffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isPhaseHeader = /^(Phase\s*\d+|Phase\s*:|Phases|Detailed Flow|Chapter \d+)/i.test(line);

    if (isPhaseHeader && buffer.length > 0) {
      // Push the content accumulated for the previous phase
      phases.push({ name: currentName, snippet: buffer.join("\n") });
      // Start a new phase
      currentName = line.length > 50 ? line.slice(0, 50) + '...' : line;
      buffer = [];
    } else if(isPhaseHeader) {
      // This is the first phase header found, or a header after an empty section.
      currentName = line.length > 50 ? line.slice(0, 50) + '...' : line;
      buffer = []; // Reset buffer for the new phase
    }
    
    buffer.push(line);
  }

  if (buffer.length > 0) {
      phases.push({ name: currentName, snippet: buffer.join("\n") });
  }
  
  if (phases.length === 0 && text.length > 0) {
    return [{name: "Initial", snippet: text}];
  }

  return phases.map((p, i) => ({ 
      name: p.name || `Phase ${i+1}`, 
      // Truncate snippet to avoid excessive token usage
      snippet: p.snippet.slice(0, 25000) 
  }));
}
