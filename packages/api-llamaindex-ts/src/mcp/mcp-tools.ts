import type { SSEClientTransportOptions } from "@modelcontextprotocol/sdk/client/sse.js";
import { MCPClient as MCPHTTPClient } from "./mcp-http-client.js";
import { MCPClient as MCPSSEClient } from "./mcp-sse-client.js";
import { MCPClientOptions} from "@llamaindex/tools";
import { McpServerDefinition, LlamaIndexMCPClientOptions } from "../utils/types.js";

function client(config: LlamaIndexMCPClientOptions): MCPSSEClient | MCPHTTPClient {
  console.log(`Initializing MCP client`);
  console.log(`Using configuration:`, {config});

  if (config.type === "sse") {
    // legacy implementation using SSE
    return new MCPSSEClient("llamaindex-sse-client", config.url, config.accessToken);
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
          selected: id !== "echo-ping",
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
