import type { SSEClientTransportOptions } from "@modelcontextprotocol/sdk/client/sse.js";
import { MCPClient as MCPHTTPClient } from "./mcp-http-client.js";
import { MCPClient as MCPSSEClient } from "./mcp-sse-client.js";

type MCPCommonOptions = {
  toolNamePrefix?: string;
  clientName?: string;
  clientVersion?: string;
  verbose?: boolean;
};
type LlamaIndexMCPClientOptions = SSEClientTransportOptions &
  MCPCommonOptions & {
    url: string;
    type: "sse" | "http";
    accessToken?: string;
  };

export type McpServerDefinition = {
  name: string;
  id: string;
  config: LlamaIndexMCPClientOptions;
};

function client(config: LlamaIndexMCPClientOptions): MCPSSEClient | MCPHTTPClient {
  if (config.type === "sse") {
    // legacy implementation using SSE
    return new MCPSSEClient("llamaindex-sse-client", config.url);
  } else {
    return new MCPHTTPClient("llamaindex-http-client", config.url, config.accessToken);
  }
}

export async function mcpToolsList(config: McpServerDefinition[]) {
  return await Promise.all(
    config.map(async ({ id, name, config }) => {
      const { url, type } = config;
      const mcpClient = client(config);
      
      try {
        console.log(`Connecting to MCP server ${name} at ${url}`);
        await mcpClient.connect();
        console.log(`MCP server ${name} is reachable`);
        const tools = await mcpClient.listTools();

        console.log(`MCP server ${name} has ${tools.length} tools`);
        return {
          id,
          name,
          url,
          type,
          reachable: true,
          selected: true,
          tools,
        };
      } catch (error: unknown) {
        console.error(
          `MCP server ${name} is not reachable`,
          (error as Error).message
        );
        return {
          id,
          name,
          url,
          type,
          reachable: false,
          selected: false,
          tools: [],
          error: (error as Error).message,
        };
      }
    })
  );
}
