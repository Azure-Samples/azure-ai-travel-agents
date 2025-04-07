import { BaseToolWithCall } from "llamaindex";
import { z } from "zod";
import { MCPClient } from "./mcp-client.js";

type McpToolDefinition = {
  name: string;
  description?: string;
  inputSchema: {
    type: string;
    properties?: any;
    required?: z.ZodTypeAny;
  };
};

export type McpServerDefinition = {
  serverUrl: string;
  serverName: string;
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

function client(): MCPClient {
  return new MCPClient("llamaindex-client", "1.0.0");
}

export async function mcpTools({ serverName, serverUrl }: McpServerDefinition) {
  const mcpClient = client();
  console.log(`Connecting to MCP server ${serverName} at ${serverUrl}`);

  try {
    await mcpClient.connectToServer(serverUrl);
  } catch (error: unknown) {
    console.error(
      `MCP server ${serverName} is not reachable`,
      (error as Error).message
    );
    return [];
  }

  return (await mcpClient.listTools()).tools.map((tool) =>
    openAiFunctionAdapter(tool, mcpClient)
  );
}

export async function mcpToolsList(config: McpServerDefinition[]) {
  return await Promise.all(
    config.map(async ({ serverName, serverUrl }) => {
      const mcpClient = client();
      console.log(`Connecting to MCP server ${serverName} at ${serverUrl}`);

      try {
        await mcpClient.connectToServer(serverUrl);
        console.log(`MCP server ${serverName} is reachable`);
        const { tools } = await mcpClient.listTools();

        console.log(`MCP server ${serverName} has ${tools.length} tools`);
        return {
          serverName,
          serverUrl,
          reachable: true,
          selected: true,
          tools,
        };
      } catch (error: unknown) {
        console.error(
          `MCP server ${serverName} is not reachable`,
          (error as Error).message
        );
        return {
          serverName,
          serverUrl,
          reachable: false,
          selected: false,
          tools: [],
        };
      }
    })
  );
}
