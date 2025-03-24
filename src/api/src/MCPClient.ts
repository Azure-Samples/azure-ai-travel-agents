import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { tracer, log } from "./instrumentation.js";

export class MCPClient {
    private mcp: Client;
    private tools: Array<any> = [];
    private transport: Transport | null = null;
  
    constructor(name: string, version: string) {
      this.mcp = new Client({ name, version });
    }
  
    async connectToServer(serverUrl: string) {
      try {
        this.transport = new SSEClientTransport(new URL(serverUrl));
        await this.mcp.connect(this.transport);
  
        const toolsResult = await this.mcp.listTools();
        this.tools = toolsResult.tools;
        log("Tools: ", toolsResult);
      } catch (e) {
        log("Failed to connect to MCP server: ", { error: e }, "ERROR");
        throw e;
      }
    }
  
    async processQuery(query: string) {
      return tracer.startActiveSpan("processQuery", async (span) => {
        log("Tools", this.tools);
  
        const toolResult = await this.mcp.callTool({
          name: "echo",
          arguments: {
            text: query,
          },
        });
  
        log("Tool result", toolResult);
        span.end();
        return toolResult;
      });
    }
  
    async cleanup() {
      await this.mcp.close();
    }
  }
  