import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { setupAgents } from "./orchestrator/llamaindex/index.js";

// Load environment variables
dotenv.config();

// Create Express application
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Define API router with /api prefix
const apiRouter = express.Router();

// Add request body logging middleware for debugging
apiRouter.use((req, res, next) => {
  if (req.path === '/chat' && req.method === 'POST') {
    console.log('Request Content-Type:', req.headers['content-type']);
    console.log('Request body:', req.body);
  }
  next();
});

// Health check endpoint
// @ts-ignore - Ignoring TypeScript errors for Express route handlers
apiRouter.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// Chat endpoint with Server-Sent Events (SSE) for streaming responses
// @ts-ignore - Ignoring TypeScript errors for Express route handlers
apiRouter.post("/chat", async (req, res) => {
  try {
    // Check if req.body is undefined
    if (!req.body) {
      console.error('Request body is undefined. Check Content-Type header in the request.');
      return res
        .status(400)
        .json({ error: "Request body is undefined. Make sure to set Content-Type to application/json." });
    }

    const messages = req.body.messages;
    // Model is optional
    const model = req.body.model;

    if (!messages || !Array.isArray(messages) || !messages.length) {
      return res
        .status(400)
        .json({ error: "Messages array is required and must not be empty" });
    }

    // Extract the user message from the last user message in the array
    const userMessage = messages
      .filter((msg) => msg.role === "user")
      .pop()?.content;

    if (!userMessage) {
      return res
        .status(400)
        .json({ error: "At least one user message is required" });
    }

    const agents = await setupAgents();

    // Set up streaming response using Server-Sent Events
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Process message through agents
    const context = agents.run(userMessage);

    for await (const event of context) {
      const { displayName, data } = event;

      // Send metadata events
      res.write(
        `data: ${JSON.stringify({
          type: "metadata",
          agent: (data as any).currentAgentName,
          event: displayName,
          data: data,
        })}\n\n`
      );
    }

    // End the stream
    res.write(`data: ${JSON.stringify({ type: "end" })}\n\n`);
    res.end();
  } catch (error) {
    console.error("Error processing chat:", error);
    // If headers haven't been sent yet, send error response
    if (!res.headersSent) {
      res.status(500).json({ error: (error as any).message });
    } else {
      // If we're in the middle of streaming, send error as event
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          message: (error as any).message,
        })}\n\n`
      );
      res.end();
    }
  }
});

// Mount the API router with the /api prefix
app.use("/api", apiRouter);

// Add a root route for API information
app.get("/", (req, res) => {
  res.json({
    message: "AI Travel Agents API",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      chat: "/api/chat",
    },
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  - Health check: http://localhost:${PORT}/api/health`);
  console.log(`  - Chat: http://localhost:${PORT}/api/chat (POST)`);
});
