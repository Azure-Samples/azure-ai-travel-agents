import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { tracer, log } from "../utils/instrumentation.js";

/**
 * MCPClient is a client for connecting to Model Context Protocol (MCP) servers using Server-Sent Events (SSE).
 *
 * NOTE: This is a legacy implementation and should be replaced with the Streamable HTTP client!
 */
export class MCPClient {
  private client: Client;
  private tools: Array<any> = [];
  private transport: Transport;

  constructor(serverName: string, serverUrl: string, accessToken?: string) {
    this.client = new Client({
      name: "mcp-client-" + serverName,
      version: "1.0.0",
    });

    let headers = {};

    if (accessToken) {
      headers = {
        Authorization: "Bearer " + accessToken,
      };
    }

    this.transport = new SSEClientTransport(new URL(serverUrl), {
      requestInit: {
        headers: {
          ...headers,
        },
      },
    });
  }

  connect() {
    return tracer.startActiveSpan("connect", async (span) => {
      log("Connecting to MCP SSE server");
      try {
        await this.client.connect(this.transport);
        log("Connected to MCP SSE server");
        span.end();
        return this.client;
      } catch (error: any) {
        log("Error connecting to MCP SSE server:", error);
        span.setStatus({ code: 2, message: (error as Error).message });
        span.end();
        throw new Error(
          `Failed to connect to MCP SSE server: ${(error as Error).message}`
        );
      }
    });
  }
  async listTools() {
    return tracer.startActiveSpan("listTools", async (span) => {
      log("Tools", this.tools);
      const toolsResult = await this.client.listTools();
      this.tools = toolsResult.tools;
      log("Tools: ", toolsResult);
      span.end();
      return toolsResult;
    });
  }

  async callTool(toolName: string, args: Record<string, any>) {
    console.log(`Called ${toolName} with params:`, args);
    return tracer.startActiveSpan("processQuery", async (span) => {
      log("Tools", this.tools);

      const toolResult = await this.client.callTool({
        name: toolName,
        arguments: args,
      });

      log("Tool result", toolResult);
      span.end();
      return toolResult;
    });
  }

  async cleanup() {
    await this.transport.close();
  }
}
