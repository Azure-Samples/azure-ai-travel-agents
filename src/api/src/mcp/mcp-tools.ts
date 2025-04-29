import { BaseToolWithCall } from "llamaindex";
import { z } from "zod";
import { MCPClient } from "./mcp-client.js";
import type { SSEClientTransportOptions } from "@modelcontextprotocol/sdk/client/sse.js";

// Copied from src/api/node_modules/@llamaindex/tools/dist/index.d.ts
// TODO: Remove these types when they are exported from the package
type MCPCommonOptions = {
  toolNamePrefix?: string;
  clientName?: string;
  clientVersion?: string;
  verbose?: boolean;
};
type LlamaIndexSSEMCPClientOptions = SSEClientTransportOptions &
  MCPCommonOptions & {
    url: string;
  };

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
  name: string;
  id: string;
  config: LlamaIndexSSEMCPClientOptions;
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

export async function mcpTools({ id, config }: McpServerDefinition) {
  const mcpClient = client();
  console.log(`Connecting to MCP server ${id} at ${config.url}`);

  try {
    await mcpClient.connectToServer(config.url);
  } catch (error: unknown) {
    console.error(
      `MCP server ${id} is not reachable`,
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
    config.map(async ({ id, name, config }) => {
      const mcpClient = client();
      console.log(`Connecting to MCP server ${name} at ${config.url}`);

      try {
        await mcpClient.connectToServer(config.url);
        console.log(`MCP server ${name} is reachable`);
        const { tools } = await mcpClient.listTools();

        console.log(`MCP server ${name} has ${tools.length} tools`);
        return {
          id,
          name,
          url: config.url,
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
          url: config.url,
          reachable: false,
          selected: false,
          tools: [],
        };
      }
    })
  );
}
