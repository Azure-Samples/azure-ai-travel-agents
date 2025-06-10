# Agent2Agent (A2A) Protocol Integration

This document describes the Agent2Agent (A2A) protocol integration in the Azure AI Travel Agents system, enabling direct agent-to-agent communication and collaboration.

## Overview

The Agent2Agent (A2A) protocol is an open standard that enables communication and interoperability between opaque agentic applications. In this system, A2A complements the existing MCP (Model Context Protocol) architecture by providing:

- **Agent Discovery**: Agents can discover each other's capabilities
- **Direct Communication**: Agents can communicate directly without exposing internal state
- **Capability Negotiation**: Agents can negotiate interaction modalities
- **Secure Collaboration**: Agents can collaborate on long-running tasks securely

## Architecture

The A2A integration consists of several key components:

### A2A Server
- Exposes local agents via JSON-RPC 2.0 over HTTP(S)
- Handles agent discovery, execution, and status requests
- Provides RESTful endpoints for convenience

### A2A Client
- Connects to remote A2A servers
- Provides methods for discovering and executing remote agents
- Includes retry logic and authentication support

### A2A Agent Registry
- Manages multiple A2A servers
- Provides unified access to local and remote agents
- Handles agent discovery across multiple endpoints

### Travel Agent Adapters
- Wraps existing LlamaIndex agents for A2A compatibility
- Provides specialized capabilities for travel-related tasks
- Maintains compatibility with existing MCP tools

## Protocol Specification

### Agent Cards

Each agent exposes an "Agent Card" describing its capabilities:

```json
{
  "id": "triage-agent",
  "name": "Triage Agent",
  "description": "Central coordinator that analyzes queries and routes them to appropriate specialized agents",
  "version": "1.0.0",
  "capabilities": [
    {
      "type": "text",
      "name": "triage",
      "description": "Analyze user queries and determine the best course of action",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": { "type": "string", "description": "User's travel query" },
          "context": { "type": "object", "description": "Additional context" }
        },
        "required": ["query"]
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "message": { "type": "string", "description": "Response message" },
          "next_agent": { "type": "string", "description": "Recommended next agent" },
          "confidence": { "type": "number", "description": "Confidence score" }
        }
      }
    }
  ],
  "endpoints": [
    {
      "type": "http",
      "url": "http://localhost:3001/a2a",
      "methods": ["POST"],
      "authentication": { "type": "none" }
    }
  ],
  "metadata": {
    "type": "travel-agent",
    "framework": "llamaindex",
    "created": "2024-01-01T00:00:00.000Z"
  }
}
```

### JSON-RPC Methods

#### Discovery (`a2a.discover`)
Discover available agents and their capabilities.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "a2a.discover",
  "params": {
    "filter": ["triage", "customer-query"]
  },
  "id": 1
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "agents": [...]
  },
  "id": 1
}
```

#### Execute (`a2a.execute`)
Execute a capability on a specific agent.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "a2a.execute",
  "params": {
    "agent_id": "triage-agent",
    "capability": "triage",
    "input": {
      "query": "I want to plan a vacation to Tokyo"
    },
    "context": {
      "user_id": "user123",
      "session_id": "session456"
    }
  },
  "id": 2
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "output": {
      "message": "I'll help you plan your Tokyo vacation. Let me gather some information about your preferences.",
      "next_agent": "customer-query-agent",
      "confidence": 0.95
    },
    "metadata": {
      "capability": "triage",
      "agent_id": "triage-agent",
      "timestamp": "2024-01-01T12:00:00.000Z"
    }
  },
  "id": 2
}
```

#### Status (`a2a.status`)
Check the status of an agent or the server.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "a2a.status",
  "params": {
    "agent_id": "triage-agent"
  },
  "id": 3
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "status": "active",
    "message": "Agent is ready",
    "load": 0.1
  },
  "id": 3
}
```

## Configuration

### Environment Variables

A2A integration is configured through environment variables:

```bash
# A2A Server Configuration
A2A_SERVER_ENABLED=true
A2A_SERVER_PORT=3001
A2A_SERVER_HOST=localhost

# A2A Client Configuration
A2A_CLIENT_ENABLED=true
A2A_REGISTRIES='[{"name":"remote-server","baseUrl":"http://remote:3001"}]'

# Agent-to-Agent Communication
A2A_AGENT_TO_AGENT=true
```

### Server Configuration

```typescript
const a2aConfig: A2AIntegrationConfig = {
  server: {
    enabled: true,
    port: 3001,
    host: "localhost"
  },
  client: {
    enabled: true,
    registries: [
      {
        name: "remote-travel-agents",
        baseUrl: "http://remote-server:3001",
        authentication: {
          type: "bearer",
          details: { token: "your-token-here" }
        }
      }
    ]
  },
  enableAgentToAgentCommunication: true
};
```

## Available Agents

The system provides A2A-compatible versions of all travel agents:

### Triage Agent (`triage-agent`)
- **Capability**: `triage`
- **Purpose**: Central coordinator and decision maker
- **Input**: User queries and context
- **Output**: Analysis and routing recommendations

### Customer Query Agent (`customer-query-agent`)
- **Capability**: `extract_preferences`
- **Purpose**: Extract travel preferences from natural language
- **Input**: Customer inquiries
- **Output**: Structured preferences

### Destination Recommendation Agent (`destination-agent`)
- **Capability**: `recommend_destinations`
- **Purpose**: Suggest destinations based on preferences
- **Input**: Travel preferences
- **Output**: Ranked destination recommendations

### Itinerary Planning Agent (`itinerary-agent`)
- **Capability**: `create_itinerary`
- **Purpose**: Create detailed travel itineraries
- **Input**: Destination and preferences
- **Output**: Day-by-day itinerary with activities

### Web Search Agent (`web-search-agent`)
- **Capability**: `search_travel_info`
- **Purpose**: Search for current travel information
- **Input**: Search queries and filters
- **Output**: Relevant travel information

## Usage Examples

### Basic Agent Discovery

```typescript
import { A2AClient } from './a2a';

const client = new A2AClient({
  baseUrl: 'http://localhost:3001'
});

// Discover all agents
const agents = await client.discover();
console.log('Available agents:', agents);

// Discover specific agents
const travelAgents = await client.discover(['triage', 'itinerary']);
```

### Agent Execution

```typescript
// Execute a capability
const result = await client.execute(
  'triage-agent',
  'triage',
  { query: 'Plan a 7-day trip to Japan' },
  { user_id: 'user123' }
);

console.log('Triage result:', result);
```

### Agent Registry

```typescript
import { A2AAgentRegistry } from './a2a';

const registry = new A2AAgentRegistry();

// Register multiple servers
await registry.registerServer('local', {
  baseUrl: 'http://localhost:3001'
});

await registry.registerServer('remote', {
  baseUrl: 'http://remote-server:3001',
  authentication: {
    type: 'bearer',
    details: { token: 'secret-token' }
  }
});

// Execute on any agent across all servers
const result = await registry.execute(
  'specialized-agent',
  'analyze',
  { data: 'input' }
);
```

## Error Handling

The A2A protocol uses standard JSON-RPC 2.0 error codes plus A2A-specific extensions:

- `-32001`: Agent not found
- `-32002`: Capability not supported
- `-32003`: Agent busy
- `-32004`: Agent unavailable
- `-32005`: Authentication failed
- `-32006`: Quota exceeded
- `-32007`: Execution timeout

## Security Considerations

### Authentication
- Bearer token authentication for remote agents
- Basic authentication support
- Custom authentication headers

### Authorization
- Agent-level access control
- Capability-specific permissions
- Rate limiting and quotas

### Network Security
- HTTPS for production deployments
- CORS configuration for web clients
- Request/response validation

## Monitoring and Observability

### Metrics
- Agent execution times
- Success/failure rates
- Agent load and availability

### Logging
- Request/response logging
- Error tracking
- Performance monitoring

### Health Checks
- Agent status monitoring
- Server health endpoints
- Automatic failover capabilities

## Integration with Existing System

The A2A protocol integrates seamlessly with the existing MCP-based architecture:

1. **Complementary Protocols**: A2A handles agent-to-agent communication while MCP handles agent-to-tool communication
2. **Shared Agents**: The same LlamaIndex agents serve both MCP tools and A2A capabilities
3. **Unified Orchestration**: The LlamaIndex orchestrator manages both protocols
4. **Cross-Protocol Communication**: Agents can use both MCP tools and A2A agents within the same workflow

## Future Enhancements

- **Streaming Support**: Add Server-Sent Events (SSE) for real-time agent communication
- **WebSocket Support**: Enable persistent connections for long-running collaborations
- **Agent Composition**: Allow dynamic composition of agent workflows
- **Federated Discovery**: Enable agent discovery across multiple networks
- **Advanced Security**: Add encryption and digital signatures for secure agent communication