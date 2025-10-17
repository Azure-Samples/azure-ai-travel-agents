import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  JSONRPCError,
  JSONRPCNotification,
  ListToolsRequestSchema,
  LoggingMessageNotification,
  Notification,
} from '@modelcontextprotocol/sdk/types.js';
import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { EchoTools } from './tools.js';

const JSON_RPC = '2.0';
const JSON_RPC_ERROR = -32603;

export class EchoMCPServer {
  server: Server;

  constructor(server: Server) {
    this.server = server;
    this.setupServerRequestHandlers();
  }

  async close() {
    console.log('Shutting down server...');
    await this.server.close();
    console.log('Server shutdown complete.');
  }

  async handleGetRequest(req: Request, res: Response) {
    console.log('Responded to GET with 405 Method Not Allowed');
    res.status(405).json(this.createRPCErrorResponse('Method not allowed.'));
  }

  async handlePostRequest(req: Request, res: Response) {
    console.log(`POST ${req.originalUrl} (${req.ip}) - payload:`, req.body);
    try {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      console.log('Connecting transport to server...');

      await this.server.connect(transport);
      console.log('Transport connected. Handling request...');

      await transport.handleRequest(req, res, req.body);
      res.on('close', () => {
        console.log('Request closed by client');
        transport.close();
        this.server.close();
      });

      await this.sendMessages(transport);
      console.log(
        `POST request handled successfully (status=${res.statusCode})`
      );
    } catch (error) {
      console.error('Error handling MCP request:', error);
      if (!res.headersSent) {
        res
          .status(500)
          .json(this.createRPCErrorResponse('Internal server error.'));
        console.error('Responded with 500 Internal Server Error');
      }
    }
  }

  private setupServerRequestHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async (_request) => {
      return {
        jsonrpc: JSON_RPC,
        tools: EchoTools,
      };
    });
    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request, _extra) => {
        const args = request.params.arguments;
        const toolName = request.params.name;
        const tool = EchoTools.find((tool) => tool.name === toolName);

        console.log(`Handling CallToolRequest for tool: ${toolName}`);

        if (!tool) {
          console.error(`Tool ${toolName} not found.`);
          return this.createRPCErrorResponse(`Tool ${toolName} not found.`);
        }
        try {
          const result = await tool.execute(args as any);
          console.log(`Tool ${toolName} executed. Result:`, result);
          return {
            jsonrpc: JSON_RPC,
            content: [
              {
                type: 'text',
                text: `Tool ${toolName} executed with arguments ${JSON.stringify(
                  args
                )}. Result: ${JSON.stringify(result)}`,
              },
            ],
          };
        }
        catch (error) {
          console.error(`Error executing tool ${toolName}:`, error);
          return this.createRPCErrorResponse(
            `Error executing tool ${toolName}: ${error}`
          );
        }
      }
    );
  }

  private async sendMessages(transport: StreamableHTTPServerTransport) {
    const message: LoggingMessageNotification = {
      method: 'notifications/message',
      params: { level: 'info', data: 'SSE Connection established' },
    };
    console.log('Sending SSE connection established notification.');
    this.sendNotification(transport, message);
  }

  private async sendNotification(
    transport: StreamableHTTPServerTransport,
    notification: Notification
  ) {
    const rpcNotificaiton: JSONRPCNotification = {
      ...notification,
      jsonrpc: JSON_RPC,
    };
    console.log(`Sending notification: ${notification.method}`);
    await transport.send(rpcNotificaiton);
  }

  private createRPCErrorResponse(message: string): JSONRPCError {
    return {
      jsonrpc: JSON_RPC,
      error: {
        code: JSON_RPC_ERROR,
        message: message,
      },
      id: randomUUID(),
    };
  }
}