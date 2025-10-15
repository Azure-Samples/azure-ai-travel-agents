import { ChatOpenAI } from "@langchain/openai";

export const llm = async () => {
  console.log("Using GitHub Models");
  return new ChatOpenAI({
    openAIApiKey: process.env.GITHUB_TOKEN,
    modelName: process.env.GITHUB_MODEL || "gpt-4o-mini",
    configuration: {
      baseURL: "https://models.inference.ai.azure.com",
    },
    temperature: 0,
  });
};