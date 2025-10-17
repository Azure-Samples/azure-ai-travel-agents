import type { SSEClientTransportOptions } from "@modelcontextprotocol/sdk/client/sse.js";

export type MCPClientOptions = SSEClientTransportOptions & {
    url: string;
    type: "sse" | "http";
    accessToken?: string;
    verbose?: boolean;
  };

export type McpServerDefinition = {
  name: string;
  id: string;
  config: MCPClientOptions;
};
