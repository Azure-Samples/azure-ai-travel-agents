import dotenv from "dotenv";
dotenv.config();

import { mcp, MCPClientOptions} from "@llamaindex/tools";
import { agent, multiAgent, ToolCallLLM, SimpleChatEngine } from "llamaindex";
import { McpServerDefinition } from "../../mcp/mcp-tools.js";
import { llm as llmProvider } from "./providers/index.js";
import { McpToolsConfig } from "./tools/index.js";

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

  let llm: ToolCallLLM = {} as ToolCallLLM;
  try {
    llm = await llmProvider();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }

  // Check if LLM supports tool calls
  const supportsTools = (llm as any).metadata?.functionCalling || 
                        (llm as any).getNodeClass?.() !== undefined ||
                        llm.constructor.name.includes("OpenAI");
  
  console.log(`LLM supports tool calls: ${supportsTools}`);

  if (tools["echo-ping"] && supportsTools) {
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
  }

  if (tools["customer-query"] && supportsTools) {
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
  }

  if (tools["web-search"] && supportsTools) {
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
  }

  if (tools["itinerary-planning"] && supportsTools) {
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
  }

  if (tools["model-inference"] && supportsTools) {
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
  }

  if (tools["code-evaluation"] && supportsTools) {
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
  }

  if (tools["destination-recommendation"] && supportsTools) {
    const mcpServerConfig = mcpToolsConfig["destination-recommendation"];
    const tools = await mcp(mcpServerConfig.config).tools();
    const destinationRecommendationAgent = agent({
      name: "DestinationRecommendationAgent",
      systemPrompt:
        "Suggests destinations based on customer preferences and requirements.",
      tools,
      llm,
      verbose,
    });
    agentsList.push(destinationRecommendationAgent);
    handoffTargets.push(destinationRecommendationAgent);
    toolsList.push(...tools);
  }

  // If no agents could be created (LLM doesn't support tools), use simple chat
  if (agentsList.length === 0) {
    console.log("No agents created - LLM doesn't support tool calls. Using simple chat engine.");
    const chatEngine = new SimpleChatEngine({ llm });
    return chatEngine;
  }

  // Build list of agent names for handoff (excluding the triage agent itself)
  const agentNames = agentsList
    .map((a) => (a as any).name || '')
    .filter((name) => name && name !== "TravelAgent");

  // Define the triage agent that will determine the best course of action
  const travelAgent = agent({
    name: "TravelAgent",
    systemPrompt:
      "Acts as a triage agent to determine the best course of action for the user's query. If you cannot handle the query, please pass it to the next agent. If you can handle the query, please do so.",
    tools: [...toolsList],
    canHandoffTo: agentNames,
    llm,
    verbose,
  });

  // Add triage agent to the list if it's not already there
  if (!agentsList.find((a) => (a as any).name === "TravelAgent")) {
    agentsList.push(travelAgent);
  }

  console.log("Agents list:", agentsList.map((a) => (a as any).name));
  console.log("Handoff targets:", agentNames);
  console.log("Tools list:", JSON.stringify(toolsList, null, 2));

  // Create the multi-agent workflow
  return multiAgent({
    agents: agentsList,
    rootAgent: travelAgent,
    verbose,
  });
}

