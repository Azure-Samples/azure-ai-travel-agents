import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { MCPClient as MCPHTTPClient } from "../../../mcp/mcp-http-client.js";
import { MCPClient as MCPSSEClient } from "../../../mcp/mcp-sse-client.js";
import { McpServerDefinition } from "../../../mcp/mcp-tools.js";

// Create a bridge between existing MCP clients and Langchain DynamicStructuredTool
export const createMcpToolsFromDefinition = async (
  mcpServerConfig: McpServerDefinition
): Promise<DynamicStructuredTool[]> => {
  try {
    console.log(`Creating MCP tools for ${mcpServerConfig.id} at ${mcpServerConfig.config.url}`);
    
    // Extract access token if available
    let accessToken: string | undefined;
    if (mcpServerConfig.config.requestInit?.headers) {
      const headers = mcpServerConfig.config.requestInit.headers as Record<string, string>;
      if (headers.Authorization) {
        accessToken = headers.Authorization.replace("Bearer ", "");
      }
    }

    // Create MCP client based on type
    let mcpClient: MCPHTTPClient | MCPSSEClient;
    
    if (mcpServerConfig.config.type === "sse") {
      mcpClient = new MCPSSEClient(
        "langchain-sse-client",
        mcpServerConfig.config.url,
        accessToken
      );
    } else {
      mcpClient = new MCPHTTPClient(
        "langchain-http-client",
        mcpServerConfig.config.url,
        accessToken
      );
    }

    // Connect to MCP server
    await mcpClient.connect();
    
    // Get tools from MCP server
    const mcpTools: any = await mcpClient.listTools();
    
    // Convert MCP tools to Langchain DynamicStructuredTool
    const langchainTools: DynamicStructuredTool[] = (mcpTools || []).map((mcpTool: any) => {
      // Create a Zod schema from the MCP tool's input schema
      let schema = z.object({});
      
      if (mcpTool.inputSchema && mcpTool.inputSchema.properties) {
        const schemaProperties: { [key: string]: z.ZodType } = {};
        
        for (const [key, prop] of Object.entries(mcpTool.inputSchema.properties)) {
          // Basic type mapping - can be enhanced for more complex types
          if (prop && typeof prop === 'object' && 'type' in prop) {
            const property = prop as any;
            switch (property.type) {
              case 'string':
                schemaProperties[key] = property.description ? 
                  z.string().describe(property.description) : 
                  z.string();
                break;
              case 'number':
                schemaProperties[key] = property.description ? 
                  z.number().describe(property.description) : 
                  z.number();
                break;
              case 'boolean':
                schemaProperties[key] = property.description ? 
                  z.boolean().describe(property.description) : 
                  z.boolean();
                break;
              default:
                schemaProperties[key] = property.description ? 
                  z.string().describe(property.description) : 
                  z.string();
            }
          }
        }
        
        schema = z.object(schemaProperties);
      }

      return new DynamicStructuredTool({
        name: mcpTool.name,
        description: mcpTool.description || `Tool from MCP server ${mcpServerConfig.id}`,
        schema: schema,
        func: async (input: any) => {
          try {
            const result = await mcpClient.callTool(mcpTool.name, input);
            
            // Extract content from MCP result
            if (result && result.content && Array.isArray(result.content)) {
              return result.content
                .map((item: any) => {
                  if (item.type === 'text') {
                    return item.text;
                  }
                  return JSON.stringify(item);
                })
                .join('\n');
            }
            
            return JSON.stringify(result);
          } catch (error) {
            console.error(`Error calling MCP tool ${mcpTool.name}:`, error);
            return `Error: ${error instanceof Error ? error.message : String(error)}`;
          }
        },
      });
    });

    console.log(`Created ${langchainTools.length} Langchain tools for ${mcpServerConfig.id}`);
    return langchainTools;
    
  } catch (error) {
    console.error(`Error creating MCP tools for ${mcpServerConfig.id}:`, error);
    return [];
  }
};