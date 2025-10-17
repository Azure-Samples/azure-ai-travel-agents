import { mcp } from "@llamaindex/tools";
import { McpServerDefinition } from "../utils/types.js";
import { BaseToolWithCall } from "@llamaindex/core/llms";

// Create MCP tools using the official @llamaindex/tools
export const createMcpToolsFromDefinition = async (
  mcpServerConfig: McpServerDefinition
): Promise<BaseToolWithCall[]> => {
  try {
    console.log(`Creating MCP tools for ${mcpServerConfig.id} at ${mcpServerConfig.config.url}`);
    
    // Extract headers if available
    const headers: Record<string, string> = {};
    if (mcpServerConfig.config.requestInit?.headers) {
      const configHeaders = mcpServerConfig.config.requestInit.headers as Record<string, string>;
      Object.assign(headers, configHeaders);
    }
    
    // Load tools using the official Llamaindex.TS MCP adapters
    const tools = await mcp(mcpServerConfig.config).tools();

    console.log(`Created ${tools.length} Llamaindex.TS tools for ${mcpServerConfig.id}`);
    return tools;
    
  } catch (error) {
    console.error(`Error creating MCP tools for ${mcpServerConfig.id}:`, error);
    return [];
  }
};