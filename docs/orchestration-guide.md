---
title: orchestration-guide
createTime: 2025/06/06 13:07:02
---
# LlamaIndex.TS Orchestration Guide

This guide provides comprehensive documentation on how the Azure AI Travel Agents system uses LlamaIndex.TS to orchestrate multi-agent workflows, coordinate MCP servers, and manage complex travel planning scenarios.

## Table of Contents

1. [Orchestration Overview](#orchestration-overview)
2. [Agent Architecture](#agent-architecture)
3. [Triage Agent Pattern](#triage-agent-pattern)
4. [Multi-Agent Coordination](#multi-agent-coordination)
5. [Tool Integration](#tool-integration)
6. [Workflow Management](#workflow-management)
7. [Error Handling & Recovery](#error-handling--recovery)
8. [Performance Optimization](#performance-optimization)

## Orchestration Overview

LlamaIndex.TS serves as the central orchestration layer in the Azure AI Travel Agents system, managing interactions between multiple specialized AI agents and coordinating their access to MCP (Model Context Protocol) servers.

### Key Orchestration Components

- **Multi-Agent System**: Coordinated collection of specialized agents
- **Triage Agent**: Central decision-making agent that routes requests
- **Tool Integration**: Seamless connection to MCP servers
- **Workflow Management**: Complex multi-step process coordination
- **Context Management**: Shared state across agent interactions

### Architecture Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Query    │    │  LlamaIndex.TS  │    │   MCP Servers   │
│                 │    │  Orchestrator   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. Travel Request     │                       │
         │ ─────────────────────▶                       │
         │                       │                       │
         │                       │ 2. Agent Setup       │
         │                       │ ┌─────────────────┐   │
         │                       │ │  setupAgents()  │   │
         │                       │ └─────────────────┘   │
         │                       │                       │
         │                       │ 3. Triage Decision   │
         │                       │ ┌─────────────────┐   │
         │                       │ │ Triage Agent    │   │
         │                       │ │ Analysis        │   │
         │                       │ └─────────────────┘   │
         │                       │                       │
         │                       │ 4. Agent Delegation  │
         │                       │ ┌─────────────────┐   │
         │                       │ │ Specialized     │   │
         │                       │ │ Agents          │   │
         │                       │ └─────────────────┘   │
         │                       │                       │
         │                       │ 5. Tool Calls         │
         │                       │ ─────────────────────▶
         │                       │                       │
         │                       │ 6. Results            │
         │                       │ ◀─────────────────────
         │                       │                       │
         │ 7. Coordinated Reply  │                       │
         │ ◀─────────────────────                       │
```

## Agent Architecture

### Core Agent Setup Function

The `setupAgents()` function is the heart of the orchestration system, creating filtered agents based on available tools and configuring the multi-agent workflow.

```typescript
// src/api/src/orchestrator/llamaindex/index.ts
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

  // Initialize LLM provider (Docker Model Runner or Azure OpenAI)
  let llm: ToolCallLLM = {} as ToolCallLLM;
  try {
    llm = await llmProvider();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }

  // Create specialized agents based on available tools
  if (tools["echo-ping"]) {
    const mcpServerConfig = mcpToolsConfig["echo-ping"].config;
    const tools = await mcp(mcpServerConfig).tools();
    const echoAgent = agent({
      name: "EchoAgent",
      systemPrompt: "You are a helpful assistant that can echo messages and respond to ping requests. Use the echo tool to repeat user messages and the ping tool to test connectivity.",
      tools,
      llm,
      verbose,
    });
    agentsList.push(echoAgent);
    handoffTargets.push(echoAgent);
    toolsList.push(...tools);
  }

  // Add more specialized agents...
  // [Similar pattern for all other agents]

  // Create the central triage agent
  const travelAgent = agent({
    name: "TriageAgent",
    systemPrompt: `You are an intelligent travel planning assistant that coordinates multiple specialized agents to help users plan their trips.

Available agents and their capabilities:
${agentsList.map(agent => `- ${agent.name}: ${getAgentCapabilityDescription(agent.name)}`).join('\n')}

Your role is to:
1. Analyze user travel requests and determine which specialized agents are needed
2. Coordinate between multiple agents for complex requests
3. Ensure all aspects of travel planning are covered
4. Provide comprehensive, well-organized responses

When handling requests:
- For simple echo/ping tests, use EchoAgent
- For destination research, use DestinationRecommendationAgent
- For itinerary planning, use ItineraryPlanningAgent
- For web searches, use WebSearchAgent
- For complex calculations, use CodeEvaluationAgent
- For custom model inference, use ModelInferenceAgent
- For understanding customer needs, use CustomerQueryAgent

Always coordinate multiple agents when the request is complex and requires different types of expertise.`,
    tools: toolsList,
    llm,
    verbose,
  });

  // Create multi-agent workflow
  const multiAgent = new MultiAgentWorkflow(travelAgent, verbose);

  // Add all specialized agents as handoff targets
  handoffTargets.forEach(agent => {
    multiAgent.addWorkflow(agent, agent.name);
  });

  return multiAgent;
}
```

### Agent Capability Descriptions

```typescript
function getAgentCapabilityDescription(agentName: string): string {
  const capabilities = {
    "EchoAgent": "Testing connectivity and echoing messages",
    "CustomerQueryAgent": "Understanding and analyzing customer travel preferences",
    "DestinationRecommendationAgent": "Suggesting destinations based on preferences",
    "ItineraryPlanningAgent": "Creating detailed day-by-day travel itineraries",
    "CodeEvaluationAgent": "Performing calculations and data analysis",
    "ModelInferenceAgent": "Running custom AI model inference tasks",
    "WebSearchAgent": "Searching the web for real-time travel information"
  };
  return capabilities[agentName] || "Specialized travel assistance";
}
```

## Triage Agent Pattern

The Triage Agent serves as the central coordinator, making intelligent decisions about which specialized agents to engage based on the user's request.

### Triage Decision Logic

```typescript
// Simplified triage logic (conceptual)
class TriageAgent {
  async analyzeRequest(userQuery: string): Promise<AgentPlan> {
    const analysis = await this.llm.analyze(userQuery, {
      systemPrompt: `Analyze this travel request and determine which agents are needed:

User Query: "${userQuery}"

Available Agents:
- EchoAgent: For testing and simple responses
- CustomerQueryAgent: For understanding preferences  
- DestinationRecommendationAgent: For destination suggestions
- ItineraryPlanningAgent: For detailed trip planning
- WebSearchAgent: For current information
- CodeEvaluationAgent: For calculations
- ModelInferenceAgent: For AI model tasks

Return a JSON plan with:
{
  "primaryAgent": "agent_name",
  "supportingAgents": ["agent1", "agent2"],
  "reasoning": "explanation of agent selection",
  "executionOrder": ["step1_agent", "step2_agent"]
}`
    });

    return JSON.parse(analysis);
  }

  async executeWorkflow(plan: AgentPlan, userQuery: string): Promise<string> {
    let context = { originalQuery: userQuery, results: {} };
    
    // Execute agents in planned order
    for (const agentName of plan.executionOrder) {
      const agent = this.getAgent(agentName);
      const result = await agent.execute(userQuery, context);
      context.results[agentName] = result;
    }

    // Synthesize final response
    return this.synthesizeResponse(context);
  }
}
```

### Triage Decision Examples

#### Simple Echo Request
```
User: "Can you echo 'Hello World'?"
Triage Decision:
- Primary Agent: EchoAgent
- Supporting Agents: []
- Reasoning: Simple echo request, no travel planning needed
```

#### Complex Travel Planning
```
User: "I want to plan a 7-day trip to Japan in spring, I love culture and food"
Triage Decision:
- Primary Agent: ItineraryPlanningAgent
- Supporting Agents: [DestinationRecommendationAgent, CustomerQueryAgent, WebSearchAgent]
- Execution Order:
  1. CustomerQueryAgent (analyze preferences)
  2. DestinationRecommendationAgent (suggest specific locations)
  3. WebSearchAgent (get current information)
  4. ItineraryPlanningAgent (create detailed itinerary)
```

## Multi-Agent Coordination

### Workflow Orchestration

The `MultiAgentWorkflow` class manages complex interactions between multiple agents:

```typescript
class MultiAgentWorkflow {
  private triageAgent: Agent;
  private specializedAgents: Map<string, Agent>;
  private workflowHistory: WorkflowStep[];

  constructor(triageAgent: Agent, verbose: boolean = false) {
    this.triageAgent = triageAgent;
    this.specializedAgents = new Map();
    this.workflowHistory = [];
  }

  addWorkflow(agent: Agent, agentName: string): void {
    this.specializedAgents.set(agentName, agent);
  }

  async run(query: string, streaming: boolean = false): Promise<string> {
    // Step 1: Triage analysis
    const triageStep = await this.recordStep("triage", async () => {
      return await this.triageAgent.chat(query);
    });

    // Step 2: Extract agent decisions from triage response
    const agentDecisions = await this.extractAgentDecisions(triageStep.result);

    // Step 3: Execute specialized agents
    const results = new Map<string, string>();
    
    for (const decision of agentDecisions) {
      const agent = this.specializedAgents.get(decision.agentName);
      if (agent) {
        const agentStep = await this.recordStep(decision.agentName, async () => {
          // Pass context from previous agents
          const contextualQuery = this.buildContextualQuery(query, results, decision);
          return await agent.chat(contextualQuery);
        });
        
        results.set(decision.agentName, agentStep.result);
      }
    }

    // Step 4: Final synthesis
    const finalStep = await this.recordStep("synthesis", async () => {
      return await this.synthesizeFinalResponse(query, results);
    });

    return finalStep.result;
  }

  private async recordStep<T>(
    stepName: string, 
    operation: () => Promise<T>
  ): Promise<WorkflowStep<T>> {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      const step: WorkflowStep<T> = {
        name: stepName,
        startTime,
        endTime: Date.now(),
        success: true,
        result
      };
      
      this.workflowHistory.push(step);
      return step;
      
    } catch (error) {
      const step: WorkflowStep<T> = {
        name: stepName,
        startTime,
        endTime: Date.now(),
        success: false,
        error: error.message
      };
      
      this.workflowHistory.push(step);
      throw error;
    }
  }
}
```

### Context Sharing Between Agents

```typescript
interface AgentContext {
  originalQuery: string;
  userPreferences?: UserPreferences;
  previousResults: Map<string, any>;
  currentStep: number;
  totalSteps: number;
  metadata: Record<string, any>;
}

class ContextManager {
  private context: AgentContext;

  constructor(originalQuery: string) {
    this.context = {
      originalQuery,
      previousResults: new Map(),
      currentStep: 0,
      totalSteps: 0,
      metadata: {}
    };
  }

  addResult(agentName: string, result: any): void {
    this.context.previousResults.set(agentName, result);
    this.context.currentStep++;
  }

  buildContextualPrompt(baseQuery: string, targetAgent: string): string {
    const relevantResults = this.getRelevantResults(targetAgent);
    
    return `
Original user query: "${this.context.originalQuery}"

Current task: ${baseQuery}

Context from previous agents:
${relevantResults.map(([agent, result]) => 
  `${agent}: ${this.summarizeResult(result)}`
).join('\n')}

Please provide your specialized response based on this context.`;
  }

  private getRelevantResults(targetAgent: string): Array<[string, any]> {
    // Return results that are relevant to the target agent
    const relevanceMap = {
      'ItineraryPlanningAgent': ['CustomerQueryAgent', 'DestinationRecommendationAgent', 'WebSearchAgent'],
      'DestinationRecommendationAgent': ['CustomerQueryAgent'],
      'WebSearchAgent': ['CustomerQueryAgent', 'DestinationRecommendationAgent']
    };

    const relevantAgents = relevanceMap[targetAgent] || [];
    return Array.from(this.context.previousResults.entries())
      .filter(([agentName]) => relevantAgents.includes(agentName));
  }
}
```

## Tool Integration

### MCP Client Integration

```typescript
// Tool integration with MCP servers
import { mcp } from '@llamaindex.ts/llamaindex/mcp';

async function setupMcpTools(serverConfig: McpServerConfig): Promise<Tool[]> {
  try {
    // Create MCP client connection
    const mcpClient = mcp(serverConfig);
    
    // Get available tools from MCP server
    const tools = await mcpClient.tools();
    
    // Wrap MCP tools for LlamaIndex.TS
    return tools.map(tool => ({
      ...tool,
      // Add monitoring wrapper
      call: async (params: any) => {
        const startTime = Date.now();
        const span = tracer.startSpan(`mcp.${tool.name}`);
        
        try {
          span.setAttributes({
            'mcp.server': serverConfig.name,
            'mcp.tool': tool.name,
            'mcp.params': JSON.stringify(params)
          });
          
          const result = await tool.call(params);
          
          span.setStatus({ code: SpanStatusCode.OK });
          return result;
          
        } catch (error) {
          span.recordException(error);
          span.setStatus({ code: SpanStatusCode.ERROR });
          throw error;
        } finally {
          span.addEvent('tool.call.completed', {
            'tool.duration_ms': Date.now() - startTime
          });
          span.end();
        }
      }
    }));
    
  } catch (error) {
    console.error(`Failed to setup MCP tools for ${serverConfig.name}:`, error);
    return [];
  }
}
```

### Tool Selection Strategy

```typescript
class ToolSelector {
  selectToolsForQuery(query: string, availableTools: Tool[]): Tool[] {
    // Analyze query to determine needed tools
    const queryAnalysis = this.analyzeQuery(query);
    
    const selectedTools = [];
    
    // Rule-based tool selection
    if (queryAnalysis.hasLocationRef) {
      selectedTools.push(...this.getLocationTools(availableTools));
    }
    
    if (queryAnalysis.hasTravelPlanning) {
      selectedTools.push(...this.getPlanningTools(availableTools));
    }
    
    if (queryAnalysis.hasWebSearchNeed) {
      selectedTools.push(...this.getSearchTools(availableTools));
    }
    
    if (queryAnalysis.hasCalculationNeed) {
      selectedTools.push(...this.getCalculationTools(availableTools));
    }
    
    return selectedTools;
  }

  private analyzeQuery(query: string): QueryAnalysis {
    const lowerQuery = query.toLowerCase();
    
    return {
      hasLocationRef: /\b(trip|travel|visit|go to|destination)\b/.test(lowerQuery),
      hasTravelPlanning: /\b(plan|itinerary|schedule|organize)\b/.test(lowerQuery),
      hasWebSearchNeed: /\b(current|latest|recent|search|find)\b/.test(lowerQuery),
      hasCalculationNeed: /\b(calculate|compute|budget|cost|distance)\b/.test(lowerQuery)
    };
  }
}
```

## Workflow Management

### Streaming Response Management

```typescript
async function handleStreamingWorkflow(
  query: string, 
  multiAgent: MultiAgentWorkflow
): Promise<AsyncIterable<string>> {
  
  return {
    async *[Symbol.asyncIterator]() {
      // Start with triage
      yield `🤔 Analyzing your travel request...\n\n`;
      
      const triageResult = await multiAgent.triage(query);
      yield `📋 Plan: ${triageResult.reasoning}\n\n`;
      
      // Execute agents sequentially with streaming updates
      for (const agentName of triageResult.executionOrder) {
        yield `🔄 ${agentName} is working...\n`;
        
        const agentResult = await multiAgent.executeAgent(agentName, query);
        yield `✅ ${agentName} completed:\n${agentResult}\n\n`;
      }
      
      // Final synthesis
      yield `🎯 Preparing your comprehensive travel plan...\n`;
      const finalResult = await multiAgent.synthesize();
      yield `\n${finalResult}`;
    }
  };
}
```

### Error Recovery Strategies

```typescript
class WorkflowErrorRecovery {
  async handleAgentFailure(
    failedAgent: string,
    error: Error,
    context: AgentContext
  ): Promise<string> {
    
    console.warn(`Agent ${failedAgent} failed:`, error.message);
    
    // Try fallback strategies
    const fallbackResult = await this.attemptFallback(failedAgent, context);
    
    if (fallbackResult) {
      return fallbackResult;
    }
    
    // Graceful degradation
    return this.gracefulDegradation(failedAgent, context);
  }
  
  private async attemptFallback(
    failedAgent: string, 
    context: AgentContext
  ): Promise<string | null> {
    
    const fallbackStrategies = {
      'WebSearchAgent': () => this.useStaticTravelData(context),
      'ItineraryPlanningAgent': () => this.useBasicPlanningTemplate(context),
      'DestinationRecommendationAgent': () => this.usePopularDestinations(context)
    };
    
    const fallbackFn = fallbackStrategies[failedAgent];
    if (fallbackFn) {
      try {
        return await fallbackFn();
      } catch (fallbackError) {
        console.warn(`Fallback also failed for ${failedAgent}:`, fallbackError);
      }
    }
    
    return null;
  }
  
  private gracefulDegradation(failedAgent: string, context: AgentContext): string {
    return `I encountered an issue with the ${failedAgent.replace('Agent', '')} service, but I can still help you with other aspects of your travel planning. Let me know what specific information you need, and I'll do my best to assist you.`;
  }
}
```

## Performance Optimization

### Concurrent Agent Execution

```typescript
class ConcurrentWorkflowExecutor {
  async executeAgentsInParallel(
    agentTasks: Array<{name: string, query: string, dependencies: string[]}>,
    context: AgentContext
  ): Promise<Map<string, string>> {
    
    const results = new Map<string, string>();
    const executing = new Set<string>();
    const completed = new Set<string>();
    
    while (completed.size < agentTasks.length) {
      // Find tasks ready to execute (dependencies completed)
      const readyTasks = agentTasks.filter(task => 
        !executing.has(task.name) && 
        !completed.has(task.name) &&
        task.dependencies.every(dep => completed.has(dep))
      );
      
      // Execute ready tasks concurrently
      const taskPromises = readyTasks.map(async task => {
        executing.add(task.name);
        
        try {
          const agent = this.getAgent(task.name);
          const result = await agent.execute(task.query, context);
          results.set(task.name, result);
          completed.add(task.name);
        } catch (error) {
          console.error(`Agent ${task.name} failed:`, error);
          completed.add(task.name); // Mark as completed even if failed
        } finally {
          executing.delete(task.name);
        }
      });
      
      // Wait for at least one task to complete
      if (taskPromises.length > 0) {
        await Promise.race(taskPromises);
      } else {
        // No tasks ready, wait a bit (shouldn't happen with proper dependency management)
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }
}
```

### Caching and Optimization

```typescript
class WorkflowOptimizer {
  private resultCache = new Map<string, CachedResult>();
  private performanceMetrics = new Map<string, AgentMetrics>();
  
  async optimizeWorkflow(
    workflow: WorkflowPlan,
    context: AgentContext
  ): Promise<WorkflowPlan> {
    
    // Remove redundant agents
    const optimizedAgents = this.removeRedundantAgents(workflow.agents);
    
    // Reorder for optimal performance
    const reorderedAgents = this.reorderAgentsForPerformance(optimizedAgents);
    
    // Add caching hints
    const cachedPlan = this.addCachingStrategy(reorderedAgents, context);
    
    return {
      ...workflow,
      agents: cachedPlan,
      optimizations: {
        redundantAgentsRemoved: workflow.agents.length - optimizedAgents.length,
        reordered: true,
        cachingEnabled: true
      }
    };
  }
  
  private removeRedundantAgents(agents: AgentTask[]): AgentTask[] {
    // Remove agents that provide overlapping functionality
    const capabilities = new Set<string>();
    
    return agents.filter(agent => {
      const agentCapabilities = this.getAgentCapabilities(agent.name);
      const hasNewCapability = agentCapabilities.some(cap => !capabilities.has(cap));
      
      if (hasNewCapability) {
        agentCapabilities.forEach(cap => capabilities.add(cap));
        return true;
      }
      
      return false;
    });
  }
}
```

This comprehensive orchestration guide demonstrates how LlamaIndex.TS manages complex multi-agent workflows in the Azure AI Travel Agents system, providing the foundation for building sophisticated AI-powered applications that can coordinate multiple specialized services effectively.