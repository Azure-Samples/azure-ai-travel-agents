import dotenv from "dotenv";
dotenv.config();

import { McpServerDefinition } from "./utils/types.js";
import { llm as llmProvider } from "./providers/index.js";
import { TravelAgentsWorkflow } from "./graph/index.js";

// Function to set up agents and return the workflow instance
export async function setupAgents(filteredTools: McpServerDefinition[] = []) {
  console.log("Setting up Langchain.js agents...");
  
  let llm;
  try {
    llm = await llmProvider();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }

  // Create and initialize the workflow
  const workflow = new TravelAgentsWorkflow(llm);
  await workflow.initialize(filteredTools);

  console.log("Langchain.js workflow initialized successfully");
  
  return workflow;
}

// Re-export the McpToolsConfig and types
export { McpToolsConfig } from "./tools/index.js";
export type { McpServerDefinition, MCPClientOptions } from "./utils/types.js";