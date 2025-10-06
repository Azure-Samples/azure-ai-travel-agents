# MCP Tools for Microsoft Agent Framework

This directory contains the implementation of Model Context Protocol (MCP) tools integration with Microsoft Agent Framework, following SDK best practices.

## Overview

The MCP tools implementation provides a bridge between MCP servers and Microsoft Agent Framework's `ChatAgent`, enabling agents to use external tools following the MCP protocol specification.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Microsoft Agent Framework                 │
│                         ChatAgent                            │
└──────────────────────────┬──────────────────────────────────┘
                           │ uses AIFunction
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    MCPToolWrapper                            │
│  • Discovers MCP tools                                       │
│  • Converts to MAF AIFunction                                │
│  • Handles parameter validation                              │
└──────────────────────────┬──────────────────────────────────┘
                           │ calls
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    MCP Clients                               │
│  • HTTPMCPClient    (for HTTP endpoints)                     │
│  • SSEMCPClient     (for SSE streaming)                      │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/SSE
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    MCP Servers                               │
│  • itinerary-planning                                        │
│  • customer-query                                            │
│  • web-search                                                │
│  • destination-recommendation                                │
│  • and more...                                               │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. MCP Clients (`mcp_client.py`)

Base clients for communicating with MCP servers:

- **`HTTPMCPClient`**: For standard HTTP MCP endpoints
- **`SSEMCPClient`**: For Server-Sent Events streaming endpoints

Both implement the `MCPClient` interface with:
- `call_tool()`: Execute a tool on the MCP server
- `list_tools()`: Discover available tools
- `close()`: Cleanup resources

### 2. MCP Tool Wrapper (`mcp_tool_wrapper.py`)

Bridges MCP tools with Microsoft Agent Framework:

- **`MCPToolWrapper`**: Wraps MCP servers for MAF integration
  - Discovers tools from MCP servers
  - Converts MCP tool schemas to Pydantic models
  - Creates `AIFunction` instances for MAF
  - Handles async execution and error handling

### 3. Tool Registry (`tool_registry.py`)

Centralized management of MCP servers:

- **`ToolRegistry`**: Manages multiple MCP server connections
  - Initializes clients for all configured servers
  - Provides `get_all_tools()` for loading into agents
  - Handles resource lifecycle

### 4. Configuration (`tool_config.py`)

MCP server configuration:

- Server URLs and connection types (HTTP/SSE)
- Server metadata and capabilities
- Mirrored from TypeScript implementation

## Usage

### Basic Example

```python
from orchestrator.tools.tool_registry import tool_registry
from orchestrator.agents.base_agent import BaseAgent
from orchestrator.providers.azure_openai import get_azure_openai_client

# Get LLM client
llm_client = await get_azure_openai_client()

# Load all MCP tools
mcp_tools = await tool_registry.get_all_tools()

# Create agent with MCP tools
agent = BaseAgent(
    name="travel_agent",
    description="AI travel planning assistant",
    system_prompt="You are a helpful travel planning assistant.",
    tools=mcp_tools  # Pass MCP tools to agent
)

# Initialize agent with LLM
await agent.initialize(llm_client)

# Use the agent
response = await agent.process("Plan a 3-day trip to Paris")
```

### Loading Specific MCP Servers

```python
# Load tools from specific servers only
mcp_tools = await tool_registry.get_all_tools(
    servers=["itinerary-planning", "customer-query"]
)

agent = BaseAgent(
    name="specialized_agent",
    description="Itinerary planning specialist",
    system_prompt="You specialize in creating travel itineraries.",
    tools=mcp_tools
)
```

### Direct Tool Calls (Advanced)

```python
# Call MCP tool directly (bypasses MAF wrapper)
result = await tool_registry.call_tool(
    server="itinerary-planning",
    tool_name="suggest_hotels",
    arguments={
        "location": "Paris",
        "check_in": "2024-06-01",
        "check_out": "2024-06-04"
    }
)
```

### Resource Management

```python
# Always cleanup resources when done
try:
    # Use tools...
    pass
finally:
    await tool_registry.close_all()
```

## MCP Protocol Support

This implementation follows the Model Context Protocol specification:

### HTTP MCP Servers

- **Discovery**: `GET {base_url}` returns tool definitions
- **Execution**: `POST {base_url}/call` with `{name, arguments}`
- **Response**: JSON result from tool execution

### SSE MCP Servers

- **Discovery**: `GET {base_url}` returns tool definitions
- **Execution**: `POST {base_url}/call` with SSE streaming
- **Response**: Server-Sent Events with streaming results

## Best Practices

### 1. Tool Discovery

Always discover tools dynamically rather than hardcoding:

```python
# Good: Dynamic discovery
tools = await wrapper.get_tools()

# Avoid: Hardcoded tool definitions
```

### 2. Error Handling

MCP tool wrappers handle errors gracefully:

```python
# Tools return error messages instead of raising exceptions
# This allows agents to handle errors and continue
result = await tool_function(**kwargs)
# Returns: "Error executing tool: connection refused"
```

### 3. Parameter Validation

Pydantic models ensure type safety:

```python
# Parameters are validated against MCP inputSchema
# Invalid types are caught before calling MCP server
```

### 4. Async Execution

All operations are async for non-blocking I/O:

```python
# Always use await
tools = await tool_registry.get_all_tools()
result = await agent.process(message)
```

### 5. Resource Cleanup

Always cleanup MCP clients:

```python
# In FastAPI lifespan or shutdown handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await tool_registry.close_all()
```

## Configuration

MCP servers are configured in `tool_config.py`:

```python
MCP_TOOLS_CONFIG = {
    "itinerary-planning": {
        "config": {
            "url": "http://localhost:8001/mcp",
            "type": "http",
            "verbose": True,
        },
        "id": "itinerary-planning",
        "name": "Itinerary Planning",
    },
    # ...
}
```

Environment variables (`.env`):

```bash
MCP_ITINERARY_PLANNING_URL=http://itinerary-planning:8001
MCP_CUSTOMER_QUERY_URL=http://customer-query:8002
# ...
```

## Testing

Run tests:

```bash
# All MCP tests
pytest src/tests/test_mcp_client.py -v

# With coverage
pytest src/tests/test_mcp_client.py --cov=src/orchestrator/tools
```

## Reference

- [Microsoft Agent Framework MCP Documentation](https://learn.microsoft.com/en-us/agent-framework/user-guide/model-context-protocol/using-mcp-tools?pivots=programming-language-python)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Microsoft Agent Framework SDK](https://learn.microsoft.com/en-us/agent-framework/)

## Migration Guide

### From Custom Tool Wrappers

If you have custom MCP tool wrappers, migrate to this implementation:

**Before:**
```python
# Custom wrapper
class MyMCPTool:
    def __init__(self, url):
        self.url = url
    
    async def call(self, name, args):
        # Custom HTTP logic
        pass
```

**After:**
```python
# Use standard MCP clients
from orchestrator.tools.mcp_client import HTTPMCPClient

client = HTTPMCPClient(base_url=url)
result = await client.call_tool(name, args)
```

### From Direct HTTP Calls

**Before:**
```python
import httpx
async with httpx.AsyncClient() as client:
    response = await client.post(f"{url}/call", json=payload)
```

**After:**
```python
from orchestrator.tools.tool_registry import tool_registry

tools = await tool_registry.get_all_tools()
# Tools are automatically available to agents
```

## Troubleshooting

### Tool Discovery Fails

Check server connectivity:

```python
# List available tools for debugging
all_tools = await tool_registry.list_tools()
print(all_tools)
```

### Type Validation Errors

MCP schema may not match expected types:

```python
# Check MCP tool inputSchema
tools = await client.list_tools()
for tool in tools:
    print(f"{tool['name']}: {tool['inputSchema']}")
```

### SSE Connection Issues

Ensure server supports SSE:

```bash
curl -H "Accept: text/event-stream" http://localhost:8000/sse/call
```

## Future Enhancements

- [ ] Support for MCP resource providers
- [ ] Streaming responses in MAF tools
- [ ] Tool result caching
- [ ] Parallel tool execution
- [ ] Tool usage metrics and monitoring
