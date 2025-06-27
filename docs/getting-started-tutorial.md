---
title: getting-started-tutorial
createTime: 2025/06/06 13:07:02
---
# Getting Started Tutorial: Simple Agent Workflow

This tutorial walks through creating a simple AI agent workflow using the echo-ping server and MCP (Model Context Protocol) to demonstrate the core concepts of the Azure AI Travel Agents system.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Understanding the Echo-Ping Workflow](#understanding-the-echo-ping-workflow)
3. [Step-by-Step Setup](#step-by-step-setup)
4. [Testing the Simple Agent](#testing-the-simple-agent)
5. [Understanding the MCP Communication](#understanding-the-mcp-communication)
6. [Next Steps](#next-steps)

## Prerequisites

Before starting this tutorial, ensure you have:

- **Docker Desktop v4.42.0 or later** (for Docker Model Runner)
- **Node.js 18 or later**
- **Git** for cloning the repository
- **Basic knowledge of REST APIs and command line**

## Understanding the Echo-Ping Workflow

The echo-ping workflow is the simplest demonstration of how agents communicate with MCP servers in the Azure AI Travel Agents system.

### What Happens in This Workflow

1. **User Input**: You send a message to the agent
2. **Agent Processing**: The LlamaIndex.TS orchestrator processes your request
3. **MCP Communication**: The echo-ping server receives tool calls
4. **Simple Response**: The server echoes back your input or responds with "pong"
5. **Agent Response**: The orchestrator formats and returns the response

### Architecture Overview

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    User     │    │  LlamaIndex.TS  │    │   Echo-Ping     │
│   Input     │    │  Orchestrator   │    │   MCP Server    │
└─────────────┘    └─────────────────┘    └─────────────────┘
       │                      │                      │
       │ 1. "Hello World"     │                      │
       │ ─────────────────────▶                      │
       │                      │ 2. Tool Call         │
       │                      │ ─────────────────────▶
       │                      │                      │
       │                      │ 3. Echo Response     │
       │                      │ ◀─────────────────────
       │ 4. Formatted Reply   │                      │
       │ ◀─────────────────────                      │
```

## Step-by-Step Setup

### Step 1: Clone and Setup Repository

```bash
# Clone the repository
git clone https://github.com/Azure-Samples/azure-ai-travel-agents.git
cd azure-ai-travel-agents

# Navigate to the project root
ls -la  # Verify you're in the right directory
```

### Step 2: Start Docker Model Runner

1. **Start Docker Desktop** and ensure it's running
2. **Pull the AI model** (this will download ~7.8GB):

```bash
docker pull ai/phi4:14b-q4_0
```

3. **Start Docker Model Runner**:

```bash
# The preview script will handle this automatically
./preview.sh
```

### Step 3: Configure Environment for Echo-Ping

Create a minimal configuration file to test just the echo-ping functionality:

```bash
# Create a simplified .env file for testing
cd src/api
cp .env.example .env.local
```

Edit the `.env.local` file with minimal configuration:

```bash
# Minimal configuration for echo-ping testing
PORT=4000
NODE_ENV=development

# Only enable echo-ping MCP server
MCP_ECHO_PING_URL=http://localhost:5007

# Docker Model Runner configuration
LLM_PROVIDER=docker
DOCKER_MODEL=ai/phi4:14b-q4_0

# Disable other services for simplicity (optional)
# MCP_CUSTOMER_QUERY_URL=
# MCP_WEB_SEARCH_URL=
# MCP_ITINERARY_PLANNING_URL=
# MCP_MODEL_INFERENCE_URL=
# MCP_CODE_EVALUATION_URL=
# MCP_DESTINATION_RECOMMENDATION_URL=
```

### Step 4: Start the Echo-Ping Server

In a new terminal window:

```bash
# Navigate to echo-ping server
cd src/tools/echo-ping

# Install dependencies
npm install

# Start the echo-ping server
npm start
```

You should see output similar to:
```
Echo-Ping MCP Server started on port 5007
Server ready to accept connections
Available tools: echo, ping
```

### Step 5: Start the API Server

In another terminal window:

```bash
# Navigate to API directory
cd src/api

# Install dependencies
npm install

# Start the API server
npm start
```

You should see output similar to:
```
API server started on port 4000
LlamaIndex.TS orchestrator initialized
Connected to Docker Model Runner
Echo-Ping agent configured and ready
```

### Step 6: Test the Simple Workflow

You can test the workflow using curl commands or the provided UI.

#### Using curl (Command Line)

```bash
# Test the echo tool
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Please echo: Hello from the tutorial!",
    "tools": ["echo-ping"]
  }'
```

Expected response:
```json
{
  "response": "I'll echo your message: Hello from the tutorial!",
  "agent": "EchoAgent",
  "tool_calls": [
    {
      "tool": "echo",
      "input": "Hello from the tutorial!",
      "output": "Hello from the tutorial!"
    }
  ]
}
```

#### Test the ping tool

```bash
# Test the ping tool
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Please ping the server",
    "tools": ["echo-ping"]
  }'
```

Expected response:
```json
{
  "response": "Server is responding! Ping successful.",
  "agent": "EchoAgent", 
  "tool_calls": [
    {
      "tool": "ping",
      "input": {},
      "output": {
        "status": "pong",
        "timestamp": 1703123456789
      }
    }
  ]
}
```

## Testing the Simple Agent

### Option 1: Start the Full UI (Recommended)

In a new terminal:

```bash
# Navigate to UI directory
cd src/ui

# Install dependencies
npm install

# Start the Angular UI
npm start
```

Navigate to http://localhost:4200 and:

1. **Select only the "Echo-Ping" tool** from the available tools
2. **Type a simple message** like "Hello, can you echo this message?"
3. **Send the message** and observe the response
4. **Try different messages** to see how the echo functionality works

### Option 2: Using Server-Sent Events (Advanced)

For real-time streaming responses:

```bash
# Test streaming response
curl -X POST http://localhost:4000/api/chat/stream \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "message": "Echo this message with streaming",
    "tools": ["echo-ping"]
  }'
```

## Understanding the MCP Communication

### What Happens Behind the Scenes

1. **User Message Processing**:
   ```typescript
   // API receives user message
   const userMessage = "Please echo: Hello World!";
   const selectedTools = ["echo-ping"];
   ```

2. **Agent Orchestration Setup**:
   ```typescript
   // LlamaIndex.TS creates filtered agents
   const filteredTools = [{ id: "echo-ping", enabled: true }];
   const multiAgent = await setupAgents(filteredTools);
   ```

3. **Echo Agent Creation**:
   ```typescript
   // Echo agent is configured with MCP tools
   const echoAgent = agent({
     name: "EchoAgent",
     systemPrompt: "You are a helpful assistant that can echo messages and respond to ping requests.",
     tools: mcpTools, // From echo-ping server
     llm: dockerModelRunner
   });
   ```

4. **Tool Call Execution**:
   ```typescript
   // Agent decides to call the echo tool
   const result = await echoAgent.callTool("echo", {
     input: "Hello World!"
   });
   ```

5. **MCP Server Response**:
   ```typescript
   // Echo-ping server processes the request
   export async function handleEcho(input: string): Promise<string> {
     console.log(`Echo received: ${input}`);
     return input; // Simply return the input
   }
   ```

### MCP Protocol Details

The communication follows the Model Context Protocol standard:

#### Tool Discovery
```json
{
  "method": "tools/list",
  "params": {}
}
```

Response:
```json
{
  "tools": [
    {
      "name": "echo",
      "description": "Echoes back the input string",
      "inputSchema": {
        "type": "object",
        "properties": {
          "input": {"type": "string"}
        }
      }
    },
    {
      "name": "ping", 
      "description": "Simple connectivity test",
      "inputSchema": {"type": "object"}
    }
  ]
}
```

#### Tool Execution
```json
{
  "method": "tools/call",
  "params": {
    "name": "echo",
    "arguments": {
      "input": "Hello World!"
    }
  }
}
```

Response:
```json
{
  "content": [
    {
      "type": "text", 
      "text": "Hello World!"
    }
  ]
}
```

### Debugging and Monitoring

#### Check Server Logs

1. **Echo-Ping Server Logs**:
   ```bash
   # In the echo-ping terminal, you should see:
   [2024-01-01 12:00:00] Tool call received: echo
   [2024-01-01 12:00:00] Input: "Hello World!"
   [2024-01-01 12:00:00] Response: "Hello World!"
   ```

2. **API Server Logs**:
   ```bash
   # In the API terminal, you should see:
   [2024-01-01 12:00:00] Agent setup completed
   [2024-01-01 12:00:00] Echo agent activated
   [2024-01-01 12:00:00] Tool call successful: echo
   ```

#### View Monitoring Dashboard

Navigate to http://localhost:18888 to see the Aspire Dashboard:

- **Structured Logs**: View detailed logs from all services
- **Traces**: See the complete request flow from API to MCP server
- **Metrics**: Monitor performance and response times

## Next Steps

Now that you understand the basic echo-ping workflow, you can:

### 1. Add More MCP Servers

Enable additional MCP servers one by one:

```bash
# Add customer query server
MCP_CUSTOMER_QUERY_URL=http://localhost:5001

# Add web search server  
MCP_WEB_SEARCH_URL=http://localhost:5006
```

### 2. Explore Complex Workflows

Try queries that require multiple agents:

```
"I want to plan a trip to Paris. Can you search for attractions and create an itinerary?"
```

This will trigger:
- Web search for Paris attractions
- Destination recommendation analysis
- Itinerary planning coordination

### 3. Build Custom MCP Servers

Create your own MCP server following the echo-ping pattern:

```typescript
// Your custom MCP server
import { McpServer } from '@modelcontextprotocol/sdk/server/index.js';

const server = new McpServer({
  name: "my-custom-server",
  version: "1.0.0"
});

// Add your custom tools
server.setRequestHandler("tools/call", async (request) => {
  // Your custom logic here
});
```

### 4. Learn Advanced Orchestration

Study the [Orchestration Guide](./orchestration-guide.md) to understand:
- Multi-agent coordination
- Triage agent decision making
- Complex workflow patterns
- Error handling and retry logic

### 5. Deploy to Azure

When ready for production, follow the [Deployment Guide](./deployment-architecture.md) to:
- Provision Azure resources with `azd provision`
- Deploy to Azure Container Apps with `azd deploy`
- Configure production environment variables
- Set up monitoring and alerting

This tutorial provides the foundation for understanding how AI agents communicate through MCP servers in the Azure AI Travel Agents system. The echo-ping workflow, while simple, demonstrates all the core concepts you'll use when working with more complex travel planning scenarios.