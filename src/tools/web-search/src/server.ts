import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  LoggingMessageNotification,
  Notification,
  JSONRPCNotification
} from '@modelcontextprotocol/sdk/types.js';
import { Request, Response } from 'express';
import { WebSearchTools } from './tools.js';
import { log, tracer } from './instrumentation.js';

const JSON_RPC = '2.0';

export class WebSearchMCPServer {
  server: Server;

  constructor(server: Server) {
    this.server = server;
    this.setupServerRequestHandlers();
  }

  async close() {
    log('Shutting down web search server...');
    await this.server.close();
    log('Web search server shutdown complete.');
  }

  async handleSSERequest(req: Request, res: Response) {
    const span = tracer.startSpan('handle_sse_request');
    
    try {
      log(`SSE ${req.originalUrl} (${req.ip}) - method: ${req.method}`);
      
      // Set SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Send initial connection event
      this.sendSSEMessage(res, 'connection', { status: 'connected', timestamp: new Date().toISOString() });
      
      // Handle different HTTP methods
      if (req.method === 'POST') {
        await this.handlePostRequest(req, res);
      } else if (req.method === 'GET') {
        await this.handleGetRequest(req, res);
      } else {
        this.sendSSEMessage(res, 'error', { message: 'Method not allowed' });
        res.end();
      }

      // Keep connection alive
      const keepAlive = setInterval(() => {
        this.sendSSEMessage(res, 'ping', { timestamp: new Date().toISOString() });
      }, 30000);

      // Handle client disconnect
      req.on('close', () => {
        log('SSE client disconnected');
        clearInterval(keepAlive);
        res.end();
      });

      span.end();
    } catch (error) {
      log(`Error in SSE request handler: ${(error as Error).message}`);
      span.recordException(error as Error);
      span.end();
      
      this.sendSSEMessage(res, 'error', { message: 'Internal server error' });
      res.end();
    }
  }

  private async handlePostRequest(req: Request, res: Response) {
    try {
      const requestData = req.body;
      log('Processing POST request', { method: requestData?.method });

      if (requestData?.method === 'tools/list') {
        const result = await this.handleListTools();
        this.sendSSEMessage(res, 'tools/list', result);
      } else if (requestData?.method === 'tools/call') {
        const result = await this.handleCallTool(requestData.params);
        this.sendSSEMessage(res, 'tools/call', result);
      } else {
        this.sendSSEMessage(res, 'error', { message: 'Unknown method' });
      }
    } catch (error) {
      log(`Error in POST handler: ${(error as Error).message}`);
      this.sendSSEMessage(res, 'error', { message: (error as Error).message });
    }
  }

  private async handleGetRequest(req: Request, res: Response) {
    // For GET requests, just send server info
    this.sendSSEMessage(res, 'info', {
      name: 'web-search-server',
      version: '1.0.0',
      capabilities: ['tools'],
      tools: WebSearchTools.map(tool => ({ name: tool.name, description: tool.description }))
    });
  }

  private async handleListTools() {
    return {
      jsonrpc: JSON_RPC,
      tools: WebSearchTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }))
    };
  }

  private async handleCallTool(params: any) {
    try {
      const { name: toolName, arguments: args } = params;
      const tool = WebSearchTools.find(tool => tool.name === toolName);

      log(`Handling CallTool request for: ${toolName}`);

      if (!tool) {
        throw new Error(`Tool ${toolName} not found`);
      }

      const result = await tool.execute(args);
      
      return {
        jsonrpc: JSON_RPC,
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      log(`Error executing tool: ${(error as Error).message}`);
      throw error;
    }
  }

  private setupServerRequestHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async (_request) => {
      return {
        jsonrpc: JSON_RPC,
        tools: WebSearchTools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }))
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request, _extra) => {
      const args = request.params.arguments;
      const toolName = request.params.name;
      const tool = WebSearchTools.find((tool) => tool.name === toolName);

      log(`Handling CallToolRequest for tool: ${toolName}`);

      if (!tool) {
        throw new Error(`Tool ${toolName} not found`);
      }

      const result = await tool.execute(args as any);
      
      return {
        jsonrpc: JSON_RPC,
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    });
  }

  private sendSSEMessage(res: Response, event: string, data: any) {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    res.write(message);
  }

  private async sendNotification(res: Response, notification: Notification) {
    const rpcNotification: JSONRPCNotification = {
      ...notification,
      jsonrpc: JSON_RPC,
    };
    
    this.sendSSEMessage(res, 'notification', rpcNotification);
  }
}