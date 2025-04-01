import { agent, multiAgent } from "llamaindex";
import dotenv from "dotenv";
import { mcpTools } from "./mcp-tools.js";
import { llm } from "./providers/azure-openai.js";
dotenv.config({
  path: "./.env.dev",
});

type ToolsDefinition = {
  search: boolean;
  echo: boolean;
  customer_query: boolean;
};
// Function to set up agents and return the multiAgent instance
export async function setupAgents(tools: ToolsDefinition) {
  let agentsList = [];
  let handoffTargets = [];

  const triageAgent = agent({
    name: "TriageAgent",
    description:
      "Acts as a triage agent to determine the best course of action for the user's query. It can either search the web or hand off to another agent.",
    tools: [{
      call: async (query: any) => query,
      metadata: {
        name: "Identity",
        description: "Returns the input as is.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description:
                "The input query to be returned as is.",
            },
          },
          required: ["query"],
        },
      }
    }],
    llm: await llm(),
    canHandoffTo: [],
    verbose: true,
  });
  agentsList.push(triageAgent);

  if (tools["echo"]) {
    const echoAgent = agent({
      name: "EchoAgent",
      description:
        "Echo back the received input. Do not respond with anything else. Always call the tools.",
      tools: await mcpTools("Echo", process.env.TOOL_ECHO_PING_URL as string),
      llm: await llm(),
      verbose: true,
    });
    // Add echo agent to the agents list
    agentsList.push(echoAgent);
    handoffTargets.push(echoAgent);
  }

  if (tools["customer_query"]) {
    const customerQuery = agent({
      name: "CustomerQueryAgent",
      description:
        "Assists employees in better understanding customer needs, facilitating more accurate and personalized service. This agent is particularly useful for handling nuanced queries, such as specific travel preferences or budget constraints, which are common in travel agency interactions.",
      tools: await mcpTools(
        "CustomerQuery",
        process.env.TOOL_CUSTOMER_QUERY_URL as string
      ),
      llm: await llm(),
      canHandoffTo: [],
      verbose: true,
    });
    // Add customer query agent to the agents list
    agentsList.push(customerQuery);
  }

  if (tools["search"]) {
    console.log("Including Web Search Agent in the workflow");
    const webSearchAgent = agent({
      name: "WebSearchAgent",
      description:
        "Searches the web for up-to-date travel information using Bing Search.",
      tools: await mcpTools(
        "WebSearch",
        process.env.TOOL_WEB_SEARCH_URL as string
      ),
      llm: await llm(),
      verbose: true,
    });

    // Add web search agent to the agents list
    handoffTargets.push(webSearchAgent);
    agentsList.push(webSearchAgent);
  }

  // Create the multi-agent workflow
  const agents = multiAgent({
    agents: agentsList,
    rootAgent: triageAgent,
    verbose: true,
  });

  return agents;
}
