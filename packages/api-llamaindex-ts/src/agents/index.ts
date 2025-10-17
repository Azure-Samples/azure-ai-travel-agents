import { BaseToolWithCall, ToolCallLLM } from "@llamaindex/core/llms";
import { agent } from "@llamaindex/workflow";
import { McpToolsConfig } from "../tools/index.js";
import { createMcpToolsFromDefinition } from "../tools/mcp-bridge.js";
import { McpServerDefinition } from "../utils/types.js";

// Helper function to create MCP tools based on server configuration  
export const createMcpTools = async (mcpServerConfig: McpServerDefinition): Promise<BaseToolWithCall[]> => {
  return createMcpToolsFromDefinition(mcpServerConfig);
};

// Function to setup agents with filtered tools
export const setupAgents = async (
  filteredTools: McpServerDefinition[] = [],
  llm: ToolCallLLM
) => {
  const tools = Object.fromEntries(
    filteredTools.map((tool) => [tool.id, true])
  );
  console.log("Filtered tools:", tools);

  const agents: any[] = [];
  let mcpTools: BaseToolWithCall[] = [];
  const mcpToolsConfig = McpToolsConfig();
  const verbose = false;

  // Create agents based on available tools
  if (tools["echo-ping"]) {
    const mcpServerConfig = mcpToolsConfig["echo-ping"];
    const echoTools = await createMcpTools(mcpServerConfig);
    
    const _agent = agent({
      llm,
      name: "EchoAgent",
      tools: echoTools,
      systemPrompt: "Echo back the received input. Do not respond with anything else. Always call the tools.",
    });
    
    agents.push(_agent);
    mcpTools.push(...echoTools);
  }

  if (tools["customer-query"]) {
    const mcpServerConfig = mcpToolsConfig["customer-query"];
    const customerTools = await createMcpTools(mcpServerConfig);

    const _agent = agent({
      llm,
      name: "CustomerQueryAgent",
      tools: customerTools,
      systemPrompt: "Assists employees in better understanding customer needs, facilitating more accurate and personalized service. This agent is particularly useful for handling nuanced queries, such as specific travel preferences or budget constraints, which are common in travel agency interactions.",
    });

    agents.push(_agent);
    mcpTools.push(...customerTools);
  }

  if (tools["itinerary-planning"]) {
    const mcpServerConfig = mcpToolsConfig["itinerary-planning"];
    const itineraryTools = await createMcpTools(mcpServerConfig);
    
    const _agent = agent({
      llm,
      name: "ItineraryPlanningAgent",
      tools: itineraryTools,
      systemPrompt: "Creates a travel itinerary based on user preferences and requirements.",
    });
    
    agents.push(_agent);
    mcpTools.push(...itineraryTools);
  }

  if (tools["destination-recommendation"]) {
    const mcpServerConfig = mcpToolsConfig["destination-recommendation"];
    const destinationTools = await createMcpTools(mcpServerConfig);
    
    const _agent = agent({
      llm,
      name: "DestinationRecommendationAgent",
      tools: destinationTools,
      systemPrompt: "Suggests destinations based on customer preferences and requirements.",
    });
    
    agents.push(_agent);
    mcpTools.push(...destinationTools);
  }

  const supervisor = agent({
    name: "TravelAgent",
    systemPrompt:
      "Acts as a triage agent to determine the best course of action for the user's query. If you cannot handle the query, please pass it to the next agent. If you can handle the query, please do so.",
    tools: [...mcpTools],
    canHandoffTo: agents
      .map((target) => target.getAgents().map(((agent: any) => agent.name)))
      .flat(),
    llm,
    verbose,
  });

  console.log("Agents list:", agents);
  console.log("Tools list:", JSON.stringify(mcpTools, null, 2));
  console.log("Agents created:", Object.keys(agents));
  console.log("All tools count:", mcpTools.length);

  return { supervisor, agents, mcpTools };
};