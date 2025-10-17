import type { SSEClientTransportOptions } from "@modelcontextprotocol/sdk/client/sse.js";
import { MCPClientOptions as LlamaIndexMCPClientOptions } from "@llamaindex/tools";

export type MCPClientOptions = SSEClientTransportOptions &
  LlamaIndexMCPClientOptions & {
    url: string;
    type: "sse" | "http";
    accessToken?: string;
  };

export type McpServerDefinition = {
  name: string;
  id: string;
  config: MCPClientOptions;
};
