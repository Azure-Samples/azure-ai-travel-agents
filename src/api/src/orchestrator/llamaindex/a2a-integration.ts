/**
 * A2A Integration for LlamaIndex Orchestrator
 * 
 * Integrates the A2A protocol with the existing LlamaIndex-based agent system
 */

import { agent } from "llamaindex";
import { 
  A2AServer, 
  A2AClient, 
  A2AAgentRegistry,
  A2ATravelAgent,
  TravelAgentFactory,
  A2AServerConfig,
  A2AClientConfig 
} from "../../a2a/index.js";

export interface A2AIntegrationConfig {
  server?: {
    enabled: boolean;
    port: number;
    host: string;
  };
  client?: {
    enabled: boolean;
    registries: Array<{
      name: string;
      baseUrl: string;
      authentication?: any;
    }>;
  };
  enableAgentToAgentCommunication?: boolean;
}

export class A2AOrchestrator {
  private server?: A2AServer;
  private registry: A2AAgentRegistry;
  private config: A2AIntegrationConfig;
  private a2aAgents: Map<string, A2ATravelAgent>;
  private llamaAgents: Map<string, any>;

  constructor(config: A2AIntegrationConfig) {
    this.config = config;
    this.registry = new A2AAgentRegistry();
    this.a2aAgents = new Map();
    this.llamaAgents = new Map();
  }

  /**
   * Initialize A2A integration
   */
  public async initialize(): Promise<void> {
    // Setup A2A server if enabled
    if (this.config.server?.enabled) {
      await this.setupA2AServer();
    }

    // Setup A2A client registries if enabled
    if (this.config.client?.enabled && this.config.client.registries?.length > 0) {
      await this.setupA2AClients();
    }
  }

  /**
   * Register a LlamaIndex agent for A2A communication
   */
  public registerAgent(agentType: string, llamaAgent: any): void {
    this.llamaAgents.set(agentType, llamaAgent);

    // Create A2A wrapper based on agent type
    let a2aAgent: A2ATravelAgent;
    const baseUrl = this.config.server?.enabled 
      ? `http://${this.config.server.host}:${this.config.server.port}` 
      : undefined;

    switch (agentType) {
      case "triage":
        a2aAgent = TravelAgentFactory.createTriageAgent(llamaAgent, baseUrl);
        break;
      case "customer-query":
        a2aAgent = TravelAgentFactory.createCustomerQueryAgent(llamaAgent, baseUrl);
        break;
      case "destination-recommendation":
        a2aAgent = TravelAgentFactory.createDestinationAgent(llamaAgent, baseUrl);
        break;
      case "itinerary-planning":
        a2aAgent = TravelAgentFactory.createItineraryAgent(llamaAgent, baseUrl);
        break;
      case "web-search":
        a2aAgent = TravelAgentFactory.createWebSearchAgent(llamaAgent, baseUrl);
        break;
      default:
        // Create a generic agent
        a2aAgent = new A2ATravelAgent(
          `${agentType}-agent`,
          `${agentType.charAt(0).toUpperCase() + agentType.slice(1)} Agent`,
          `A2A-enabled ${agentType} agent`,
          [{
            type: "text",
            name: "execute",
            description: `Execute ${agentType} capability`,
            inputSchema: { type: "object", properties: { query: { type: "string" } } },
            outputSchema: { type: "object", properties: { result: { type: "string" } } }
          }],
          llamaAgent,
          baseUrl
        );
    }

    this.a2aAgents.set(agentType, a2aAgent);

    // Add to server if it exists
    if (this.server) {
      this.server.addAgent(a2aAgent);
    }
  }

  /**
   * Execute an agent capability via A2A protocol
   */
  public async executeAgent(agentId: string, capability: string, input: any, context?: Record<string, any>): Promise<any> {
    // Try local agents first
    const localAgent = this.a2aAgents.get(agentId) || Array.from(this.a2aAgents.values()).find(a => a.id === agentId);
    if (localAgent) {
      return localAgent.execute(capability, input, context);
    }

    // Try remote agents via registry
    try {
      return await this.registry.execute(agentId, capability, input, context);
    } catch (error) {
      throw new Error(`Failed to execute agent '${agentId}' with capability '${capability}': ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Discover available agents (local and remote)
   */
  public async discoverAgents(): Promise<Array<{ id: string; name: string; capabilities: string[]; source: "local" | "remote" }>> {
    const agents = [];

    // Add local agents
    for (const [type, agent] of this.a2aAgents.entries()) {
      agents.push({
        id: agent.id,
        name: agent.name,
        capabilities: agent.capabilities.map(cap => cap.name),
        source: "local" as const
      });
    }

    // Add remote agents
    const remoteAgents = this.registry.listAllAgents();
    for (const agent of remoteAgents) {
      agents.push({
        id: agent.id,
        name: agent.name,
        capabilities: agent.capabilities.map(cap => cap.name),
        source: "remote" as const
      });
    }

    return agents;
  }

  /**
   * Enable agent-to-agent communication
   * This allows agents to discover and communicate with each other directly
   */
  public async enableAgentToAgentCommunication(): Promise<void> {
    if (!this.config.enableAgentToAgentCommunication) {
      return;
    }

    // Create A2A client for each agent to use
    const clientConfig: A2AClientConfig = {
      baseUrl: `http://${this.config.server?.host || "localhost"}:${this.config.server?.port || 3001}`,
      timeout: 30000
    };

    const client = new A2AClient(clientConfig);

    // TODO: Enhance agents with A2A communication capabilities
    // This would involve modifying the LlamaIndex agents to use A2A for handoffs
    console.log("A2A agent-to-agent communication enabled");
  }

  /**
   * Get status of all agents
   */
  public async getAgentsStatus(): Promise<Record<string, any>> {
    const status: Record<string, any> = {};

    // Local agents
    for (const [type, agent] of this.a2aAgents.entries()) {
      try {
        status[type] = await agent.getStatus();
      } catch (error) {
        status[type] = { status: "error", message: error instanceof Error ? error.message : String(error) };
      }
    }

    return status;
  }

  /**
   * Shutdown A2A integration
   */
  public async shutdown(): Promise<void> {
    // Shutdown all local agents
    for (const agent of this.a2aAgents.values()) {
      await agent.shutdown();
    }

    // Shutdown server if running
    if (this.server) {
      await this.server.stop();
    }
  }

  private async setupA2AServer(): Promise<void> {
    const serverConfig: A2AServerConfig = {
      port: this.config.server!.port,
      host: this.config.server!.host,
      agents: Array.from(this.a2aAgents.values()),
      cors: {
        enabled: true,
        origins: ["*"] // TODO: Configure properly for production
      },
      logging: {
        enabled: true,
        level: "info"
      }
    };

    this.server = new A2AServer(serverConfig);
    await this.server.start();
    
    console.log(`A2A Server started on ${serverConfig.host}:${serverConfig.port}`);
  }

  private async setupA2AClients(): Promise<void> {
    if (!this.config.client?.registries) {
      return;
    }

    for (const registryConfig of this.config.client.registries) {
      try {
        const clientConfig: A2AClientConfig = {
          baseUrl: registryConfig.baseUrl,
          authentication: registryConfig.authentication,
          timeout: 30000,
          retries: 3
        };

        await this.registry.registerServer(registryConfig.name, clientConfig);
        console.log(`Registered A2A server: ${registryConfig.name} at ${registryConfig.baseUrl}`);
      } catch (error) {
        console.warn(`Failed to register A2A server '${registryConfig.name}': ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Get the A2A server instance (if running)
   */
  public getServer(): A2AServer | undefined {
    return this.server;
  }

  /**
   * Get the A2A agent registry
   */
  public getRegistry(): A2AAgentRegistry {
    return this.registry;
  }

  /**
   * Get local A2A agents
   */
  public getLocalAgents(): Map<string, A2ATravelAgent> {
    return this.a2aAgents;
  }
}