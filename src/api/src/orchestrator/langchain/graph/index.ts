import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { setupAgents, AgentState } from "../agents/index.js";
import { McpServerDefinition } from "../../../mcp/mcp-tools.js";

export interface WorkflowState extends AgentState {
  messages: BaseMessage[];
  currentAgent?: string;
  toolsOutput?: any[];
  next?: string;
}

export class TravelAgentsWorkflow {
  private llm: BaseChatModel;
  private agents: { [key: string]: any } = {};
  private tools: DynamicStructuredTool[] = [];

  constructor(llm: BaseChatModel) {
    this.llm = llm;
  }

  async initialize(filteredTools: McpServerDefinition[] = []) {
    console.log("Initializing Langchain workflow with filtered tools:", filteredTools.map(t => t.id));
    
    // Setup agents and tools
    const { agents, tools } = await setupAgents(filteredTools, this.llm);
    this.agents = agents;
    this.tools = tools;

    console.log("Langchain workflow initialized successfully");
    console.log("Available agents:", Object.keys(this.agents));
  }

  private async routeToAgent(input: string): Promise<string> {
    // Simple routing logic - for now, we'll route based on keywords or use TravelAgent as default
    const content = input.toLowerCase();

    let nextAgent = "TravelAgent";

    // Route based on content keywords
    if (content.includes("search") || content.includes("web")) {
      nextAgent = "WebSearchAgent";
    } else if (content.includes("itinerary") || content.includes("plan")) {
      nextAgent = "ItineraryPlanningAgent";
    } else if (content.includes("destination") || content.includes("recommend")) {
      nextAgent = "DestinationRecommendationAgent";
    } else if (content.includes("customer") || content.includes("query")) {
      nextAgent = "CustomerQueryAgent";
    } else if (content.includes("code")) {
      nextAgent = "CodeEvaluationAgent";
    } else if (content.includes("model") || content.includes("inference")) {
      nextAgent = "ModelInferenceAgent";
    } else if (content.includes("echo")) {
      nextAgent = "EchoAgent";
    }

    // Check if the agent exists in our agents list
    if (!this.agents[nextAgent]) {
      nextAgent = "TravelAgent";
    }

    return nextAgent;
  }

  async *run(input: string) {
    if (Object.keys(this.agents).length === 0) {
      throw new Error("Workflow not initialized. Call initialize() first.");
    }

    console.log("Running workflow with input:", input);
    
    // Determine which agent to use
    const selectedAgentName = await this.routeToAgent(input);
    const selectedAgent = this.agents[selectedAgentName];
    
    if (!selectedAgent) {
      throw new Error(`Agent ${selectedAgentName} not found`);
    }

    console.log("Selected agent:", selectedAgentName);

    try {
      // Create initial state
      const initialState: WorkflowState = {
        messages: [new HumanMessage(input)],
        currentAgent: selectedAgentName,
      };

      // Stream events from the agent execution
      yield {
        displayName: "agent_start",
        data: {
          currentAgentName: selectedAgentName,
          messages: initialState.messages,
        },
      };

      // Run the selected agent
      const agentResponse = await selectedAgent.invoke({
        messages: initialState.messages,
      });

      // Yield the response
      yield {
        displayName: "agent_response",
        data: {
          currentAgentName: selectedAgentName,
          messages: [agentResponse],
          response: agentResponse,
        },
      };

      // Final completion event
      yield {
        displayName: "workflow_complete",
        data: {
          currentAgentName: selectedAgentName,
          messages: [agentResponse],
          completed: true,
        },
      };

    } catch (error) {
      console.error("Error in workflow execution:", error);
      yield {
        displayName: "workflow_error",
        data: {
          currentAgentName: selectedAgentName,
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }
}