import { openai } from "llamaindex";
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
    
    return openai({
      azure: {
        endpoint: process.env.AZURE_OPENAI_ENDPOINT,
        deployment: process.env.AZURE_OPENAI_DEPLOYMENT,
        apiKey: process.env.AZURE_OPENAI_API_KEY,
      },
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

  const azureADTokenProvider = getBearerTokenProvider(
    credential,
    AZURE_COGNITIVE_SERVICES_SCOPE
  );

  return openai({
    azure: {
      azureADTokenProvider,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT,
    },
  });
};
