import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import dotenv from "dotenv";
import express from "express";
import { z } from "zod";
import { log, tracer, meter } from "./instrumentation.js";

dotenv.config();

const app = express();

const server = new McpServer(
  {
    name: "mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);
let transport: SSEServerTransport | null = null;

const connectionCount = meter.createCounter("connection", {
  description: "Number of connections to the server",
});

app.get("/sse", (req, res) => {
  log("Received SSE connection request");
  connectionCount.add(1, {
    method: "GET",
  });
  transport = new SSEServerTransport("/messages", res);
  server.connect(transport);
});

const messageMeter = meter.createCounter("message", {
  description: "Number of messages sent",
});
app.post("/messages", (req, res) => {
  if (transport) {
    messageMeter.add(1, {
      method: "POST",
    });
    transport.handlePostMessage(req, res);
  } else {
    res.status(400).send("No active transport available.");
  }
});

server.tool(
  "echo",
  "Echo back the input values",
  {
    text: z.string(),
  },
  (args) => {
    return tracer.startActiveSpan("echo", async (span) => {
      log("Received request to echo:", args);
      span.addEvent("echo");
      span.end();
      return await Promise.resolve({
        content: [
          {
            type: "text" as const,
            text: `Echoed text: ${
              args.text
            } - from the server at ${new Date().toISOString()}`,
          },
        ],
      });
    });
  }
);

app.listen(5000, "0.0.0.0", () => {
  log("Server started and listening for requests...");
  log("You can connect to it using the SSEClientTransport.");
  log(
    "For example: new SSEClientTransport(new URL('http://0.0.0.0:5000/sse'))"
  );
});
