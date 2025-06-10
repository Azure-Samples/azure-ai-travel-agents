/**
 * A2A Server Implementation
 * 
 * Implements a JSON-RPC 2.0 server that exposes agents via the A2A protocol
 */

import express, { Request, Response } from "express";
import cors from "cors";
import { 
  A2AServerConfig, 
  A2AAgent, 
  JsonRpcRequest, 
  JsonRpcResponse, 
  JsonRpcError,
  A2ADiscoveryRequest,
  A2ADiscoveryResponse,
  A2AExecuteRequest,
  A2AExecuteResponse,
  A2AStatusRequest,
  A2AStatusResponse,
  A2AErrorCode,
  A2A_JSONRPC_VERSION
} from "./types.js";

export class A2AServer {
  private app: express.Application;
  private agents: Map<string, A2AAgent>;
  private config: A2AServerConfig;
  private server?: any;

  constructor(config: A2AServerConfig) {
    this.config = config;
    this.agents = new Map();
    this.app = express();
    
    this.setupMiddleware();
    this.setupRoutes();
    
    // Register agents
    config.agents.forEach(agent => {
      this.agents.set(agent.id, agent);
    });
  }

  private setupMiddleware(): void {
    // Enable JSON parsing
    this.app.use(express.json({ limit: '10mb' }));
    
    // Enable CORS if configured
    if (this.config.cors?.enabled) {
      this.app.use(cors({
        origin: this.config.cors.origins || "*",
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
      }));
    }

    // Logging middleware
    if (this.config.logging?.enabled) {
      this.app.use((req, res, next) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${req.method} ${req.path}`);
        next();
      });
    }
  }

  private setupRoutes(): void {
    // Main A2A endpoint
    this.app.post('/a2a', this.handleA2ARequest.bind(this));
    
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // Agent discovery endpoint (REST style for convenience)
    this.app.get('/agents', (req, res) => {
      const agentCards = Array.from(this.agents.values()).map(agent => agent.getCard());
      res.json({ agents: agentCards });
    });
  }

  private async handleA2ARequest(req: Request, res: Response): Promise<void> {
    try {
      const request = req.body as JsonRpcRequest;
      
      // Validate JSON-RPC format
      if (!request || !this.isValidJsonRpcRequest(request)) {
        const error: JsonRpcResponse = {
          jsonrpc: A2A_JSONRPC_VERSION,
          error: {
            code: A2AErrorCode.INVALID_REQUEST,
            message: "Invalid JSON-RPC request format"
          },
          id: (request as any)?.id ?? null
        };
        res.status(400).json(error);
        return;
      }

      let response: JsonRpcResponse;

      switch (request.method) {
        case 'a2a.discover':
          response = await this.handleDiscovery(request as A2ADiscoveryRequest);
          break;
        case 'a2a.execute':
          response = await this.handleExecute(request as A2AExecuteRequest);
          break;
        case 'a2a.status':
          response = await this.handleStatus(request as A2AStatusRequest);
          break;
        default:
          response = {
            jsonrpc: A2A_JSONRPC_VERSION,
            error: {
              code: A2AErrorCode.METHOD_NOT_FOUND,
              message: `Method '${request.method}' not found`
            },
            id: request.id ?? null
          };
      }

      res.json(response);
    } catch (error) {
      const response: JsonRpcResponse = {
        jsonrpc: A2A_JSONRPC_VERSION,
        error: {
          code: A2AErrorCode.INTERNAL_ERROR,
          message: "Internal server error",
          data: error instanceof Error ? error.message : String(error)
        },
        id: null
      };
      res.status(500).json(response);
    }
  }

  private isValidJsonRpcRequest(request: any): request is JsonRpcRequest {
    return (
      request &&
      typeof request === 'object' &&
      request.jsonrpc === A2A_JSONRPC_VERSION &&
      typeof request.method === 'string'
    );
  }

  private async handleDiscovery(request: A2ADiscoveryRequest): Promise<A2ADiscoveryResponse> {
    const filter = request.params?.filter;
    let agents = Array.from(this.agents.values());

    // Apply filter if provided
    if (filter && Array.isArray(filter)) {
      agents = agents.filter(agent => 
        filter.includes(agent.id) || 
        filter.some(f => agent.name.toLowerCase().includes(f.toLowerCase()))
      );
    }

    const agentCards = agents.map(agent => agent.getCard());

    return {
      jsonrpc: A2A_JSONRPC_VERSION,
      result: { agents: agentCards },
      id: request.id ?? null
    };
  }

  private async handleExecute(request: A2AExecuteRequest): Promise<JsonRpcResponse> {
    const { agent_id, capability, input, context, metadata } = request.params;

    const agent = this.agents.get(agent_id);
    if (!agent) {
      return {
        jsonrpc: A2A_JSONRPC_VERSION,
        error: {
          code: A2AErrorCode.AGENT_NOT_FOUND,
          message: `Agent '${agent_id}' not found`
        },
        id: request.id ?? null
      };
    }

    // Check if agent supports the requested capability
    const hasCapability = agent.capabilities.some(cap => cap.name === capability);
    if (!hasCapability) {
      return {
        jsonrpc: A2A_JSONRPC_VERSION,
        error: {
          code: A2AErrorCode.CAPABILITY_NOT_SUPPORTED,
          message: `Agent '${agent_id}' does not support capability '${capability}'`
        },
        id: request.id ?? null
      };
    }

    try {
      const output = await agent.execute(capability, input, context);
      
      return {
        jsonrpc: A2A_JSONRPC_VERSION,
        result: {
          output,
          metadata,
          context
        },
        id: request.id ?? null
      };
    } catch (error) {
      return {
        jsonrpc: A2A_JSONRPC_VERSION,
        error: {
          code: A2AErrorCode.INTERNAL_ERROR,
          message: "Agent execution failed",
          data: error instanceof Error ? error.message : String(error)
        },
        id: request.id ?? null
      };
    }
  }

  private async handleStatus(request: A2AStatusRequest): Promise<JsonRpcResponse> {
    const agent_id = request.params?.agent_id;

    if (agent_id) {
      const agent = this.agents.get(agent_id);
      if (!agent) {
        return {
          jsonrpc: A2A_JSONRPC_VERSION,
          error: {
            code: A2AErrorCode.AGENT_NOT_FOUND,
            message: `Agent '${agent_id}' not found`
          },
          id: request.id ?? null
        };
      }

      const status = await agent.getStatus();
      return {
        jsonrpc: A2A_JSONRPC_VERSION,
        result: {
          status: status.status as "active" | "busy" | "inactive" | "error",
          message: status.message,
          load: status.load
        },
        id: request.id ?? null
      };
    } else {
      // Return server status
      return {
        jsonrpc: A2A_JSONRPC_VERSION,
        result: {
          status: "active",
          message: `Server running with ${this.agents.size} agents`,
          load: 0.1 // TODO: Calculate actual load
        },
        id: request.id ?? null
      };
    }
  }

  public async start(): Promise<void> {
    // Initialize all agents
    for (const agent of this.agents.values()) {
      await agent.initialize();
    }

    return new Promise((resolve) => {
      this.server = this.app.listen(this.config.port, this.config.host, () => {
        console.log(`A2A Server listening on ${this.config.host}:${this.config.port}`);
        console.log(`Registered agents: ${Array.from(this.agents.keys()).join(', ')}`);
        resolve();
      });
    });
  }

  public async stop(): Promise<void> {
    // Shutdown all agents
    for (const agent of this.agents.values()) {
      await agent.shutdown();
    }

    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('A2A Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  public addAgent(agent: A2AAgent): void {
    this.agents.set(agent.id, agent);
  }

  public removeAgent(agentId: string): boolean {
    return this.agents.delete(agentId);
  }

  public getAgent(agentId: string): A2AAgent | undefined {
    return this.agents.get(agentId);
  }

  public listAgents(): A2AAgent[] {
    return Array.from(this.agents.values());
  }
}