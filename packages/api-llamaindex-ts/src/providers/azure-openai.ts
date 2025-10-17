import { AzureOpenAI } from "@llamaindex/azure";
import {
  DefaultAzureCredential,
  getBearerTokenProvider,
  ManagedIdentityCredential,
} from "@azure/identity";

const AZURE_COGNITIVE_SERVICES_SCOPE =
  "https://cognitiveservices.azure.com/.default";

export const llm = async () => {
  console.log("Using Azure OpenAI");

  const isRunningInLocalDocker = process.env.IS_LOCAL_DOCKER_ENV === "true";
  
  if (isRunningInLocalDocker) {
    // running in local Docker environment
    console.log(
      "Running in local Docker environment, Azure Managed Identity is not supported. Authenticating with apiKey."
    );
    
    return new AzureOpenAI({
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      temperature: 1, // gpt-5 specific setting
    });
  }
  
  let credential: any = new DefaultAzureCredential();
  const clientId = process.env.AZURE_CLIENT_ID;
  if (clientId) {
    // running in production with a specific client ID
    console.log("Using Azure Client ID:", clientId);
    credential = new ManagedIdentityCredential({
      clientId,
    });
  }

  console.log("Using DefaultAzureCredential for authentication.");
  const azureADTokenProvider = getBearerTokenProvider(
    credential,
    AZURE_COGNITIVE_SERVICES_SCOPE
  );
  
  return new AzureOpenAI({
    azureADTokenProvider,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
    temperature: 1, // gpt-5 specific setting
  });
};
