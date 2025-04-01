import { BaseToolWithCall, tool } from "llamaindex";
import { z } from "zod";
import { MCPClient } from "../../mcp/MCPClient.js";

type McpToolDefinition = {
  name: string;
  description?: string;
  inputSchema: {
    type: string;
    properties?: any;
    required?: z.ZodTypeAny;
  };
};

function openAiFunctionAdapter(
  tool: McpToolDefinition,
  mcpClient: MCPClient
): BaseToolWithCall {
  return {
    call: async (params: Record<string, any>): Promise<any> =>
      await mcpClient.callTool(tool.name, params),
    metadata: {
      name: tool.name,
      description: tool.description as string,
      parameters: {
        type: "object",
        properties: tool.inputSchema.properties,
        required: tool.inputSchema.required || [],
      },
    },
  };
}

export async function mcpTools(serverName: string, serverUrl: string) {
  const mcpClient = new MCPClient("llamaindex-client", "1.0.0");
  console.log(`Connecting to MCP server ${serverName} at ${serverUrl}`);

  try {
    await mcpClient.connectToServer(`${serverUrl}/sse`);
  } catch (error) {
    console.error("Error connecting to MCP server: ", serverName, error);
    throw new Error(`MCP serve ${serverName} is not reachable`);
  }
  return (await mcpClient.listTools()).tools.map((tool) =>
    openAiFunctionAdapter(tool, mcpClient)
  );
}
