import { OpenAI, openai } from "llamaindex";

export const llm = async () => {
  console.log("Using Docker Models");
  const provider = openai({
    baseURL: process.env.DOCKER_MODEL_ENDPOINT,
    apiKey: 'DOCKER_API_KEY',
    model: process.env.DOCKER_MODEL,
  });
  return {
    ...provider,
    // TODO: Remove this when LlamaIndex supports tool calls for non-OpenAI providers
    supportToolCall: true,
  } as OpenAI
};
