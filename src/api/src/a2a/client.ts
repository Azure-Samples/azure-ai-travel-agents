/**
 * A2A Client Implementation
 * 
 * Implements a JSON-RPC 2.0 client for communicating with A2A servers
 */

import { 
  A2AClientConfig, 
  AgentCard,
  JsonRpcRequest, 
  JsonRpcResponse,
  A2ADiscoveryRequest,
  A2ADiscoveryResponse,
  A2AExecuteRequest,
  A2AExecuteResponse,
  A2AStatusRequest,
  A2AStatusResponse,
  A2AErrorCode,
  A2A_JSONRPC_VERSION
} from "./types.js";

export class A2AClient {
  private config: A2AClientConfig;
  private requestIdCounter: number = 1;

  constructor(config: A2AClientConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      ...config
    };
  }

  /**
   * Discover available agents on the A2A server
   */
  public async discover(filter?: string[]): Promise<AgentCard[]> {
    const request: A2ADiscoveryRequest = {
      jsonrpc: A2A_JSONRPC_VERSION,
      method: "a2a.discover",
      params: filter ? { filter } : undefined,
      id: this.generateRequestId()
    };

    const response = await this.sendRequest<A2ADiscoveryResponse>(request);
    
    if (response.error) {
      throw new Error(`Discovery failed: ${response.error.message}`);
    }

    return response.result?.agents || [];
  }

  /**
   * Execute a capability on a remote agent
   */
  public async execute(
    agentId: string, 
    capability: string, 
    input: any, 
    context?: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<any> {
    const request: A2AExecuteRequest = {
      jsonrpc: A2A_JSONRPC_VERSION,
      method: "a2a.execute",
      params: {
        agent_id: agentId,
        capability,
        input,
        context,
        metadata
      },
      id: this.generateRequestId()
    };

    const response = await this.sendRequest<A2AExecuteResponse>(request);
    
    if (response.error) {
      throw new Error(`Execution failed: ${response.error.message}`);
    }

    return response.result?.output;
  }

  /**
   * Get status of an agent or the server
   */
  public async getStatus(agentId?: string): Promise<{ status: string; message?: string; load?: number }> {
    const request: A2AStatusRequest = {
      jsonrpc: A2A_JSONRPC_VERSION,
      method: "a2a.status",
      params: agentId ? { agent_id: agentId } : undefined,
      id: this.generateRequestId()
    };

    const response = await this.sendRequest<A2AStatusResponse>(request);
    
    if (response.error) {
      throw new Error(`Status check failed: ${response.error.message}`);
    }

    return response.result!;
  }

  /**
   * Check if a specific agent is available and capable
   */
  public async isAgentAvailable(agentId: string, capability?: string): Promise<boolean> {
    try {
      const agents = await this.discover([agentId]);
      const agent = agents.find(a => a.id === agentId);
      
      if (!agent) {
        return false;
      }

      if (capability) {
        return agent.capabilities.some(cap => cap.name === capability);
      }

      const status = await this.getStatus(agentId);
      return status.status === "active";
    } catch (error) {
      return false;
    }
  }

  /**
   * List all available agents with their capabilities
   */
  public async listAgents(): Promise<AgentCard[]> {
    return this.discover();
  }

  private async sendRequest<T extends JsonRpcResponse>(request: JsonRpcRequest): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retries!; attempt++) {
      try {
        const response = await this.makeHttpRequest(request);
        return response as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.config.retries!) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error("Request failed after all retries");
  }

  private async makeHttpRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Add authentication header if configured
      if (this.config.authentication) {
        switch (this.config.authentication.type) {
          case 'bearer':
            headers['Authorization'] = `Bearer ${this.config.authentication.details?.token}`;
            break;
          case 'basic':
            const credentials = btoa(`${this.config.authentication.details?.username}:${this.config.authentication.details?.password}`);
            headers['Authorization'] = `Basic ${credentials}`;
            break;
          case 'custom':
            if (this.config.authentication.details?.headers) {
              Object.assign(headers, this.config.authentication.details.headers);
            }
            break;
        }
      }

      const response = await fetch(`${this.config.baseUrl}/a2a`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const jsonResponse = await response.json();
      
      // Validate JSON-RPC response format
      if (!this.isValidJsonRpcResponse(jsonResponse)) {
        throw new Error("Invalid JSON-RPC response format");
      }

      return jsonResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.config.timeout}ms`);
        }
        throw error;
      }
      
      throw new Error(String(error));
    }
  }

  private isValidJsonRpcResponse(response: any): response is JsonRpcResponse {
    return (
      response &&
      typeof response === 'object' &&
      response.jsonrpc === A2A_JSONRPC_VERSION &&
      (response.result !== undefined || response.error !== undefined) &&
      (response.id !== undefined)
    );
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${this.requestIdCounter++}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * A2A Agent Registry - for discovering and managing multiple A2A servers
 */
export class A2AAgentRegistry {
  private clients: Map<string, A2AClient>;
  private agentDirectory: Map<string, { client: A2AClient; card: AgentCard }>;

  constructor() {
    this.clients = new Map();
    this.agentDirectory = new Map();
  }

  /**
   * Register an A2A server
   */
  public async registerServer(name: string, config: A2AClientConfig): Promise<void> {
    const client = new A2AClient(config);
    this.clients.set(name, client);

    // Discover agents on this server
    try {
      const agents = await client.discover();
      agents.forEach(agent => {
        this.agentDirectory.set(agent.id, { client, card: agent });
      });
    } catch (error) {
      console.warn(`Failed to discover agents on server '${name}': ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find an agent by ID across all registered servers
   */
  public findAgent(agentId: string): { client: A2AClient; card: AgentCard } | undefined {
    return this.agentDirectory.get(agentId);
  }

  /**
   * Execute a capability on any available agent
   */
  public async execute(agentId: string, capability: string, input: any, context?: Record<string, any>): Promise<any> {
    const agentInfo = this.findAgent(agentId);
    if (!agentInfo) {
      throw new Error(`Agent '${agentId}' not found in registry`);
    }

    return agentInfo.client.execute(agentId, capability, input, context);
  }

  /**
   * List all available agents across all servers
   */
  public listAllAgents(): AgentCard[] {
    return Array.from(this.agentDirectory.values()).map(info => info.card);
  }

  /**
   * Refresh agent directory by re-discovering all servers
   */
  public async refresh(): Promise<void> {
    this.agentDirectory.clear();

    for (const [name, client] of this.clients.entries()) {
      try {
        const agents = await client.discover();
        agents.forEach(agent => {
          this.agentDirectory.set(agent.id, { client, card: agent });
        });
      } catch (error) {
        console.warn(`Failed to refresh agents on server '${name}': ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
}