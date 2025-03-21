declare global {
  namespace NodeJS {
    interface ProcessEnv {
      AZURE_AI_PROJECTS_CONNECTION_STRING: string;
      AZURE_INFERENCE_ENDPOINT: string;
      AZURE_INFERENCE_MODEL: string;

    }
  }
}

export {};
