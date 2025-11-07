import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { BaseMessage } from "@langchain/core/messages";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { createAgent } from "langchain";
import { createDeepAgent } from "deepagents";
import { McpToolsConfig } from "../tools/index.js";
import { createMcpToolsFromDefinition } from "../tools/mcp-bridge.js";
import { McpServerDefinition } from "../utils/types.js";

// Define the state for our graph
export interface AgentState {
  messages: BaseMessage[];
  currentAgent?: string;
  toolsOutput?: any[];
}

// Helper function to create MCP tools based on server configuration  
export const createMcpTools = async (mcpServerConfig: McpServerDefinition): Promise<DynamicStructuredTool[]> => {
  return createMcpToolsFromDefinition(mcpServerConfig);
};

// Function to setup agents with filtered tools
export const setupAgents = async (
  filteredTools: McpServerDefinition[] = [],
  model: BaseChatModel
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
    
    const graph = createAgent({
      model,
      name: "EchoAgent",
      tools: echoTools,
      systemPrompt: "Echo back the received input. Do not respond with anything else. Always call the tools.",
    });

    const agent = {
      name: "EchoAgent",
      description: "Echo back the received input. Do not respond with anything else. Always call the tools.",
      runnable: createAgent({
      model,
      tools: echoTools,
      systemPrompt: "You are an Echo Agent that echoes back the received input. Do not respond with anything else. Always call the tools.",
    })
    };
    
    agents.push(agent);
    mcpTools.push(...echoTools);
  }

  if (tools["customer-query"]) {
    const mcpServerConfig = mcpToolsConfig["customer-query"];
    const customerTools = await createMcpTools(mcpServerConfig);

    const graph = createAgent({
      model,
      name: "CustomerQueryAgent",
      tools: customerTools,
      systemPrompt: "Assists employees in better understanding customer needs, facilitating more accurate and personalized service. This agent is particularly useful for handling nuanced queries, such as specific travel preferences or budget constraints, which are common in travel agency interactions.",
    });

    const agent = {
      name: "CustomerQueryAgent",
      description: "Assists employees in better understanding customer needs, facilitating more accurate and personalized service. This agent is particularly useful for handling nuanced queries, such as specific travel preferences or budget constraints, which are common in travel agency interactions.",
      runnable: createAgent({
        model,
        name: "CustomerQueryAgent",
        tools: customerTools,
        systemPrompt: "You are a Customer Query Agent that assists employees in better understanding customer needs, facilitating more accurate and personalized service. This agent is particularly useful for handling nuanced queries, such as specific travel preferences or budget constraints, which are common in travel agency interactions.",
      }),
    };

    agents.push(agent);
    mcpTools.push(...customerTools);
  }

  if (tools["itinerary-planning"]) {
    const mcpServerConfig = mcpToolsConfig["itinerary-planning"];
    const itineraryTools = await createMcpTools(mcpServerConfig);

    const agent = {
      name: "ItineraryPlanningAgent",
      description: "Creates a travel itinerary based on user preferences and requirements.",
      runnable: createAgent({
        model,
        tools: itineraryTools,
        systemPrompt: "You are an Itinerary Planning Agent that creates travel itineraries based on user preferences and requirements.",
      }),
    };

    agents.push(agent);
    mcpTools.push(...itineraryTools);
  }

  if (tools["destination-recommendation"]) {
    const mcpServerConfig = mcpToolsConfig["destination-recommendation"];
    const destinationTools = await createMcpTools(mcpServerConfig);

    const agent = {
      name: "DestinationRecommendationAgent",
      description: "Suggests destinations based on customer preferences and requirements.",
      runnable: createAgent({
        model,
        tools: destinationTools,
        systemPrompt: "You are a Destination Recommendation Agent that suggests destinations based on customer preferences and requirements.",
      })
    };

    agents.push(agent);
    mcpTools.push(...destinationTools);
  }

  console.log("Agents created:", Object.keys(agents));
  console.log("All tools count:", mcpTools.length);

  const deepAgent = createDeepAgent({
    model,
    subagents: agents,
    systemPrompt: "Acts as a triage agent to determine the best course of action for the user's query. If you cannot handle the query, please delegate to your subagents using the task() tool. If you can handle the query, please do so.",
    tools: mcpTools,
  });

  return { agents, mcpTools, deepAgent };
};
