import { openai } from "llamaindex";

export const llm = async () => {
  console.log("Using Azure OpenAI");
  try {
    return openai({
      azure: {
        apiKey: process.env.AZURE_OPENAI_API_KEY,
        deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      },
    })
  } catch (error) {
    console.error("Error creating OpenAI instance:");
    console.error({error});
  }
};
