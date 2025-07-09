import EventEmitter from 'node:events';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { ToolListChangedNotificationSchema } from '@modelcontextprotocol/sdk/types.js';

export class MCPClient extends EventEmitter {
  private client: Client;
  private transport: StreamableHTTPClientTransport;

  constructor(serverName: string, serverUrl: string, accessToken?: string) {
    super();
    this.client = new Client({
      name: 'mcp-http-client-' + serverName,
      version: '1.0.0',
    });

    let headers = {};

    if (accessToken) {
      headers = {
        Authorization: 'Bearer ' + accessToken,
      };
    }

    this.transport = new StreamableHTTPClientTransport(new URL(serverUrl), {
      requestInit: {
        headers: {
          ...headers,
        },
      },
    });

    this.client.setNotificationHandler(
      ToolListChangedNotificationSchema,
      () => {
        console.log('Emitting toolListChanged event');
        this.emit('toolListChanged');
      }
    );
  }

  async connect() {
    await this.client.connect(this.transport);
    console.log('Connected to server');
  }

  async listTools() {
    const result = await this.client.listTools();
    return result.tools;
  }

  async callTool(name: string, toolArgs: string) {
    console.log(`Calling tool ${name} with arguments:`, toolArgs);

    return await this.client.callTool({
      name,
      arguments: JSON.parse(toolArgs),
    });
  }

  async close() {
    console.log('Closing transport...');
    await this.transport.close();
  }
}