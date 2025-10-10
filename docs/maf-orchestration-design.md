# Microsoft Agent Framework (MAF) Orchestration Design

## Overview

This document outlines the design for reimplementing the orchestration layer of the Azure AI Travel Agents application using the Microsoft Agent Framework (MAF) Python SDK.

## Background

### Current Implementation
The current orchestration layer uses:
- **Framework**: LlamaIndex.TS
- **Language**: TypeScript/Node.js
- **Location**: `src/api/src/orchestrator/llamaindex/`
- **Pattern**: Multi-agent workflow with triage agent as root

### New Implementation Goals
Migrate to Microsoft Agent Framework to:
- Leverage MAF's native agent orchestration capabilities
- Use Python ecosystem for AI/ML workflows
- Utilize MAF's workflow patterns and best practices
- Improve integration with Azure AI services
- Enable better agent coordination and state management

## Architecture Design

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Angular)                       │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/SSE
┌─────────────────────────▼───────────────────────────────────┐
│           Python API Server (FastAPI)                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │     MAF Orchestration Layer                           │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │          MAF Workflow Engine                     │  │  │
│  │  │  - Multi-agent coordination                      │  │  │
│  │  │  - State management                              │  │  │
│  │  │  - Agent handoff orchestration                   │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  │  ┌──────────────────────────────────────┐             │  │
│  │  │     MAF Agents                        │             │  │
│  │  │  - Triage Agent (root)                │             │  │
│  │  │  - Customer Query Agent               │             │  │
│  │  │  - Destination Recommendation Agent   │             │  │
│  │  │  - Itinerary Planning Agent           │             │  │
│  │  │  - Code Evaluation Agent              │             │  │
│  │  │  - Model Inference Agent              │             │  │
│  │  │  - Web Search Agent                   │             │  │
│  │  │  - Echo Ping Agent                    │             │  │
│  │  └──────────────────────────────────────┘             │  │
│  │                                                         │  │
│  │  ┌──────────────────────────────────────┐             │  │
│  │  │     MCP Client Integration            │             │  │
│  │  │  - HTTP MCP Client                    │             │  │
│  │  │  - SSE MCP Client                     │             │  │
│  │  │  - Tool Registry                      │             │  │
│  │  └──────────────────────────────────────┘             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │ MCP Protocol
┌─────────────────────────▼───────────────────────────────────┐
│              MCP Tool Servers                                 │
│  (Customer Query, Destination, Itinerary, Code Eval, etc.)   │
└───────────────────────────────────────────────────────────────┘
```

### Component Design

#### 1. MAF Workflow Engine
- **Purpose**: Orchestrate multi-agent workflows
- **Responsibilities**:
  - Coordinate agent execution
  - Manage workflow state
  - Handle agent-to-agent communication
  - Implement parallel and sequential execution patterns
  - Error handling and recovery

#### 2. MAF Agents
Each agent will be implemented as a MAF agent with:
- **Configuration**: Agent name, system prompt, capabilities
- **Tools**: MCP tools specific to the agent's domain
- **LLM Integration**: Azure OpenAI connection
- **State Management**: Conversation context and history

**Agent Definitions**:

1. **Triage Agent** (Root Agent)
   - Role: Route queries to appropriate specialized agents
   - Tools: Access to all available tools for context
   - Handoff: Can delegate to any specialized agent

2. **Customer Query Agent**
   - Role: Understand customer preferences and requirements
   - Tools: Customer query analysis tools (MCP server)

3. **Destination Recommendation Agent**
   - Role: Suggest travel destinations
   - Tools: Destination recommendation tools (MCP server)

4. **Itinerary Planning Agent**
   - Role: Create detailed travel itineraries
   - Tools: Itinerary planning tools (MCP server)

5. **Code Evaluation Agent**
   - Role: Execute code and calculations
   - Tools: Code evaluation tools (MCP server)

6. **Model Inference Agent**
   - Role: Perform specialized model inference
   - Tools: Model inference tools (MCP server)

7. **Web Search Agent**
   - Role: Search web for travel information
   - Tools: Web search tools (MCP server)

8. **Echo Ping Agent**
   - Role: Echo back input for testing
   - Tools: Echo ping tools (MCP server)

#### 3. MCP Client Integration

**HTTP MCP Client**:
- Support for HTTP-based MCP tool servers
- Request/response handling
- Retry logic with exponential backoff
- Error handling

**SSE MCP Client**:
- Support for Server-Sent Events based MCP servers
- Streaming response handling
- Connection management

**Tool Registry**:
- Centralized tool configuration
- Dynamic tool loading based on selected tools
- Tool metadata and capabilities

### Workflow Patterns

#### 1. Sequential Workflow
```python
# Example: Customer Query → Destination → Itinerary
async def sequential_travel_planning(user_query: str):
    # Step 1: Understand customer preferences
    preferences = await customer_query_agent.process(user_query)
    
    # Step 2: Get destination recommendations
    destinations = await destination_agent.process(preferences)
    
    # Step 3: Create itinerary
    itinerary = await itinerary_agent.process({
        "destinations": destinations,
        "preferences": preferences
    })
    
    return itinerary
```

#### 2. Parallel Workflow
```python
# Example: Get destination recommendations and current travel data in parallel
async def parallel_travel_research(preferences: dict):
    # Execute multiple agents in parallel
    results = await asyncio.gather(
        destination_agent.process(preferences),
        web_search_agent.process({"query": "current travel conditions"})
    )
    
    return {
        "recommendations": results[0],
        "current_data": results[1]
    }
```

#### 3. Conditional Workflow
```python
# Example: Route based on query type
async def conditional_routing(user_query: str):
    # Triage agent determines the workflow
    intent = await triage_agent.analyze_intent(user_query)
    
    if intent.type == "destination_search":
        return await destination_agent.process(user_query)
    elif intent.type == "itinerary_planning":
        return await itinerary_agent.process(user_query)
    else:
        return await triage_agent.process(user_query)
```

## Implementation Plan

### Directory Structure
```
src/
├── api/                     # Existing TypeScript API (to be maintained or replaced)
└── api-python/              # New Python API with MAF
    ├── pyproject.toml       # Python project configuration
    ├── Dockerfile           # Container configuration
    ├── .env.sample          # Environment variables template
    ├── src/
    │   ├── __init__.py
    │   ├── main.py          # FastAPI application entry point
    │   ├── config.py        # Configuration management
    │   ├── orchestrator/    # MAF orchestration layer
    │   │   ├── __init__.py
    │   │   ├── workflow.py  # Workflow engine implementation
    │   │   ├── agents/      # Agent implementations
    │   │   │   ├── __init__.py
    │   │   │   ├── base.py  # Base agent class
    │   │   │   ├── triage_agent.py
    │   │   │   ├── customer_query_agent.py
    │   │   │   ├── destination_agent.py
    │   │   │   ├── itinerary_agent.py
    │   │   │   ├── code_eval_agent.py
    │   │   │   ├── model_inference_agent.py
    │   │   │   ├── web_search_agent.py
    │   │   │   └── echo_agent.py
    │   │   └── tools/       # MCP tool integration
    │   │       ├── __init__.py
    │   │       ├── mcp_client.py      # MCP client base
    │   │       ├── http_client.py     # HTTP MCP client
    │   │       ├── sse_client.py      # SSE MCP client
    │   │       └── tool_registry.py   # Tool configuration
    │   ├── api/             # FastAPI routes and endpoints
    │   │   ├── __init__.py
    │   │   ├── chat.py      # Chat endpoint
    │   │   ├── tools.py     # Tools endpoint
    │   │   └── health.py    # Health check endpoint
    │   └── utils/           # Utility functions
    │       ├── __init__.py
    │       ├── telemetry.py # OpenTelemetry setup
    │       └── streaming.py # SSE streaming utilities
    └── tests/               # Test files
        ├── __init__.py
        ├── test_agents.py
        ├── test_workflow.py
        └── test_api.py
```

### Technology Stack

**Core Dependencies**:
- `agent-framework` - Microsoft Agent Framework Python SDK
- `fastapi` - Web framework for API
- `uvicorn` - ASGI server
- `pydantic` - Data validation
- `httpx` - HTTP client for MCP
- `sse-starlette` - Server-Sent Events support
- `opentelemetry-api` - Observability
- `opentelemetry-sdk` - Telemetry SDK
- `azure-identity` - Azure authentication
- `azure-ai-projects` - Azure AI integration
- `python-dotenv` - Environment management

### Configuration

**Environment Variables**:
```txt
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_DEPLOYMENT=
AZURE_OPENAI_API_VERSION=

# MCP Server URLs
MCP_CUSTOMER_QUERY_URL=
MCP_DESTINATION_RECOMMENDATION_URL=
MCP_ITINERARY_PLANNING_URL=
MCP_CODE_EVALUATION_URL=
MCP_MODEL_INFERENCE_URL=
MCP_WEB_SEARCH_URL=
MCP_ECHO_PING_URL=
MCP_ECHO_PING_ACCESS_TOKEN=

# Server Configuration
PORT=4000
LOG_LEVEL=INFO

# Telemetry
OTLP_ENDPOINT=
OTEL_SERVICE_NAME=api-python
```

## Migration Strategy

### Phase 1: Parallel Deployment
1. Deploy new Python API alongside existing TypeScript API
2. Use feature flags or separate endpoints for testing
3. Gradually migrate traffic to Python API

### Phase 2: Integration Testing
1. Validate all agent workflows
2. Test MCP tool integration
3. Performance benchmarking
4. End-to-end testing with UI

### Phase 3: Full Migration
1. Update UI to point to new Python API
2. Update Docker Compose configuration
3. Update Azure deployment configurations
4. Deprecate TypeScript API (or keep for backup)

## Best Practices from MAF

### 1. Agent Design
- Keep agents focused on specific tasks
- Use clear system prompts
- Implement proper error handling
- Add telemetry and logging

### 2. Workflow Design
- Design workflows for observability
- Implement retry and fallback strategies
- Use async/await for concurrent operations
- Maintain conversation context

### 3. Tool Integration
- Validate tool inputs and outputs
- Implement timeout handling
- Add circuit breaker patterns for external services
- Cache responses when appropriate

### 4. State Management
- Use MAF's built-in state management
- Implement proper session handling
- Track conversation history
- Manage workflow context

### 5. Observability
- Instrument all agents and workflows
- Use structured logging
- Implement distributed tracing
- Monitor performance metrics

## Testing Strategy

### Unit Tests
- Test individual agent implementations
- Test MCP client implementations
- Test workflow logic

### Integration Tests
- Test agent-to-agent handoffs
- Test MCP tool integration
- Test workflow orchestration

### End-to-End Tests
- Test complete user workflows
- Test streaming responses
- Test error scenarios
- Test concurrent requests

## Performance Considerations

### Optimization Strategies
1. **Connection Pooling**: Reuse HTTP connections to MCP servers
2. **Caching**: Cache tool responses and agent outputs where appropriate
3. **Parallel Execution**: Use asyncio for concurrent agent operations
4. **Streaming**: Implement streaming responses for better UX
5. **Resource Management**: Proper cleanup of connections and resources

### Monitoring Metrics
- Request latency
- Agent execution time
- MCP tool call latency
- Error rates
- Concurrent request handling

## Security Considerations

### Authentication & Authorization
- Secure API endpoints
- Validate MCP tool access
- Implement rate limiting
- Use Azure Managed Identity where possible

### Data Protection
- Sanitize user inputs
- Validate tool outputs
- Implement proper error messages (no sensitive data)
- Secure configuration management

## Conclusion

This design provides a comprehensive approach to reimplementing the orchestration layer using Microsoft Agent Framework. The modular architecture allows for incremental migration and testing, ensuring a smooth transition from the current LlamaIndex.TS implementation.

## References

- [Microsoft Agent Framework GitHub](https://github.com/microsoft/agent-framework)
- [MAF Python Quick Start](https://learn.microsoft.com/en-us/agent-framework/tutorials/quick-start?pivots=programming-language-python)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Azure AI Services](https://learn.microsoft.com/azure/ai-services/)
