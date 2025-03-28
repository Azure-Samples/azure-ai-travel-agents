import { openai } from "llamaindex";

export const llm = async () => {
  console.log("Using GitHub Models");
  return openai({
    baseURL: "https://models.inference.ai.azure.com",
    apiKey: process.env.GITHUB_TOKEN,
    model: process.env.GITHUB_MODEL,
  });
};
