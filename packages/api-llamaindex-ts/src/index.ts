import dotenv from "dotenv";
dotenv.config();

import { TravelAgentsWorkflow } from "./graph/index.js";
import { llm as llmProvider } from "./providers/index.js";
import { McpServerDefinition } from "./utils/types.js";

// Function to set up agents and return the multiAgent instance
// export async function setupAgents(filteredTools: McpServerDefinition[] = []) {
//   const tools = Object.fromEntries(
//     filteredTools.map((tool) => [tool.id, true])
//   );
//   console.log("Filtered tools:", tools);

//   let agents = [];
//   let handoffTargets = [];
//   let mcpTools = [];
//   const verbose = false;
//   const mcpToolsConfig = McpToolsConfig();

//   let llm: ToolCallLLM = {} as ToolCallLLM;
//   try {
//     llm = await llmProvider();
//   } catch (error) {
//     throw new Error(error instanceof Error ? error.message : String(error));
//   }

//   if (tools["echo-ping"]) {
//     const mcpServerConfig = mcpToolsConfig["echo-ping"].config;
//     const tools = await mcp(mcpServerConfig).tools();
//     const echoAgent = agent({
//       name: "EchoAgent",
//       systemPrompt:
//         "Echo back the received input. Do not respond with anything else. Always call the tools.",
//       tools,
//       llm,
//       verbose,
//     });
//     agents.push(echoAgent);
//     handoffTargets.push(echoAgent);
//     mcpTools.push(...tools);
//   }

//   if (tools["customer-query"]) {
//     const mcpServerConfig = mcpToolsConfig["customer-query"];
//     const tools = await mcp(mcpServerConfig.config).tools();
//     const customerQuery = agent({
//       name: "CustomerQueryAgent",
//       systemPrompt:
//         "Assists employees in better understanding customer needs, facilitating more accurate and personalized service. This agent is particularly useful for handling nuanced queries, such as specific travel preferences or budget constraints, which are common in travel agency interactions.",
//       tools,
//       llm,
//       verbose,
//     });
//     agents.push(customerQuery);
//     handoffTargets.push(customerQuery);
//     mcpTools.push(...tools);
//   }

//   if (tools["itinerary-planning"]) {
//     const mcpServerConfig = mcpToolsConfig["itinerary-planning"];
//     const tools = await mcp(mcpServerConfig.config).tools();
//     const itineraryPlanningAgent = agent({
//       name: "ItineraryPlanningAgent",
//       systemPrompt:
//         "Creates a travel itinerary based on user preferences and requirements.",
//       tools,
//       llm,
//       verbose,
//     });
//     agents.push(itineraryPlanningAgent);
//     handoffTargets.push(itineraryPlanningAgent);
//     mcpTools.push(...tools);
//   }

//   if (tools["destination-recommendation"]) {
//     const mcpServerConfig = mcpToolsConfig["destination-recommendation"];
//     const tools = await mcp(mcpServerConfig.config).tools();
//     const destinationRecommendationAgent = agent({
//       name: "DestinationRecommendationAgent",
//       systemPrompt:
//         "Suggests destinations based on customer preferences and requirements.",
//       tools,
//       llm,
//       verbose,
//     });
//     agents.push(destinationRecommendationAgent);
//     handoffTargets.push(destinationRecommendationAgent);
//     mcpTools.push(...tools);
//   }

//   // Define the triage agent taht will determine the best course of action

//   const travelAgent = agent({
//     name: "TravelAgent",
//     systemPrompt:
//       "Acts as a triage agent to determine the best course of action for the user's query. If you cannot handle the query, please pass it to the next agent. If you can handle the query, please do so.",
//     tools: [...mcpTools],
//     canHandoffTo: handoffTargets
//       .map((target) => target.getAgents().map((agent) => agent.name))
//       .flat(),
//     llm,
//     verbose,
//   });
//   agents.push(travelAgent);

//   console.log("Agents list:", agents);
//   console.log("Handoff targets:", handoffTargets);
//   console.log("Tools list:", JSON.stringify(mcpTools, null, 2));

//   // Create the multi-agent workflow
//   const supervisor =  multiAgent({
//     agents: agents,
//     rootAgent: travelAgent,
//     verbose,
//   });

//   console.log("Agents created:", Object.keys(agents));
//   console.log("All tools count:", mcpTools.length);

//   return { supervisor, agents, mcpTools };
// }

export async function setupAgents(filteredTools: McpServerDefinition[] = []) {
  console.log("Setting up LlamaIndex.TS-based agents...");
  
  let llm;
  try {
    llm = await llmProvider();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }

  // Create and initialize the workflow
  const workflow = new TravelAgentsWorkflow(llm);
  await workflow.initialize(filteredTools);

  console.log("LlamaIndex.TS workflow initialized successfully");
  
  return workflow;
}

// Re-export McpToolsConfig and types
// Re-export the McpToolsConfig and types
export { McpToolsConfig } from "./tools/index.js";
export type { MCPClientOptions, McpServerDefinition } from "./utils/types.js";
