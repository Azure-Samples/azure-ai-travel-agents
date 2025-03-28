import { agent, multiAgent } from "llamaindex";

import dotenv from "dotenv";
import { mcpTools } from "./mcp-tools.js";
import { llm } from "./providers/azure-openai.js";
dotenv.config();


export default async function main() {
  const echoAgent = agent({
    name: "EchoAgent",
    description: "Echo back the received input. Do no respond with anything else. Alaways call the tools.",
    tools: await mcpTools(process.env.TOOL_ECHO_PING_URL as string), // TODO: use env var for server URL
    llm: await llm(),
    verbose: true,
  });

  const customerQuery = agent({
    name: "CustomerQueryAgent",
    description:
      "Assists employees in better understanding customer needs, facilitating more accurate and personalized service. This agent is particularly useful for handling nuanced queries, such as specific travel preferences or budget constraints, which are common in travel agency interactions.",
    tools: await mcpTools(process.env.TOOL_CUSTOMER_QUERY_URL as string), // TODO: use env var for server URL
    llm: await llm(),
    canHandoffTo: [echoAgent],
  });

  // Create the multi-agent workflow
  const agents = multiAgent({
    agents: [
      customerQuery, 
      echoAgent
    ],
    rootAgent: customerQuery,
  });

  const context = agents.run("I want to know about the best travel destinations for a family vacation. Handoff to the EchoAgent if needed.");
  for await (const event of context) {
    const { displayName, data } = event;
    if (displayName === "AgentStream") {
      process.stdout.write((data as any).delta);
    }
    else {
      console.log(`(${(data as any).currentAgentName}::${displayName})`);
      console.log({data});
    }
  }
}
