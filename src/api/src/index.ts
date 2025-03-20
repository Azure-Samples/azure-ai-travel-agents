import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";

class MCPClient {
  private mcp: Client;
  private tools: Array<any> = [];
  private transport: Transport | null = null;

  constructor() {
    this.mcp = new Client({ name: "mcp-client", version: "1.0.0" });
  }

  async connectToServer(serverUrl: string) {
    try {
      this.transport = new SSEClientTransport(new URL(serverUrl));
      await this.mcp.connect(this.transport);

      const toolsResult = await this.mcp.listTools();
      this.tools = toolsResult.tools;
      console.log("Tools: ", toolsResult);
    } catch (e) {
      console.log("Failed to connect to MCP server: ", e);
      throw e;
    }
  }

  async processQuery(query: string) {
    console.log("Tools: ", JSON.stringify(this.tools, null, 2));

    const toolResult = await this.mcp.callTool({
      name: "echo",
      arguments: {
        text: query,
      },
    });

    return toolResult;
  }

  async cleanup() {
    await this.mcp.close();
  }
}

(async () => {
  const client = new MCPClient();
  await client.connectToServer("http://echo-agent:5000/sse");
  console.log("Connected to MCP server");

  const query = "Hello world from the client!";
  const result = await client.processQuery(query);
  console.log("Result: ", result);
  // await client.cleanup();
})();
