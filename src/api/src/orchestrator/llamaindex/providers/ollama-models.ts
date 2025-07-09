import { OpenAI, openai } from "llamaindex";

export const llm = async () => {
  console.log("Using Ollama Models");
  const provider = openai({
    baseURL: process.env.OLLAMA_MODEL_ENDPOINT,
    apiKey: 'OLLAMA_API_KEY',
    model: process.env.OLLAMA_MODEL,
  });
  return {
    ...provider,
    // TODO: Remove this when LlamaIndex supports tool calls for non-OpenAI providers
    supportToolCall: true,
  } as OpenAI
};
