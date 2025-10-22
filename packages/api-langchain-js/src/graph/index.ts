import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { McpServerDefinition } from "../utils/types.js";
import { AgentState, setupAgents } from "../agents/index.js";

export interface WorkflowState extends AgentState {
  messages: BaseMessage[];
  currentAgent?: string;
  toolsOutput?: any[];
  next?: string;
}

export class TravelAgentsWorkflow {
  private llm: BaseChatModel;
  private agents: any[] = [];
  private supervisor: any;

  constructor(llm: BaseChatModel) {
    this.llm = llm;
  }

  async initialize(filteredTools: McpServerDefinition[] = []) {
    console.log("Initializing Langchain workflow with filtered tools:", filteredTools.map(t => t.id));
    
    // Setup agents and tools
    const { agents, supervisor } = await setupAgents(filteredTools, this.llm);
    this.agents = agents;
    this.supervisor = supervisor;

    console.log("Langchain workflow initialized successfully");
    console.log("Available agents:", Object.keys(this.agents));
  }

  async *run(input: string) {
    if (Object.keys(this.agents).length === 0) {
      throw new Error("Workflow not initialized. Call initialize() first.");
    }

    // Compile and run
    const app = this.supervisor.compile();
    const agent = "Supervisor";

    try {
      // Create initial state with HumanMessage
      const messages = [new HumanMessage(input)];

      // Stream events from the agent execution using streamEvents
      const eventStream = app.streamEvents(
        { messages },
        { version: "v2" }
      );

      for await (const event of eventStream) {
        // Filter and yield relevant events
        if (event.event === "on_chat_model_stream") {
          // Stream LLM tokens
          yield {
            eventName: "llm_token",
            data: {
              agent,
              chunk: event.data?.chunk,
            },
          };
        } else if (event.event === "on_tool_start") {
          // Tool execution started
          yield {
            eventName: "tool_start",
            data: {
              agent,
              tool: event.name,
              input: event.data?.input,
            },
          };
        } else if (event.event === "on_tool_end") {
          // Tool execution completed
          yield {
            eventName: "tool_end",
            data: {
              agent,
              tool: event.name,
              output: event.data?.output,
            },
          };
        } else if (event.event === "on_chain_end" && event.name === "LangGraph") {
          // Agent completed - yield final response
          yield {
            eventName: "agent_complete",
            data: {
              agent,
              messages: event.data?.output?.messages || [],
            },
          };
        }
        else {
          // Yield other events for debugging
          yield {
            eventName: event.event,
            data: {
              agent,
              ...event.data,
            },
          };
        }
      }

    } catch (error) {
      console.error("Error in workflow execution:", error);
      yield {
        eventName: "workflow_error",
        data: {
          agent,
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }
}