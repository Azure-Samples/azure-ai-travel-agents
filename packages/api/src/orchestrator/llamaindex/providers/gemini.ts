import { openai } from "llamaindex";

export const llm = async () => {
  console.log("Using Google Gemini via OpenAI-compatible API");
  
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  
  // Use Google's OpenAI-compatible API endpoint
  // Gemini 2.0 Flash supports function calling/tool use
  const provider = openai({
    baseURL: "https://generativelanguage.googleapis.com/openai/",
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  });
  
  return provider;
};




