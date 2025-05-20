import dotenv from "dotenv";
dotenv.config({
  path: "./.env.dev",
});

import { llm as azureOpenAI } from "./azure-openai.js";
import { llm as githubModels } from "./github-models.js";
import { llm as foundryLocal } from "./foundry-local.js";

type LLMProvider = "azure-openai" | "github-models" | "foundry-local";

const provider = (process.env.LLM_PROVIDER || "") as LLMProvider;

export const llm = async () => {
  switch (provider) {
    case "azure-openai":
      return azureOpenAI();
    case "github-models":
      return githubModels();
    case "foundry-local":
      return foundryLocal();
    default:
      throw new Error(
        `Unknown LLM_PROVIDER "${provider}". Valid options are: azure-openai, github-models, foundry-local.`
      );
  }
};