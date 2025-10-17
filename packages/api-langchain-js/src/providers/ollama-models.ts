import { ChatOpenAI } from "@langchain/openai";

export const llm = async () => {
  console.log("Using Ollama Models");
  return new ChatOpenAI({
    openAIApiKey: 'OLLAMA_API_KEY',
    modelName: process.env.OLLAMA_MODEL || "llama2",
    configuration: {
      baseURL: process.env.OLLAMA_MODEL_ENDPOINT,
    },
    temperature: 0,
  });
};