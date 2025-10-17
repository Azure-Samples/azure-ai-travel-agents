# @azure-ai-travel-agents/llamaindex-ts

LlamaIndex.TS orchestrator with Express API server for the Azure AI Travel Agents platform.

## Overview

This package provides a complete standalone service with the LlamaIndex.TS-based orchestration layer and an Express API server. It uses LlamaIndex's multi-agent workflow with MCP (Model Context Protocol) tool integration to coordinate multiple AI agents for travel-related tasks.

## Features

- **Multi-Agent Workflow**: Coordinates multiple specialized agents with a triage agent
- **MCP Integration**: Uses `@llamaindex/tools` MCP adapters for tool integration
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

- **Main Orchestrator** (`src/index.ts`): Multi-agent setup and workflow definition
- **Tools** (`src/tools/`): MCP tool configurations
- **Providers** (`src/providers/`): LLM provider implementations
- **MCP Clients** (`src/mcp/`): MCP protocol client implementations
- **Server** (`src/server.ts`): Express API server

## API Endpoints

### GET /api/health
Health check endpoint
- Returns: `{ status: "OK", orchestrator: "llamaindex-ts" }`

### GET /api/tools
List available MCP tools
- Returns: `{ tools: [...] }`

### POST /api/chat
Chat endpoint with streaming support
- Request body: `{ message: string, tools: Array }`
- Response: Server-Sent Events stream

## Agents

The package includes the following specialized agents:

1. **TravelAgent** (Triage): Routes queries to the appropriate specialized agent
2. **CustomerQueryAgent**: Handles customer queries and preferences
3. **ItineraryPlanningAgent**: Creates detailed travel itineraries
4. **DestinationRecommendationAgent**: Suggests destinations based on preferences
5. **EchoAgent**: Test/debug agent that echoes input

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
docker build -t llamaindex-api .
docker run -p 4001:4001 \
  -e AZURE_OPENAI_API_KEY=your-key \
  llamaindex-api
```

### API Examples

```bash
# Health check
curl http://localhost:4001/api/health

# List tools
curl http://localhost:4001/api/tools

# Chat (streaming)
curl -X POST http://localhost:4001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Plan a trip to Paris", "tools": [...]}'
```

### Using as a Library

```typescript
import { setupAgents, McpToolsConfig } from '@azure-ai-travel-agents/api-llamaindex-ts';

const tools = Object.values(McpToolsConfig());
const workflow = await setupAgents(tools);
const result = await workflow.chat({ message: "Plan a trip to Paris" });

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
- `llamaindex` - LlamaIndex core library
- `@llamaindex/tools` - MCP tool adapters
- `@modelcontextprotocol/sdk` - MCP protocol SDK

## Related Packages

- `@azure-ai-travel-agents/langchain-js` - Alternative LangChain.js orchestrator

## License

MIT
