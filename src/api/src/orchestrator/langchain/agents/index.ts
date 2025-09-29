import { BaseMessage } from "@langchain/core/messages";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { McpServerDefinition } from "../../../mcp/mcp-tools.js";
import { McpToolsConfig, McpServerName } from "../tools/index.js";

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

// Helper function to create MCP tools based on server configuration  
// For now, we'll use a placeholder that returns empty tools
// This can be enhanced later once we properly integrate the MCP adapters
export const createMcpTools = async (mcpServerConfig: McpServerDefinition): Promise<DynamicStructuredTool[]> => {
  console.log(`Placeholder: Would create MCP tools for ${mcpServerConfig.id} at ${mcpServerConfig.config.url}`);
  // For now, return empty array to get the basic structure working
  return [];
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

  const agents: { [key: string]: any } = {};
  let allTools: DynamicStructuredTool[] = [];
  const mcpToolsConfig = McpToolsConfig();

  // Create agents based on available tools
  if (tools["echo-ping"]) {
    const mcpServerConfig = mcpToolsConfig["echo-ping"];
    const echoTools = await createMcpTools(mcpServerConfig);
    
    agents.EchoAgent = createReactAgent({
      llm,
      tools: echoTools,
      messageModifier: "Echo back the received input. Do not respond with anything else. Always call the tools.",
    });
    
    allTools.push(...echoTools);
  }

  if (tools["customer-query"]) {
    const mcpServerConfig = mcpToolsConfig["customer-query"];
    const customerTools = await createMcpTools(mcpServerConfig);
    
    agents.CustomerQueryAgent = createReactAgent({
      llm,
      tools: customerTools,
      messageModifier: "Assists employees in better understanding customer needs, facilitating more accurate and personalized service. This agent is particularly useful for handling nuanced queries, such as specific travel preferences or budget constraints, which are common in travel agency interactions.",
    });
    
    allTools.push(...customerTools);
  }

  if (tools["web-search"]) {
    const mcpServerConfig = mcpToolsConfig["web-search"];
    const webSearchTools = await createMcpTools(mcpServerConfig);
    console.log("Including Web Search Agent in the workflow");
    
    agents.WebSearchAgent = createReactAgent({
      llm,
      tools: webSearchTools,
      messageModifier: "Searches the web for up-to-date travel information using Bing Search.",
    });
    
    allTools.push(...webSearchTools);
  }

  if (tools["itinerary-planning"]) {
    const mcpServerConfig = mcpToolsConfig["itinerary-planning"];
    const itineraryTools = await createMcpTools(mcpServerConfig);
    
    agents.ItineraryPlanningAgent = createReactAgent({
      llm,
      tools: itineraryTools,
      messageModifier: "Creates a travel itinerary based on user preferences and requirements.",
    });
    
    allTools.push(...itineraryTools);
  }

  if (tools["model-inference"]) {
    const mcpServerConfig = mcpToolsConfig["model-inference"];
    const modelInferenceTools = await createMcpTools(mcpServerConfig);
    
    agents.ModelInferenceAgent = createReactAgent({
      llm,
      tools: modelInferenceTools,
      messageModifier: "Performs model inference tasks based on user input and requirements.",
    });
    
    allTools.push(...modelInferenceTools);
  }

  if (tools["code-evaluation"]) {
    const mcpServerConfig = mcpToolsConfig["code-evaluation"];
    const codeEvaluationTools = await createMcpTools(mcpServerConfig);
    
    agents.CodeEvaluationAgent = createReactAgent({
      llm,
      tools: codeEvaluationTools,
      messageModifier: "Evaluates code snippets and provides feedback or suggestions.",
    });
    
    allTools.push(...codeEvaluationTools);
  }

  if (tools["destination-recommendation"]) {
    const mcpServerConfig = mcpToolsConfig["destination-recommendation"];
    const destinationTools = await createMcpTools(mcpServerConfig);
    
    agents.DestinationRecommendationAgent = createReactAgent({
      llm,
      tools: destinationTools,
      messageModifier: "Suggests destinations based on customer preferences and requirements.",
    });
    
    allTools.push(...destinationTools);
  }

  // Create the triage agent that will determine the best course of action
  agents.TravelAgent = createReactAgent({
    llm,
    tools: allTools,
    messageModifier: "Acts as a triage agent to determine the best course of action for the user's query. If you cannot handle the query, please pass it to the next agent. If you can handle the query, please do so.",
  });

  console.log("Agents created:", Object.keys(agents));
  console.log("All tools count:", allTools.length);

  return { agents, tools: allTools };
};