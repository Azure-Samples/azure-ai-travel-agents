import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import dotenv from "dotenv";
import express from "express";
import { z } from "zod";
dotenv.config();
const app = express();
const server = new McpServer({
    name: "mcp-server",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {}
    }
});
let transport = null;
app.get("/sse", (req, res) => {
    transport = new SSEServerTransport("/messages", res);
    server.connect(transport);
});
app.post("/messages", (req, res) => {
    if (transport) {
        transport.handlePostMessage(req, res);
    }
});
server.tool("echo", "Echo back the input values", {
    text: z.string()
}, async (args) => {
    console.log("Received request to echo:", { args });
    return await Promise.resolve({
        content: [
            {
                type: "text",
                text: `Echoed text: ${args.text} - from the server at ${new Date().toISOString()}`,
            }
        ],
    });
});
app.listen(5000, "0.0.0.0", () => {
    console.log("Server started and listening for requests...");
    console.log("You can connect to it using the SSEClientTransport.");
    console.log("For example: new SSEClientTransport(new URL('http://0.0.0.0:5000/sse'))");
});
