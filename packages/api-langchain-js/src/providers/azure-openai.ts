import { ChatOpenAI } from "@langchain/openai";
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

    // return new AzureChatOpenAI({
    //   azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
    //   azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT,
    //   azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
    //   temperature: 0,
    // });

    const token = process.env.AZURE_OPENAI_API_KEY;
    return new ChatOpenAI({
      configuration: {
        baseURL: process.env.AZURE_OPENAI_ENDPOINT,
      },
      modelName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME ?? "gpt-5",
      streaming: true,
      useResponsesApi: true,
      apiKey: token,
      verbose: true,
    });
  }

  // Set up Azure AD authentication for production
  let credential: any = new DefaultAzureCredential();
  const clientId = process.env.AZURE_CLIENT_ID;
  if (clientId) {
    // running in production with a specific client ID
    console.log("Using Azure Client ID:", clientId);
    credential = new ManagedIdentityCredential({
      clientId,
    });
  }

  // Create the token provider function that will be called on every request
  const azureADTokenProvider = getBearerTokenProvider(
    credential,
    AZURE_COGNITIVE_SERVICES_SCOPE
  );

  console.log(
    "Using Azure OpenAI Endpoint:",
    process.env.AZURE_OPENAI_ENDPOINT
  );
  console.log(
    "Using Azure OpenAI Deployment Name:",
    process.env.AZURE_OPENAI_DEPLOYMENT_NAME
  );

  return new ChatOpenAI({
    configuration: {
      baseURL: process.env.AZURE_OPENAI_ENDPOINT,
    },
    modelName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME ?? "gpt-5",
    streaming: true,
    useResponsesApi: true,
    apiKey: await azureADTokenProvider(),
    verbose: true,
  });
};
