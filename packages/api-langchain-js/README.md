# @azure-ai-travel-agents/langchain-js

LangChain.js orchestrator with Express API server for the Azure AI Travel Agents platform.

## Overview

This package provides a complete standalone service with the LangChain.js-based orchestration layer and an Express API server. It uses LangGraph's supervisor pattern with MCP (Model Context Protocol) adapters to coordinate multiple AI agents for travel-related tasks.

## Features

- **LangGraph Supervisor Pattern**: Coordinates multiple specialized agents
- **MCP Integration**: Uses `@langchain/mcp-adapters` for tool integration
- **Express API Server**: RESTful endpoints with SSE streaming
- **Multiple LLM Providers**: 
  - Azure OpenAI
  - Docker Models
  - GitHub Models
  - Ollama
  - Foundry Local
- **Streaming Support**: Real-time response streaming
- **Type-Safe**: Full TypeScript support
- **Standalone**: Complete service with no external dependencies

## Architecture

The package consists of:

- **Agents** (`src/agents/`): Specialized AI agents for different travel tasks
- **Graph** (`src/graph/`): LangGraph workflow definition
- **Tools** (`src/tools/`): MCP tool bridges and configurations
- **Providers** (`src/providers/`): LLM provider implementations
- **MCP Clients** (`src/mcp/`): MCP protocol client implementations
- **Server** (`src/server.ts`): Express API server

## API Endpoints

### GET /api/health
Health check endpoint
- Returns: `{ status: "OK", orchestrator: "langchain-js" }`

### GET /api/tools
List available MCP tools
- Returns: `{ tools: [...] }`

### POST /api/chat
Chat endpoint with streaming support
- Request body: `{ message: string, tools: Array }`
- Response: Server-Sent Events stream

## Usage

### Running the Server

```bash
# Development mode
npm start

# Production build
npm run build
node dist/server.js
```

### Docker

```bash
docker build -t langchain-api .
docker run -p 4000:4000 \
  -e AZURE_OPENAI_API_KEY=your-key \
  langchain-api
```

### API Examples

```bash
# Health check
curl http://localhost:4000/api/health

# List tools
curl http://localhost:4000/api/tools

# Chat (streaming)
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Plan a trip to Paris", "tools": [...]}'
```

### Using as a Library

```typescript
import { setupAgents, McpToolsConfig } from '@azure-ai-travel-agents/langchain-js';

const tools = Object.values(McpToolsConfig());
const workflow = await setupAgents(tools);
const result = workflow.run("Plan a trip to Paris");

for await (const event of result) {
  console.log(event);
}
```

Configure via environment variables:

- `AZURE_OPENAI_API_KEY` - Azure OpenAI API key
- `AZURE_OPENAI_ENDPOINT` - Azure OpenAI endpoint
- `AZURE_OPENAI_DEPLOYMENT` - Azure OpenAI deployment name
- `MCP_*_URL` - MCP service URLs (e.g., `MCP_CUSTOMER_QUERY_URL`)
- `MCP_*_ACCESS_TOKEN` - MCP service access tokens

See `.env.example` in the repository root for all configuration options.

## Development

```bash
# Build
npm run build

# Clean
npm run clean
```

## Dependencies

Key dependencies:
- `@langchain/langgraph` - Graph-based workflow orchestration
- `@langchain/mcp-adapters` - MCP protocol adapters
- `@langchain/openai` - OpenAI/Azure OpenAI integration
- `@azure-ai-travel-agents/shared` - Shared types and utilities

## Related Packages

- `@azure-ai-travel-agents/shared` - Shared types and utilities
- `azure-ai-travel-agents-api` - Main API gateway

## License

MIT
