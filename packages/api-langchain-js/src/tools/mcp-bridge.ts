import { DynamicStructuredTool } from "@langchain/core/tools";
import { loadMcpTools } from "@langchain/mcp-adapters";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { McpServerDefinition } from "../utils/types.js";

// Create MCP tools using the official @langchain/mcp-adapters
export const createMcpToolsFromDefinition = async (
  mcpServerConfig: McpServerDefinition
): Promise<DynamicStructuredTool[]> => {
  try {
    console.log(`Creating MCP tools for ${mcpServerConfig.id} at ${mcpServerConfig.config.url}`);
    
    // Extract headers if available
    const headers: Record<string, string> = {};
    if (mcpServerConfig.config.requestInit?.headers) {
      const configHeaders = mcpServerConfig.config.requestInit.headers as Record<string, string>;
      Object.assign(headers, configHeaders);
    }

    // Create MCP client using StreamableHTTPClientTransport
    const client = new Client({
      name: `langchain-mcp-client-${mcpServerConfig.id}`,
      version: "1.0.0",
    });

    const transport = new StreamableHTTPClientTransport(
      new URL(mcpServerConfig.config.url),
      {
        requestInit: {
          headers,
        },
      }
    );

    // Connect to MCP server
    await client.connect(transport);
    
    // Load tools using the official Langchain MCP adapters
    const tools = await loadMcpTools(mcpServerConfig.id, client);

    console.log(`Created ${tools.length} Langchain tools for ${mcpServerConfig.id}`);
    return tools;
    
  } catch (error) {
    console.error(`Error creating MCP tools for ${mcpServerConfig.id}:`, error);
    return [];
  }
};