import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export function initializeGeminiProvider() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required for Gemini provider");
  }

  const model = new ChatGoogleGenerativeAI({
    apiKey: apiKey,
    modelName: "gemini-2.0-flash",
    temperature: 0.7,
    maxOutputTokens: 2048,
  });

  console.log("✓ Gemini provider initialized with model: gemini-2.0-flash");
  
  return model;
}
