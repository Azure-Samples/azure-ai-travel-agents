import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { BaseMessage } from "@langchain/core/messages";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { createSupervisor } from "@langchain/langgraph-supervisor";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { McpServerDefinition } from "../../../mcp/mcp-tools.js";
import { McpToolsConfig } from "../tools/index.js";
import { createMcpToolsFromDefinition } from "../tools/mcp-bridge.js";

// Define the state for our graph
export interface AgentState {
  messages: BaseMessage[];
  currentAgent?: string;
  toolsOutput?: any[];
}

export interface AgentConfig {
  name: string;
  systemPrompt: string;
  tools: DynamicStructuredTool[];
  llm: BaseChatModel;
}

export type AgentType = typeof createReactAgent;

// Helper function to create MCP tools based on server configuration  
export const createMcpTools = async (mcpServerConfig: McpServerDefinition): Promise<DynamicStructuredTool[]> => {
  return createMcpToolsFromDefinition(mcpServerConfig);
};

// Function to setup agents with filtered tools
export const setupAgents = async (
  filteredTools: McpServerDefinition[] = [],
  llm: BaseChatModel
) => {
  const tools = Object.fromEntries(
    filteredTools.map((tool) => [tool.id, true])
  );
  console.log("Filtered tools:", tools);

  const agents: any[] = [];
  let mcpTools: DynamicStructuredTool[] = [];
  const mcpToolsConfig = McpToolsConfig();

  // Create agents based on available tools
  if (tools["echo-ping"]) {
    const mcpServerConfig = mcpToolsConfig["echo-ping"];
    const echoTools = await createMcpTools(mcpServerConfig);
    
    const agent = createReactAgent({
      llm,
      name: "EchoAgent",
      tools: echoTools,
      prompt: "Echo back the received input. Do not respond with anything else. Always call the tools.",
    });
    
    agents.push(agent);
    mcpTools.push(...echoTools);
  }

  if (tools["customer-query"]) {
    const mcpServerConfig = mcpToolsConfig["customer-query"];
    const customerTools = await createMcpTools(mcpServerConfig);

    const agent = createReactAgent({
      llm,
      name: "CustomerQueryAgent",
      tools: customerTools,
      prompt: "Assists employees in better understanding customer needs, facilitating more accurate and personalized service. This agent is particularly useful for handling nuanced queries, such as specific travel preferences or budget constraints, which are common in travel agency interactions.",
    });

    agents.push(agent);
    mcpTools.push(...customerTools);
  }

  if (tools["itinerary-planning"]) {
    const mcpServerConfig = mcpToolsConfig["itinerary-planning"];
    const itineraryTools = await createMcpTools(mcpServerConfig);
    
    const agent = createReactAgent({
      llm,
      name: "ItineraryPlanningAgent",
      tools: itineraryTools,
      prompt: "Creates a travel itinerary based on user preferences and requirements.",
    });
    
    agents.push(agent);
    mcpTools.push(...itineraryTools);
  }

  if (tools["destination-recommendation"]) {
    const mcpServerConfig = mcpToolsConfig["destination-recommendation"];
    const destinationTools = await createMcpTools(mcpServerConfig);
    
    const agent = createReactAgent({
      llm,
      name: "DestinationRecommendationAgent",
      tools: destinationTools,
      prompt: "Suggests destinations based on customer preferences and requirements.",
    });
    
    agents.push(agent);
    mcpTools.push(...destinationTools);
  }

  const supervisor = createSupervisor({
    agents,
    llm,
    prompt: "Acts as a triage agent to determine the best course of action for the user's query. If you cannot handle the query, please pass it to the next agent. If you can handle the query, please do so.",
    outputMode: "full_history"
  });

  console.log("Agents created:", Object.keys(agents));
  console.log("All tools count:", mcpTools.length);

  return { supervisor, agents, mcpTools };
};