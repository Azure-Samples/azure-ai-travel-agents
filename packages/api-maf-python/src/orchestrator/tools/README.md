# MCP Tools Integration with Microsoft Agent Framework

This directory contains the MCP (Model Context Protocol) tools integration using **Microsoft Agent Framework's built-in MCP support**.

## Overview

The implementation uses MAF's `MCPStreamableHTTPTool` exclusively - no custom transport code. The Tool Registry stores metadata and creates fresh tool instances per request, following MAF best practices.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Microsoft Agent Framework                 │
│                         ChatAgent                            │
└──────────────────────────┬──────────────────────────────────┘
                           │ uses tools
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 MCPStreamableHTTPTool                        │
│                  (MAF Built-in)                              │
│  • Automatic connection management                           │
│  • Tool discovery on connection                              │
│  • Async lifecycle handling                                  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    MCP Servers                               │
│  • customer-query         (Java/Spring, port 5001)           │
│  • destination-recommendation (Python, port 5002)            │
│  • itinerary-planning     (Node.js, port 5003)               │
│  • echo-ping              (Test server, port 5004)           │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Tool Configuration (`tool_config.py`)

Defines all configured MCP servers:

```python
MCP_TOOLS_CONFIG = {
    "customer-query": {
        "config": {
            "url": "http://localhost:5001/mcp",
            "type": "http",
            "verbose": True,
        },
        "id": "customer-query",
        "name": "Customer Query",
    },
    # ... more servers
}
```

### 2. Tool Registry (`tool_registry.py`)

**Metadata-only registry** - creates fresh tool instances on demand:

```python
class ToolRegistry:
    """Registry for managing MCP tool metadata.
    
    Stores only metadata - no persistent connections.
    Each request creates fresh MCPStreamableHTTPTool instances.
    """
    
    def get_server_metadata(self, server_id: str) -> Dict:
        """Get metadata for creating MCP tools."""
        return self._server_metadata.get(server_id)
    
    def create_mcp_tool(self, server_id: str) -> MCPStreamableHTTPTool:
        """Create fresh MCP tool instance (MAF handles lifecycle)."""
        metadata = self.get_server_metadata(server_id)
        return MCPStreamableHTTPTool(
            name=metadata["name"],
            url=metadata["url"],
            load_tools=True,
            request_timeout=30,
        )
    
    async def list_tools(self) -> Dict:
        """Connect to servers and list available tools."""
        # Creates temporary connections to discover tools
        # Returns: {"tools": [{id, name, url, type, reachable, tools}]}
```

### 3. MCP Tool Wrapper (`mcp_tool_wrapper.py`)

**Status:** Deprecated - use `MCPStreamableHTTPTool` directly from MAF.

This file contains legacy code and may be removed in future versions.

## Usage

### Basic Pattern (Recommended)

```python
from agent_framework import MCPStreamableHTTPTool, ChatAgent, MagenticBuilder
from orchestrator.tools.tool_registry import tool_registry
from orchestrator.providers import get_llm_client

# 1. Get LLM client
chat_client = await get_llm_client()

# 2. Get MCP server metadata
metadata = tool_registry.get_server_metadata("customer-query")

# 3. Create MCP tool (MAF handles everything)
mcp_tool = MCPStreamableHTTPTool(
    name=metadata["name"],
    url=metadata["url"],
    headers={"Authorization": f"Bearer {token}"} if token else None,
    load_tools=True,
    load_prompts=False,
    request_timeout=30,
) if metadata else None

# 4. Create agent with tool
customer_agent = ChatAgent(
    name="CustomerQueryAgent",
    chat_client=chat_client,
    tools=mcp_tool,  # ← MAF manages lifecycle
    instructions="You are a customer service agent...",
)

# 5. Build workflow
workflow = (
    MagenticBuilder()
    .participants(CustomerQueryAgent=customer_agent)
    .on_event(on_event, mode=MagenticCallbackMode.STREAMING)
    .build()
)

# 6. Run workflow (tool connects/disconnects automatically)
async for event in workflow.run_stream(user_message):
    yield event
```

### Creating Multiple Agents with Different Tools

```python
# Get metadata for different servers
customer_metadata = tool_registry.get_server_metadata("customer-query")
itinerary_metadata = tool_registry.get_server_metadata("itinerary-planning")

# Create separate tools
customer_tool = MCPStreamableHTTPTool(...) if customer_metadata else None
itinerary_tool = MCPStreamableHTTPTool(...) if itinerary_metadata else None

# Create specialized agents
customer_agent = ChatAgent(..., tools=customer_tool)
itinerary_agent = ChatAgent(..., tools=itinerary_tool)

# Build workflow with multiple agents
workflow = (
    MagenticBuilder()
    .participants(
        CustomerQueryAgent=customer_agent,
        ItineraryAgent=itinerary_agent,
    )
    .build()
)
```

### Listing Available Tools (Discovery)

```python
# Get all configured servers with reachability status
tools_info = await tool_registry.list_tools()

# Returns:
# {
#   "tools": [
#     {
#       "id": "customer-query",
#       "name": "Customer Query",
#       "url": "http://localhost:5001/mcp",
#       "type": "http",
#       "reachable": true,
#       "selected": true,
#       "tools": [
#         {"name": "query_customer_info", "description": "..."}
#       ]
#     }
#   ]
# }
```

## MCP Protocol Support

This implementation uses MAF's built-in HTTP MCP client which handles:

### HTTP MCP Communication
- **Discovery**: Tool definitions loaded on connection
- **Execution**: Tool calls routed through MCP HTTP protocol
- **Response**: JSON results from tool execution

### MAF Handles Everything
- Connection lifecycle (connect/disconnect)
- Error handling and retries
- Request/response serialization
- Tool schema parsing

## Best Practices

### 1. Fresh Tools Per Request

Always create fresh `MCPStreamableHTTPTool` instances for each workflow:

```python
# ✅ Good: Fresh instance per request
def handle_request():
    tool = MCPStreamableHTTPTool(...)
    agent = ChatAgent(..., tools=tool)
    workflow = MagenticBuilder().participants(agent=agent).build()

# ❌ Avoid: Sharing tool instances across requests
global_tool = MCPStreamableHTTPTool(...)  # Don't do this
```

### 2. Graceful Degradation

Handle server unavailability gracefully:

```python
metadata = tool_registry.get_server_metadata("customer-query")

# Only create tool if server is configured
mcp_tool = MCPStreamableHTTPTool(...) if metadata else None

# Agent works with or without tools
agent = ChatAgent(..., tools=mcp_tool)  # None is OK
```

### 3. Let MAF Handle Lifecycle

Don't manually manage connections - MAF does it automatically:

```python
# ✅ Good: Let MAF handle it
tool = MCPStreamableHTTPTool(...)
async for event in workflow.run_stream(message):
    yield event
# Tool automatically connects/disconnects

# ❌ Avoid: Manual connection management
async with tool:  # Don't do this
    await workflow.run()
```

### 4. Error Handling

MAF handles MCP errors gracefully - agents continue even if tools fail:

```python
# No try/catch needed - MAF handles errors
agent = ChatAgent(..., tools=mcp_tool)
# Agent will work with LLM knowledge if tool fails
```

## Configuration

MCP servers are configured in `tool_config.py`:

```python
MCP_TOOLS_CONFIG = {
    "customer-query": {
        "config": {
            "url": "http://localhost:5001/mcp",
            "type": "http",
            "verbose": True,
        },
        "id": "customer-query",
        "name": "Customer Query",
    },
    # ...
}
```

Environment variables (`.env`):

```bash
MCP_CUSTOMER_QUERY_URL=http://localhost:5001
MCP_ITINERARY_PLANNING_URL=http://localhost:5003
MCP_ECHO_PING_URL=http://localhost:5004
# ...
```

## Testing

Run tests:

```bash
# Tool registry tests
pytest src/tests/test_mcp_graceful_degradation.py -v

# Provider tests
pytest src/tests/test_providers.py -v

# All tests
pytest src/tests/ -v
```

## Reference

- [Microsoft Agent Framework Documentation](https://learn.microsoft.com/en-us/agent-framework/)
- [MCP Tools in MAF](https://learn.microsoft.com/en-us/agent-framework/user-guide/model-context-protocol/using-mcp-tools)
- [Official MAF Samples](https://github.com/microsoft/agent-framework/tree/main/python/samples)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)

## Troubleshooting

### Server Not Reachable

Check server status:

```python
# List all servers with reachability
tools_info = await tool_registry.list_tools()
for tool in tools_info["tools"]:
    print(f"{tool['name']}: reachable={tool['reachable']}")
```

### Tool Not Loading

Verify server configuration:

```python
# Check metadata
metadata = tool_registry.get_server_metadata("customer-query")
print(f"URL: {metadata['url']}")
print(f"Type: {metadata['type']}")
```

### Workflow Fails

Agents gracefully degrade when tools fail - check logs for warnings:

```bash
# Look for MCP-related warnings
grep "MCP server" logs/api-python.log
```
