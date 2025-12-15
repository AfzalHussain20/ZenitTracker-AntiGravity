
'use server';
/**
 * @fileOverview AI flow for generating structured test cases using the Hugging Face Inference API.
 */
import axios from 'axios';
import { z } from 'zod';
import 'dotenv/config';

// === Input Schema ===
const GenerateTestCasesInputSchema = z.object({
  featureDescription: z.string().min(10).describe('Detailed description of the feature or user story to generate test cases for.'),
  count: z.number().int().min(1).max(10).describe('The exact number of test cases to generate.'),
});
export type GenerateTestCasesInput = z.infer<typeof GenerateTestCasesInputSchema>;


// === Output Schema ===
const TestCaseSchema = z.object({
  title: z.string().describe('A concise, descriptive title for the test case.'),
  module: z.string().describe("The feature or module this test case belongs to (e.g., 'Authentication', 'Profile Update')."),
  priority: z.enum(['High', 'Medium', 'Low']).describe('The priority of the test case (High, Medium, or Low).'),
  testSteps: z.array(z.string()).describe('An array of clear, ordered, and executable steps for the test case.'),
  expectedResult: z.string().describe('A specific and verifiable description of the expected outcome after executing the steps.'),
});

const GenerateTestCasesOutputSchema = z.object({
  testCases: z.array(TestCaseSchema).describe('An array of the generated test case objects.'),
});
export type GenerateTestCasesOutput = z.infer<typeof GenerateTestCasesOutputSchema>;


/**
 * Generates structured test cases using the Hugging Face Inference API.
 */
export async function generateTestCases(input: GenerateTestCasesInput): Promise<GenerateTestCasesOutput> {
  
  const HF_API_TOKEN = process.env.HF_API_TOKEN;
  const API_URL = "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta";

  if (!HF_API_TOKEN) {
    throw new Error("Hugging Face API token is not configured. Please add your HF_API_TOKEN to the .env file.");
  }
  
  const prompt = `
    You are an expert QA Engineer. Your task is to generate exactly ${input.count} structured test cases based on the provided feature description.
    You must respond with ONLY a raw JSON array of test case objects, with no other text, comments, or explanations.
    The JSON output must conform to this Zod schema:
    ${JSON.stringify(GenerateTestCasesOutputSchema.shape.testCases.element.shape, null, 2)}
    
    Ensure you create a mix of positive, negative, and edge test cases to ensure full coverage.
    
    Feature Description:
    "${input.featureDescription}"
  `;

  try {
    const response = await axios.post(
      API_URL,
      { 
        inputs: prompt,
        parameters: {
          max_new_tokens: 1500,
          temperature: 0.7,
          return_full_text: false,
        }
      },
      { 
        headers: { 
          Authorization: `Bearer ${HF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        timeout: 120000, // Increased timeout to 120 seconds
      }
    );

    let generatedText = "";
    const data = response.data;
    
    if (Array.isArray(data)) {
        generatedText = data[0]?.generated_text || JSON.stringify(data);
    } else if (data?.generated_text) {
        generatedText = data.generated_text;
    } else if (typeof data === 'string') {
        generatedText = data;
    } else {
        generatedText = JSON.stringify(data);
    }


    // Clean up the response to ensure it's valid JSON
    generatedText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Find the start and end of the JSON array
    const jsonStartIndex = generatedText.indexOf('[');
    const jsonEndIndex = generatedText.lastIndexOf(']');
    
    if (jsonStartIndex === -1 || jsonEndIndex === -1) {
        console.error("Hugging Face Raw Response:", generatedText);
        throw new Error('No valid JSON array found in the AI response.');
    }
    
    const jsonString = generatedText.substring(jsonStartIndex, jsonEndIndex + 1);

    const parsedTestCases = JSON.parse(jsonString);

    // Validate the output against the schema
    const validationResult = z.array(TestCaseSchema).safeParse(parsedTestCases);
    if (!validationResult.success) {
      console.error("Hugging Face API response failed Zod validation:", validationResult.error);
      throw new Error("The AI returned data in an unexpected format. Please try again.");
    }
    
    return { testCases: validationResult.data };

  } catch (error: any) {
    if (error.response) {
      console.error("HF API error:", error.response.status, error.response.data);
    } else {
      console.error("HF Generation Error:", error.message);
    }
    throw new Error(`Failed to generate test cases using the AI service: ${error.response?.statusText || error.message}`);
  }
}
