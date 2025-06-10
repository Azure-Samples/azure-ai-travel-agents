/**
 * Agent2Agent (A2A) Protocol Types
 * 
 * Based on the A2A specification from https://github.com/google-a2a/A2A
 * Implements JSON-RPC 2.0 over HTTP(S) for agent communication
 */

// JSON-RPC 2.0 base types
export interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params?: any;
  id?: string | number | null;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  result?: any;
  error?: JsonRpcError;
  id: string | number | null;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: any;
}

// A2A Agent Card - describes agent capabilities
export interface AgentCard {
  id: string;
  name: string;
  description: string;
  version: string;
  capabilities: AgentCapability[];
  endpoints: AgentEndpoint[];
  metadata?: Record<string, any>;
}

export interface AgentCapability {
  type: "text" | "form" | "media" | "streaming";
  name: string;
  description: string;
  inputSchema?: any; // JSON Schema for input
  outputSchema?: any; // JSON Schema for output
}

export interface AgentEndpoint {
  type: "http" | "sse" | "websocket";
  url: string;
  methods?: string[];
  authentication?: AuthenticationMethod;
}

export interface AuthenticationMethod {
  type: "none" | "bearer" | "basic" | "custom";
  details?: Record<string, any>;
}

// A2A Protocol Messages
export interface A2ADiscoveryRequest extends JsonRpcRequest {
  method: "a2a.discover";
  params?: {
    filter?: string[];
  };
}

export interface A2ADiscoveryResponse extends JsonRpcResponse {
  result: {
    agents: AgentCard[];
  };
}

export interface A2AExecuteRequest extends JsonRpcRequest {
  method: "a2a.execute";
  params: {
    agent_id: string;
    capability: string;
    input: any;
    context?: Record<string, any>;
    metadata?: Record<string, any>;
  };
}

export interface A2AExecuteResponse extends JsonRpcResponse {
  result: {
    output: any;
    metadata?: Record<string, any>;
    context?: Record<string, any>;
  };
}

export interface A2AStatusRequest extends JsonRpcRequest {
  method: "a2a.status";
  params?: {
    agent_id?: string;
  };
}

export interface A2AStatusResponse extends JsonRpcResponse {
  result: {
    status: "active" | "busy" | "inactive" | "error";
    message?: string;
    load?: number; // 0-1 representing current load
  };
}

// A2A Agent Interface
export interface A2AAgent {
  id: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  
  // Core methods
  getCard(): AgentCard;
  execute(capability: string, input: any, context?: Record<string, any>): Promise<any>;
  getStatus(): Promise<{ status: string; message?: string; load?: number }>;
  
  // Lifecycle methods
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
}

// A2A Server Configuration
export interface A2AServerConfig {
  port: number;
  host: string;
  agents: A2AAgent[];
  authentication?: AuthenticationMethod;
  cors?: {
    enabled: boolean;
    origins?: string[];
  };
  logging?: {
    enabled: boolean;
    level: "debug" | "info" | "warn" | "error";
  };
}

// A2A Client Configuration
export interface A2AClientConfig {
  baseUrl: string;
  authentication?: AuthenticationMethod;
  timeout?: number;
  retries?: number;
}

// A2A Protocol Constants
export const A2A_PROTOCOL_VERSION = "1.0.0";
export const A2A_JSONRPC_VERSION = "2.0";

// A2A Error Codes (based on JSON-RPC 2.0 spec + A2A extensions)
export enum A2AErrorCode {
  // JSON-RPC 2.0 standard errors
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,
  
  // A2A specific errors
  AGENT_NOT_FOUND = -32001,
  CAPABILITY_NOT_SUPPORTED = -32002,
  AGENT_BUSY = -32003,
  AGENT_UNAVAILABLE = -32004,
  AUTHENTICATION_FAILED = -32005,
  QUOTA_EXCEEDED = -32006,
  EXECUTION_TIMEOUT = -32007,
}