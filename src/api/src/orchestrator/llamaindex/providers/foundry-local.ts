import { openai } from "llamaindex";
import { FoundryLocalManager } from "foundry-local-sdk";

// By using an alias, the most suitable model will be downloaded
// to your end-user's device.
// TIP: You can find a list of available models by running the
// following command in your terminal: `foundry model list`.
const alias = process.env.AZURE_FOUNDRY_LOCAL_MODEL_ALIAS || "phi-3.5-mini";

export const llm = async () => {
  // Create a FoundryLocalManager instance. This will start the Foundry
  // Local service if it is not already running.
  const foundryLocalManager = new FoundryLocalManager();

  // Initialize the manager with a model. This will download the model
  // if it is not already present on the user's device.
  console.log("Initializing Foundry Local Manager...");
  const modelInfo = await foundryLocalManager.init(alias);
  console.log("Azure Local Foundry Model Info:", modelInfo);
  console.log("Using Azure Local Foundry");
  return openai({
    baseURL: foundryLocalManager.endpoint,
    apiKey: foundryLocalManager.apiKey,
  });
};
