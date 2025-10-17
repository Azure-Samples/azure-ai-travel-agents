import { ToolCallLLM } from "@llamaindex/core/llms";
import {
  agentInputEvent,
  agentOutputEvent,
  agentStreamEvent,
  agentToolCallEvent,
  agentToolCallResultEvent,
  AgentWorkflow,
  stopAgentEvent,
  Workflow,
} from "@llamaindex/workflow";
import { McpServerDefinition } from "../utils/types.js";
import { setupAgents } from "../agents/index.js";

export class TravelAgentsWorkflow {
  private llm: ToolCallLLM;
  private agents: any[] = [];
  private supervisor: AgentWorkflow | null = null;

  constructor(llm: ToolCallLLM) {
    this.llm = llm;
  }

  async initialize(filteredTools: McpServerDefinition[] = []) {
    console.log(
      "Initializing Langchain workflow with filtered tools:",
      filteredTools.map((t) => t.id)
    );

    // Setup agents and tools
    const { agents, supervisor } = await setupAgents(filteredTools, this.llm);
    this.agents = agents;
    this.supervisor = supervisor;

    console.log("Langchain workflow initialized successfully");
    console.log("Available agents:", Object.keys(this.agents));
  }

  async *run(input: string) {
    if (!this.supervisor) {
      throw new Error("Supervisor not initialized. Call initialize() first.");
    }

    console.log("Running workflow with input:", input);

    try {
      const eventStream = this.supervisor.runStream(input);
      for await (let event of eventStream) {
        const evt = {
          ...event,
          eventName: event.toString(),
          data: {
            ...event.data,
            agent: event.data.currentAgentName,
          }
        };
        yield evt;
      }
    } catch (error) {
      console.error("Error in workflow execution:", error);
      yield {
        eventName: "error",
        data: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
