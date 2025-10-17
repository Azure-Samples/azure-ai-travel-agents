import { ChatOpenAI } from "@langchain/openai";

export const llm = async () => {
  console.log("Using Docker Models");
  return new ChatOpenAI({
    openAIApiKey: 'DOCKER_API_KEY',
    modelName: process.env.DOCKER_MODEL || "gpt-3.5-turbo",
    configuration: {
      baseURL: process.env.DOCKER_MODEL_ENDPOINT,
    },
    temperature: 0,
  });
};