import type { SSEClientTransportOptions } from "@modelcontextprotocol/sdk/client/sse.js";

export type MCPClientOptions = SSEClientTransportOptions & {
    url: string;
    type: "sse" | "http";
    accessToken?: string;
  };

export type McpServerDefinition = {
  name: string;
  id: string;
  config: MCPClientOptions;
};
