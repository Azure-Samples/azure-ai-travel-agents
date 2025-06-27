import dotenv from "dotenv";
dotenv.config();

import { meter } from "./instrumentation.js";
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import express, { Request, Response } from 'express';
import { WebSearchMCPServer } from "./server.js";

const server = new WebSearchMCPServer(
  new Server(
    {
      name: 'web-search-sse-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  )
);

const messageMeter = meter.createCounter("message", {
  description: "Number of messages sent",
});
const connectionCount = meter.createCounter("connection", {
  description: "Number of connections to the server",
});

const app = express();
app.use(express.json());

const router = express.Router();
const SSE_ENDPOINT = '/sse';

// Health check endpoint
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Web Search MCP SSE Server is running',
    endpoint: SSE_ENDPOINT,
    capabilities: ['search_travel', 'search_destinations'],
  });
});

// SSE endpoint for MCP communication
router.all(SSE_ENDPOINT, async (req: Request, res: Response) => {
  console.log(`Received ${req.method} request for ${req.originalUrl}`);
  
  messageMeter.add(1, {
    method: req.method,
    endpoint: SSE_ENDPOINT
  });
  
  if (req.method === 'GET' || req.method === 'POST') {
    connectionCount.add(1, {
      method: req.method,
    });
    await server.handleSSERequest(req, res);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
});

app.use('/', router);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Web Search MCP SSE Server`);
  console.log(`SSE endpoint: http://localhost:${PORT}${SSE_ENDPOINT}`);
  console.log(`Health check: http://localhost:${PORT}/`);
  console.log(`Press Ctrl+C to stop the server`);
});

process.on('SIGINT', async () => {
  console.error('Shutting down server...');
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('Shutting down server...');
  await server.close();
  process.exit(0);
});