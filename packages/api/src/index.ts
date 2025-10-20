import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const app = express();
const PORT = process.env.PORT || 4000;
const CHUNK_END = "\n\n";

// Middleware
app.use(cors());
app.use(express.json());

const apiRouter = express.Router();

// Add request body logging middleware for debugging
apiRouter.use((req, res, next) => {
  if (req.path === "/chat" && req.method === "POST") {
    const contentType = req.headers["content-type"]?.replace(/\n|\r/g, "");
    const body =
      typeof req.body === "string"
        ? req.body.replace(/\n|\r/g, "")
        : JSON.stringify(req.body).replace(/\n|\r/g, "");
    console.log("Request Content-Type:", contentType);
    console.log("Request body:", body);
  }
  next();
});

// Health check endpoint
apiRouter.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// MCP tools endpoint disabled (simplified mode)
apiRouter.get("/tools", async (req, res) => {
  res.status(200).json({ tools: [], message: "Tools endpoint disabled in simplified mode" });
});

// Chat endpoint with Server-Sent Events (SSE) for streaming responses
// SIMPLIFIED VERSION - No MCP tools, just basic LLM chat
// @ts-ignore - Ignoring TypeScript errors for Express route handlers
apiRouter.post("/chat", async (req, res) => {
  req.on("close", () => {
    console.log("Client disconnected, aborting...");
  });

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

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    console.log("Chat request received:", message);
    
    // Use OpenAI client directly (faster and more reliable than LlamaIndex for simple chat)
    const OpenAI = (await import("openai")).default;
    
    const client = new OpenAI({
      baseURL: "https://models.inference.ai.azure.com",
      apiKey: process.env.GITHUB_TOKEN,
    });
    
    console.log("OpenAI client created");
    
    // Create an async generator that streams the response
    async function* generateEvents() {
      try {
        console.log("Making OpenAI API call with message:", message);
        
        const response = await client.chat.completions.create({
          model: process.env.GITHUB_MODEL || "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: message,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        });
        
        console.log("OpenAI API response received");
        console.log("Response:", JSON.stringify(response, null, 2));
        
        // Extract the message content
        const content = response.choices[0]?.message?.content || "No response generated";
        console.log("Extracted content:", content);
        
        yield {
          eventName: "agent_complete",
          data: {
            agent: "TravelAgent",
            content,
          },
        };
      } catch (error: any) {
        console.error("Error in chat:", error?.message);
        console.error("Error stack:", error?.stack);
        yield {
          eventName: "error",
          data: {
            agent: "TravelAgent",
            error: error?.message || "Unknown error occurred",
          },
        };
      }
    }

    const context = generateEvents();

    const readableStream = new Readable({
      async read() {
        try {
          for await (const event of context) {
            const { eventName, data } = event;
            const serializedData = JSON.stringify({
              type: "metadata",
              agent: (data as any)?.agent || null,
              event: eventName,
              data: data ? JSON.parse(JSON.stringify(data)) : null,
            });
            this.push(serializedData + CHUNK_END);
            console.log("Pushed event:", serializedData);
          }
          this.push(null); // Close the stream
        } catch (error: any) {
          console.error("Error during streaming:", error?.message);
        }
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
        })}` + CHUNK_END
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
  console.log(`  - Health check: http://localhost:${PORT}/api/health (GET)`);
  console.log(`  - MCP Tools: http://localhost:${PORT}/api/tools (GET)`);
  console.log(`  - Chat: http://localhost:${PORT}/api/chat (POST)`);
});
