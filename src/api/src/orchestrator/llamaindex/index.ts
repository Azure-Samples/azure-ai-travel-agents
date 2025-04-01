import { agent, multiAgent } from "llamaindex";
import dotenv from "dotenv";
import { mcpTools } from "./mcp-tools.js";
import { llm } from "./providers/azure-openai.js";
dotenv.config({
  path: "./.env.dev",
});

// Function to set up agents and return the multiAgent instance
export async function setupAgents(tools: {search: boolean}) {
  const echoAgent = agent({
    name: "EchoAgent",
    description: "Echo back the received input. Do not respond with anything else. Always call the tools.",
    tools: await mcpTools("Echo", process.env.TOOL_ECHO_PING_URL as string),
    llm: await llm(),
    verbose: true,
  });

  const customerQuery = agent({
    name: "CustomerQueryAgent",
    description:
      "Assists employees in better understanding customer needs, facilitating more accurate and personalized service. This agent is particularly useful for handling nuanced queries, such as specific travel preferences or budget constraints, which are common in travel agency interactions.",
    tools: await mcpTools("CustomerQuery", process.env.TOOL_CUSTOMER_QUERY_URL as string),
    llm: await llm(),
    canHandoffTo: [echoAgent],
    verbose: true,
  });

  let agentsList = [customerQuery, echoAgent];
  let handoffTargets = [echoAgent];

  // Conditionally create and include web search agent if enabled
  if (tools["search"]) {
    console.log('Including Web Search Agent in the workflow');
    const webSearchAgent = agent({
      name: "WebSearchAgent",
      description: "Searches the web for up-to-date travel information using Bing Search.",
      tools: await mcpTools("WebSearch", process.env.TOOL_WEB_SEARCH_URL as string),
      llm: await llm(),
      verbose: true,
    });
    
    // Add web search agent to the agents list
    agentsList.push(webSearchAgent);
    handoffTargets.push(webSearchAgent);
  }

  // Create the multi-agent workflow
  const agents = multiAgent({
    agents: agentsList,
    rootAgent: customerQuery,
    verbose: true,
  });

  return agents;
}