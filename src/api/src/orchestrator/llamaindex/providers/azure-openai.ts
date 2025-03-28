import { openai } from "llamaindex";

export const llm = async () => {
  console.log("Using Azure OpenAI");
  return openai({
    azure: {
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
    },
  });
};
