import { agent, multiAgent, ToolCallLLM } from "llamaindex";
import dotenv from "dotenv";
import { McpServerDefinition, mcpTools } from "../../mcp/mcp-tools.js";
import { type McpServerName, McpToolsConfig } from "./tools/index.js";
import { llm as llmProvider } from "./providers/azure-openai.js";
dotenv.config({
  path: "./.env.dev",
});

// Function to set up agents and return the multiAgent instance
export async function setupAgents(
  filteredTools: McpServerDefinition[] = []
) {
  
  const tools = Object.fromEntries(
    filteredTools.map((tool) => [tool.serverName, true])
  );
  console.log("Filtered tools:", tools);

  let agentsList = [];
  let handoffTargets = [];
  const verbose = false;
  const mcpToolsConfig = McpToolsConfig();

  let llm: ToolCallLLM = {} as ToolCallLLM;
  try {
    llm = await llmProvider();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }

  if (tools["echo-ping"]) {
    const echoAgent = agent({
      name: "EchoAgent",
      description:
        "Echo back the received input. Do not respond with anything else. Always call the tools.",
      tools: await mcpTools(mcpToolsConfig["echo-ping"]),
      llm,
      verbose,
    });
    agentsList.push(echoAgent);
    handoffTargets.push(echoAgent);
  }

  if (tools["customer-query"]) {
    const customerQuery = agent({
      name: "CustomerQueryAgent",
      description:
        "Assists employees in better understanding customer needs, facilitating more accurate and personalized service. This agent is particularly useful for handling nuanced queries, such as specific travel preferences or budget constraints, which are common in travel agency interactions.",
      tools: await mcpTools(mcpToolsConfig["customer-query"]),
      llm,
      verbose,
    });
    agentsList.push(customerQuery);
    handoffTargets.push(customerQuery);
  }

  if (tools["web-search"]) {
    console.log("Including Web Search Agent in the workflow");
    const webSearchAgent = agent({
      name: "WebSearchAgent",
      description:
        "Searches the web for up-to-date travel information using Bing Search.",
      tools: await mcpTools(mcpToolsConfig["web-search"]),
      llm,
      verbose,
    });
    agentsList.push(webSearchAgent);
    handoffTargets.push(webSearchAgent);
  }

  if (tools["itinerary-planning"]) {
    const itineraryPlanningAgent = agent({
      name: "ItineraryPlanningAgent",
      description:
        "Creates a travel itinerary based on user preferences and requirements.",
      tools: await mcpTools(mcpToolsConfig["itinerary-planning"]),
      llm,
      verbose,
    });
    agentsList.push(itineraryPlanningAgent);
    handoffTargets.push(itineraryPlanningAgent);
  }

  if (tools["model-inference"]) {
    const modelInferenceAgent = agent({
      name: "ModelInferenceAgent",
      description:
        "Performs model inference tasks based on user input and requirements.",
      tools: await mcpTools(mcpToolsConfig["model-inference"]),
      llm,
      verbose,
    });
    agentsList.push(modelInferenceAgent);
    handoffTargets.push(modelInferenceAgent);
  }

  if (tools["code-evaluation"]) {
    const codeEvaluationAgent = agent({
      name: "CodeEvaluationAgent",
      description:
        "Evaluates code snippets and provides feedback or suggestions.",
      tools: await mcpTools(mcpToolsConfig["code-evaluation"]),
      llm,
      verbose,
    });
    agentsList.push(codeEvaluationAgent);
    handoffTargets.push(codeEvaluationAgent);
  }

  // Define the triage agent taht will determine the best course of action
  
  const triageAgent = agent({
    name: "TriageAgent",
    description:
      "Acts as a triage agent to determine the best course of action for the user's query. If you cannot handle the query, please pass it to the next agent. If you can handle the query, please do so.",
    tools: [
      {
        call: async (query: any) => query,
        metadata: {
          name: "Identity",
          description: "Returns the input as is.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The input query to be returned as is.",
              },
            },
            required: ["query"],
          },
        },
      },
    ],
    canHandoffTo: handoffTargets.map(target => target.getAgents().map(agent => agent.name)).flat(),
    llm,
    verbose,
  });
  agentsList.push(triageAgent);

  console.log("Agents list:", agentsList);
  console.log("Handoff targets:", handoffTargets);

  // Create the multi-agent workflow
  const agents = multiAgent({
    agents: agentsList,
    rootAgent: triageAgent,
    verbose,
  });

  return agents;
}
