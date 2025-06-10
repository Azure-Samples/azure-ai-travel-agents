import dotenv from "dotenv";
dotenv.config();

import { mcp } from "@llamaindex/tools";
import { agent, multiAgent, ToolCallLLM } from "llamaindex";
import { McpServerDefinition } from "../../mcp/mcp-tools.js";
import { llm as llmProvider } from "./providers/index.js";
import { McpToolsConfig } from "./tools/index.js";
import { A2AOrchestrator, A2AIntegrationConfig } from "./a2a-integration.js";

// Function to set up agents and return the multiAgent instance
export async function setupAgents(filteredTools: McpServerDefinition[] = []) {
  const tools = Object.fromEntries(
    filteredTools.map((tool) => [tool.id, true])
  );
  console.log("Filtered tools:", tools);

  let agentsList = [];
  let handoffTargets = [];
  let toolsList = [];
  const verbose = false;
  const mcpToolsConfig = McpToolsConfig();

  // Setup A2A integration
  const a2aConfig: A2AIntegrationConfig = {
    server: {
      enabled: process.env.A2A_SERVER_ENABLED === "true" || false,
      port: parseInt(process.env.A2A_SERVER_PORT || "3001"),
      host: process.env.A2A_SERVER_HOST || "localhost"
    },
    client: {
      enabled: process.env.A2A_CLIENT_ENABLED === "true" || false,
      registries: process.env.A2A_REGISTRIES ? JSON.parse(process.env.A2A_REGISTRIES) : []
    },
    enableAgentToAgentCommunication: process.env.A2A_AGENT_TO_AGENT === "true" || false
  };

  const a2aOrchestrator = new A2AOrchestrator(a2aConfig);
  await a2aOrchestrator.initialize();

  let llm: ToolCallLLM = {} as ToolCallLLM;
  try {
    llm = await llmProvider();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }

  if (tools["echo-ping"]) {
    const mcpServerConfig = mcpToolsConfig["echo-ping"].config;
    const tools = await mcp(mcpServerConfig).tools();
    const echoAgent = agent({
      name: "EchoAgent",
      systemPrompt:
        "Echo back the received input. Do not respond with anything else. Always call the tools.",
      tools,
      llm,
      verbose,
    });
    agentsList.push(echoAgent);
    handoffTargets.push(echoAgent);
    toolsList.push(...tools);
    
    // Register with A2A
    a2aOrchestrator.registerAgent("echo-ping", echoAgent);
  }

  if (tools["customer-query"]) {
    const mcpServerConfig = mcpToolsConfig["customer-query"];
    const tools = await mcp(mcpServerConfig.config).tools();
    const customerQuery = agent({
      name: "CustomerQueryAgent",
      systemPrompt:
        "Assists employees in better understanding customer needs, facilitating more accurate and personalized service. This agent is particularly useful for handling nuanced queries, such as specific travel preferences or budget constraints, which are common in travel agency interactions.",
      tools,
      llm,
      verbose,
    });
    agentsList.push(customerQuery);
    handoffTargets.push(customerQuery);
    toolsList.push(...tools);
    
    // Register with A2A
    a2aOrchestrator.registerAgent("customer-query", customerQuery);
  }

  if (tools["web-search"]) {
    const mcpServerConfig = mcpToolsConfig["web-search"];
    const tools = await mcp(mcpServerConfig.config).tools();
    console.log("Including Web Search Agent in the workflow");
    const webSearchAgent = agent({
      name: "WebSearchAgent",
      systemPrompt:
        "Searches the web for up-to-date travel information using Bing Search.",
      tools,
      llm,
      verbose,
    });
    agentsList.push(webSearchAgent);
    handoffTargets.push(webSearchAgent);
    toolsList.push(...tools);
    
    // Register with A2A
    a2aOrchestrator.registerAgent("web-search", webSearchAgent);
  }

  if (tools["itinerary-planning"]) {
    const mcpServerConfig = mcpToolsConfig["itinerary-planning"];
    const tools = await mcp(mcpServerConfig.config).tools();
    const itineraryPlanningAgent = agent({
      name: "ItineraryPlanningAgent",
      systemPrompt:
        "Creates a travel itinerary based on user preferences and requirements.",
      tools,
      llm,
      verbose,
    });
    agentsList.push(itineraryPlanningAgent);
    handoffTargets.push(itineraryPlanningAgent);
    toolsList.push(...tools);
    
    // Register with A2A
    a2aOrchestrator.registerAgent("itinerary-planning", itineraryPlanningAgent);
  }

  if (tools["model-inference"]) {
    const mcpServerConfig = mcpToolsConfig["model-inference"];
    const tools = await mcp(mcpServerConfig.config).tools();
    const modelInferenceAgent = agent({
      name: "ModelInferenceAgent",
      systemPrompt:
        "Performs model inference tasks based on user input and requirements.",
      tools,
      llm,
      verbose,
    });
    agentsList.push(modelInferenceAgent);
    handoffTargets.push(modelInferenceAgent);
    toolsList.push(...tools);
    
    // Register with A2A
    a2aOrchestrator.registerAgent("model-inference", modelInferenceAgent);
  }

  if (tools["code-evaluation"]) {
    const mcpServerConfig = mcpToolsConfig["code-evaluation"];
    const tools = await mcp(mcpServerConfig.config).tools();
    const codeEvaluationAgent = agent({
      name: "CodeEvaluationAgent",
      systemPrompt:
        "Evaluates code snippets and provides feedback or suggestions.",
      tools,
      llm,
      verbose,
    });
    agentsList.push(codeEvaluationAgent);
    handoffTargets.push(codeEvaluationAgent);
    toolsList.push(...tools);
    
    // Register with A2A
    a2aOrchestrator.registerAgent("code-evaluation", codeEvaluationAgent);
  }

  if (tools["destination-recommendation"]) {
    const mcpServerConfig = mcpToolsConfig["destination-recommendation"];
    const tools = await mcp(mcpServerConfig.config).tools();
    const destinationAgent = agent({
      name: "DestinationRecommendationAgent",
      systemPrompt:
        "Provides personalized destination recommendations based on customer preferences, budget, and travel requirements.",
      tools,
      llm,
      verbose,
    });
    agentsList.push(destinationAgent);
    handoffTargets.push(destinationAgent);
    toolsList.push(...tools);
    
    // Register with A2A
    a2aOrchestrator.registerAgent("destination-recommendation", destinationAgent);
  }

  // Define the triage agent that will determine the best course of action

  const travelAgent = agent({
    name: "TriageAgent",
    systemPrompt:
      "Acts as a triage agent to determine the best course of action for the user's query. If you cannot handle the query, please pass it to the next agent. If you can handle the query, please do so.",
    tools: [...toolsList],
    canHandoffTo: handoffTargets
      .map((target) => target.getAgents().map((agent) => agent.name))
      .flat(),
    llm,
    verbose,
  });
  agentsList.push(travelAgent);
  
  // Register triage agent with A2A
  a2aOrchestrator.registerAgent("triage", travelAgent);

  // Enable agent-to-agent communication if configured
  await a2aOrchestrator.enableAgentToAgentCommunication();

  console.log("Agents list:", agentsList);
  console.log("Handoff targets:", handoffTargets);
  console.log("Tools list:", JSON.stringify(toolsList, null, 2));
  
  // Log A2A status
  if (a2aConfig.server?.enabled) {
    console.log("A2A Server enabled and running");
    const a2aAgents = await a2aOrchestrator.discoverAgents();
    console.log("A2A Agents:", a2aAgents);
  }

  // Create the multi-agent workflow
  const multiAgentWorkflow = multiAgent({
    agents: agentsList,
    rootAgent: travelAgent,
    verbose,
  });

  // Attach A2A orchestrator to the workflow for external access
  (multiAgentWorkflow as any).a2aOrchestrator = a2aOrchestrator;

  return multiAgentWorkflow;
}
