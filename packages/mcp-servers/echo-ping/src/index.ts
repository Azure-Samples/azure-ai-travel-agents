import dotenv from "dotenv";
dotenv.config();

import { meter } from "./instrumentation.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import express, { Request, Response } from "express";
import { EchoMCPServer } from "./server.js";
import { tokenProvider } from "./token-provider.js";

const server = new EchoMCPServer(
  new Server(
    {
      name: "echo-ping-http-server",
      version: "1.0.0",
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
const MCP_ENDPOINT = "/mcp";

// Add logging middleware
router.use((req, res, next) => {
  console.log(`Received ${req.method} request for ${req.originalUrl}`);
  // log headers
  console.log("Request Headers:", JSON.stringify(req.headers, null, 2));
  // log body if present
  if (req.body && Object.keys(req.body).length > 0) {
    console.log("Request Body:", JSON.stringify(req.body, null, 2));
  } else {
    console.log("Request Body: (empty)");
  }
  // log query parameters
  if (Object.keys(req.query).length > 0) {
    console.log("Query Parameters:", JSON.stringify(req.query, null, 2));
  } else {
    console.log("Query Parameters: (none)");
  }
  next();
});

// Breaker token authentication middleware
router.use((req, res, next) => {
  console.log(`Received ${req.method} request for ${req.originalUrl}`);
  const expectedToken = tokenProvider().getToken();
  if (!expectedToken) {
    console.error("MCP_ECHO_PING_ACCESS_TOKEN is not set in environment.");
    res.status(500).json({ error: "Server misconfiguration." });
    return;
  }

  const authHeader = (req.headers["authorization"] ||
    req.headers["Authorization"]) as string;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error(
      'Missing or invalid Authorization header. Got "' + authHeader + '"'
    );
    res.status(401).json({ error: "Missing or invalid Authorization header." });
    return;
  }
  const token = authHeader.substring("Bearer ".length);
  if (token !== expectedToken) {
    res.status(401).json({ error: "Invalid breaker token." });
    return;
  }

  console.log(`Successfully authenticated request with bearer token.`);
  next();
});

router.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "MCP Stateless Streamable HTTP Server is running",
    endpoint: MCP_ENDPOINT,
  });
});

router.post(MCP_ENDPOINT, async (req: Request, res: Response) => {
  messageMeter.add(1, {
    method: "POST",
  });
  await server.handlePostRequest(req, res);
});

router.get(MCP_ENDPOINT, async (req: Request, res: Response) => {
  connectionCount.add(1, {
    method: "GET",
  });
  await server.handleGetRequest(req, res);
});

app.use("/", router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MCP Stateless Streamable HTTP Server`);
  console.log(`MCP endpoint: http://localhost:${PORT}${MCP_ENDPOINT}`);
  console.log(`Press Ctrl+C to stop the server`);
});

process.on("SIGINT", async () => {
  console.error("Shutting down server...");
  await server.close();
  process.exit(0);
});
