import { mcp } from "@llamaindex/tools";
import dotenv from "dotenv";
import { agent, multiAgent, ToolCallLLM } from "llamaindex";
import { McpServerDefinition } from "../../mcp/mcp-tools.js";
import { llm as llmProvider } from "./providers/azure-openai.js";
import { McpToolsConfig } from "./tools/index.js";
dotenv.config({
  path: "./.env.dev",
});

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
  }

  // Define the triage agent taht will determine the best course of action

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

  console.log("Agents list:", agentsList);
  console.log("Handoff targets:", handoffTargets);
  console.log("Tools list:", JSON.stringify(toolsList, null, 2));

  // Create the multi-agent workflow
  return multiAgent({
    agents: agentsList,
    rootAgent: travelAgent,
    verbose,
  });
}
