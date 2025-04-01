import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pipeline } from "node:stream/promises";
import { setupAgents } from "./orchestrator/llamaindex/index.js";
import { Readable } from "node:stream";

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
  if (req.path === "/chat" && req.method === "POST") {
    console.log("Request Content-Type:", req.headers["content-type"]);
    console.log("Request body:", req.body);
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

  req.on("close", () => {
    console.log("Client disconnected, aborting...");
  });

  try {
    if (!req.body) {
      console.error(
        "Request body is undefined. Check Content-Type header in the request."
      );
      return res.status(400).json({
        error:
          "Request body is undefined. Make sure to set Content-Type to application/json.",
      });
    }

    const message = req.body.message;
    const tools = req.body.tools;
    console.log("Tools enabled:", tools);

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const agents = await setupAgents(tools);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const context = agents.run(message);
    const CHUNK_END = "\n\n";
    const readableStream = new Readable({
      async read() {
        try {
          for await (const event of context) {
            const { displayName, data } = event;
            const serializedData = JSON.stringify({
              type: "metadata",
              agent: (data as any)?.currentAgentName || null,
              event: displayName,
              data: data ? JSON.parse(JSON.stringify(data)) : null,
            });
            // delay the response to simulate streaming
            await new Promise((resolve) => setTimeout(resolve, 100));
            this.push(serializedData + CHUNK_END);
          }
        } catch (error) {
          this.push(
            JSON.stringify({
              type: "error",
              message: "Serialization error",
            }) + CHUNK_END
          );
        }
        this.push(null); // Close the stream
      },
    });

    await pipeline(readableStream, res);
  } catch (error) {
    console.error("Error occurred:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: (error as any).message });
    } else {
      res.write(
        `${JSON.stringify({
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
