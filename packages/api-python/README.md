# Azure AI Travel Agents API (Python)

Python-based API server using **Microsoft Agent Framework** for multi-agent orchestration with **simplified MCP integration**.

## Overview

This is the Python implementation of the orchestration layer using Microsoft Agent Framework (MAF). It provides a clean, maintainable API that relies entirely on MAF's built-in capabilities for MCP server integration and agent orchestration.

**Current Status: ✅ Fully Simplified - Production Ready**

The implementation strictly follows Microsoft Agent Framework best practices, using:
- Built-in `MCPStreamableHTTPTool` for all MCP integrations (no custom transports)
- Magentic orchestration with proper async lifecycle management
- True streaming events via asyncio.Queue
- Graceful degradation when MCP servers are unavailable

**Key Simplification**: Removed ~300 lines of custom MCP transport code and all async lifecycle complexity by strictly following MAF patterns from official samples.

## Key Features

- ✅ **Microsoft Agent Framework** - Pure MAF SDK implementation, no custom code
- ✅ **Magentic Orchestration** - Multi-agent workflow coordination
- ✅ **Built-in MCP Support** - Using `MCPStreamableHTTPTool` exclusively
- ✅ **Real-time Streaming** - True SSE streaming with asyncio.Queue
- ✅ **Graceful Degradation** - Agents work even when MCP servers are down
- ✅ **Async Best Practices** - Proper lifecycle management, no cancel scope errors
- ✅ **OpenTelemetry Ready** - Built-in observability support
- ✅ **Multiple LLM Providers** - Azure OpenAI, GitHub Models, Ollama, Docker Models

## Architecture Highlights

### Simplified MCP Integration

**Before**: Custom transport implementations with complex async lifecycle
```python
# OLD - Complex custom transport (removed)
async with create_mcp_client(url) as (read, write, session):
    result = await session.call_tool(...)
```

**After**: Built-in MAF tools with automatic lifecycle management
```python
# NEW - MAF built-in, simple and reliable
tool = MCPStreamableHTTPTool(name="...", url="...")
agent = ChatAgent(chat_client=client, tools=tool)
workflow = MagenticBuilder().participants(MyAgent=agent).build()
```

### Tool Registry Pattern

The `ToolRegistry` now only stores metadata - no persistent connections:
- Each workflow creates fresh MCP tool instances
- Tools are passed to agents at creation time
- MAF handles all connection lifecycle automatically
- Graceful fallback when servers are unavailable

### True Streaming

Events flow in real-time using asyncio.Queue:
```python
event_queue = asyncio.Queue()
async def on_event(event): 
    await event_queue.put(convert_event(event))
workflow = MagenticBuilder().on_event(on_event, mode=STREAMING).build()
# Stream to client as events arrive
async for event in workflow.run_stream(message):
    yield event
```

## Quick Start

### Prerequisites

- Python 3.11 or later
- Docker (for MCP servers)
- Azure OpenAI account (or other LLM provider)

### Installation

```bash
cd src/api-python

# Install dependencies
pip install -e .

# For development
pip install -e ".[dev]"
```

### Configuration

Create `.env` file from template:

```bash
cp .env.sample .env
```

**Minimal configuration:**

```txt
# LLM Provider
LLM_PROVIDER=azure-openai

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4

# MCP Servers (Docker containers)
MCP_CUSTOMER_QUERY_URL=http://localhost:5001
MCP_ITINERARY_PLANNING_URL=http://localhost:5002
MCP_ECHO_PING_URL=http://localhost:5003
```

### Run

```bash
# Start MCP servers (from repo root)
./run.sh

# Start API server (from src/api-python)
python -m src.main
```

Server starts at `http://localhost:8000`


## API Endpoints

### GET /api/health

Health check with MCP server status.

**Response:**
```json
{
  "status": "OK",
  "service": "azure-ai-travel-agents-api-python",
  "version": "1.0.0",
  "llm_provider": "azure-openai",
  "mcp": {
    "total_servers": 3,
    "configured_servers": ["echo-ping", "customer-query", "itinerary-planning"]
  }
}
```

### GET /api/tools

List all available MCP tools with reachability check.

**Response:**
```json
{
  "tools": [
    {
      "id": "customer-query",
      "name": "Customer Query",
      "url": "http://localhost:5001/mcp",
      "type": "http",
      "reachable": true,
      "selected": true,
      "tools": []
    }
  ]
}
```

### POST /api/chat

Process travel planning requests with **real-time streaming**.

**Request:**
```json
{
  "message": "Plan a 7-day trip to Paris",
  "context": {}
}
```

**Response:** Server-Sent Events (SSE) stream

```
data: {"type":"metadata","agent":"Orchestrator","event":"OrchestratorPlanning","data":{...}}

data: {"type":"metadata","agent":"CustomerQueryAgent","event":"AgentDelta","data":{"text":"Let me..."}}

data: {"type":"metadata","agent":"CustomerQueryAgent","event":"AgentMessage","data":{...}}

data: {"type":"metadata","agent":null,"event":"FinalResult","data":{"message":"Here's your plan..."}}
```

**Event Format:**
```json
{
  "type": "metadata",
  "agent": "AgentName",
  "event": "EventType",
  "data": {
    "currentAgentName": "AgentName",
    "message": "...",
    "streaming": true
  }
}
```

**Example with curl:**
```bash
curl -N -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Plan a trip to Paris","context":{}}'
```

## Architecture

### Simplified MCP Integration

This implementation uses **Microsoft Agent Framework's built-in MCP support**, removing all custom implementations:

- ✅ `MCPStreamableHTTPTool` from MAF (no custom transport)
- ✅ Factory pattern for tool creation (no persistent connections)
- ✅ MAF handles all lifecycle management (no manual async context managers)
- ✅ Graceful error handling (warnings, not exceptions)

**Key Pattern:**
```python
# Create MCP tool
mcp_tool = MCPStreamableHTTPTool(
    name="Customer Query",
    url="http://localhost:5001/mcp",
    load_tools=True,
)

# Attach to agent - MAF handles lifecycle
agent = ChatAgent(
    name="CustomerQueryAgent",
    description="...",
    instructions="...",
    chat_client=chat_client,
    tools=mcp_tool,  # MAF manages this automatically
)
```

### Magentic Orchestration

Uses MAF's Magentic pattern for multi-agent coordination:

```python
workflow = (
    MagenticBuilder()
    .participants(
        CustomerQueryAgent=customer_agent,
        ItineraryAgent=itinerary_agent,
        DestinationAgent=destination_agent,
    )
    .on_event(event_handler, mode=MagenticCallbackMode.STREAMING)
    .with_standard_manager(
        chat_client=chat_client,
        max_round_count=15,
    )
    .build()
)

# Stream events to UI
async for event in workflow.run_stream(message):
    yield convert_event(event)
```

### Agent Architecture

```
┌─────────────────────────────────────────┐
│      FastAPI Application (main.py)     │
│  /api/health  /api/tools  /api/chat    │
└───────────────────┬─────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│   MagenticTravelOrchestrator            │
│   (magentic_workflow.py)                │
│                                         │
│   • Magentic workflow builder           │
│   • Event streaming                     │
│   • Multi-agent coordination            │
└────────────┬────────────────────────────┘
             │
    ┌────────┼────────┐
    │        │        │
    ▼        ▼        ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│Customer │ │Itinerary│ │Destin.  │
│Query    │ │ Agent   │ │ Agent   │
│Agent    │ │         │ │         │
└────┬────┘ └────┬────┘ └─────────┘
     │           │
     ▼           ▼
┌─────────────────────────────────┐
│  MCPStreamableHTTPTool (MAF)    │
│                                 │
│  • Created per-agent            │
│  • Lifecycle managed by MAF     │
│  • Connects to MCP servers      │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│     MCP Servers (Docker)        │
│                                 │
│  • customer-query (5001/mcp)    │
│  • itinerary-planning (5002/mcp)│
│  • echo-ping (5003/mcp)         │
└─────────────────────────────────┘
```


## Project Structure

```
packages/api-python/
├── src/
│   ├── main.py                         # FastAPI application & endpoints
│   ├── config.py                       # Configuration management
│   ├── orchestrator/
│   │   ├── magentic_workflow.py       # Magentic orchestration (MAF)
│   │   ├── providers/                 # LLM provider adapters
│   │   │   └── __init__.py            # get_llm_client()
│   │   └── tools/
│   │       ├── tool_config.py         # MCP server configuration
│   │       └── tool_registry.py       # Tool metadata registry
│   ├── utils/                         # Utility modules
│   └── tests/                         # Test files
├── MCP_SIMPLIFIED_ARCHITECTURE.md     # Architecture documentation
├── MCP_QUICK_REFERENCE.md             # Quick reference guide
├── pyproject.toml                     # Project configuration
├── .env.sample                        # Environment template
└── README.md                          # This file
```

## Documentation

### Main Documentation

- **[MCP Simplified Architecture](./MCP_SIMPLIFIED_ARCHITECTURE.md)** - Complete architecture overview
- **[MCP Quick Reference](./MCP_QUICK_REFERENCE.md)** - Developer quick reference

### Additional Resources

- [Microsoft Agent Framework Docs](https://learn.microsoft.com/en-us/agent-framework/)
- [Magentic Orchestration](https://learn.microsoft.com/en-us/agent-framework/user-guide/workflows/orchestrations/magentic?pivots=programming-language-python)
- [MCP Tools in MAF](https://learn.microsoft.com/en-us/agent-framework/user-guide/model-context-protocol/using-mcp-tools)
- [MAF Python Samples](https://github.com/microsoft/agent-framework/tree/main/python/samples)

## Development

### LLM Provider Configuration

Choose your LLM provider in `.env`:

```txt
LLM_PROVIDER=azure-openai  # or github-models, ollama-models, docker-models
```

**Azure OpenAI:**
```txt
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
```

**GitHub Models:**
```txt
GITHUB_TOKEN=your-github-token
GITHUB_MODEL=openai/gpt-4o
```

**Ollama:**
```txt
OLLAMA_ENDPOINT=http://localhost:11434/v1
OLLAMA_MODEL=llama3
```

### Code Quality

```bash
# Linting
ruff check src/

# Auto-fix
ruff check --fix src/

# Format
ruff format src/

# Type checking
mypy src/
```

### Testing

```bash
# Run tests
pytest

# With coverage
pytest --cov=src --cov-report=html
```


## Troubleshooting

### MCP Server Connection Issues

**Problem:** MCP servers not reachable

**Solutions:**
1. Check if Docker containers are running: `docker ps`
2. Verify URLs in `.env` match container ports
3. Test manually: `curl http://localhost:5001/mcp`
4. Check container logs: `docker logs <container-name>`

**Problem:** Cancel scope violations or async errors

**Solution:** Already fixed! The simplified architecture uses MAF's built-in lifecycle management. Each agent gets its own MCP tool instance, avoiding shared async context managers.

### Event Streaming Issues

**Problem:** UI not receiving events

**Checklist:**
1. ✅ Using `workflow.run_stream()` (not `workflow.run()`)
2. ✅ Events converted in `_convert_workflow_event()`
3. ✅ SSE headers set correctly
4. ✅ No buffering in nginx/proxy

### Agent Not Using Tools

**Problem:** Agent doesn't call MCP tools

**Check:**
1. Tool passed to `ChatAgent` (not `None`)
2. MCP server is actually reachable
3. LLM model supports function calling
4. Instructions mention using tools

### Common Errors

**Error:** `'ToolRegistry' object has no attribute 'list_tools'`  
**Fix:** Already fixed - `list_tools()` method is now async and implemented correctly.

**Error:** `Attempted to exit cancel scope in a different task`  
**Fix:** Already fixed - using factory pattern, no shared MCP tools across tasks.

**Error:** Connection refused  
**Fix:** Ensure MCP servers are running via `./run.sh` from repo root.

## Key Features

### Graceful Degradation

Agents continue working even when MCP servers are unavailable:

```python
# Agent created with tools=None still works!
agent = ChatAgent(
    name="BasicAgent",
    description="...",
    instructions="...",
    chat_client=chat_client,
    tools=None,  # No MCP tools - uses LLM knowledge
)
```

### Real-time Streaming

All agent activities stream to UI in real-time:

```python
async for event in workflow.run_stream(message):
    # Events stream as they occur
    # - OrchestratorPlanning
    # - AgentDelta (token by token)
    # - AgentMessage
    # - FinalResult
    yield convert_event(event)
```

### Built-in Observability

OpenTelemetry tracing is enabled automatically:

```python
from agent_framework.observability import setup_observability

setup_observability(enable_sensitive_data=True)
```

Traces are exported to configured OTLP endpoint (Jaeger, Azure Monitor, etc.).

## Documentation

- **[Developer Guide](DEVELOPER_GUIDE.md)** - Quick reference for developers
- **[Simplification Summary](MCP_SIMPLIFICATION_SUMMARY.md)** - Detailed changes and architecture
- **[Microsoft Agent Framework Docs](https://learn.microsoft.com/en-us/agent-framework/)** - Official MAF documentation
- **[MAF Python Samples](https://github.com/microsoft/agent-framework/tree/main/python/samples)** - Official code samples

## Troubleshooting

### Common Issues

**"Cancel scope in different task" error**
- Fixed by using MAF's built-in tool lifecycle management
- Don't manage `async with tool:` manually

**MCP server not reachable**
- Check server is running: `curl http://localhost:5001/health`
- Agent will run without tools using LLM knowledge (graceful degradation)

**Events not streaming**
- Ensure using `workflow.run_stream()` not `workflow.run()`
- Check asyncio.Queue is properly configured

### Testing

```bash
# Health check
curl http://localhost:4000/api/health

# List tools
curl http://localhost:4000/api/tools

# Test chat with streaming
curl -N -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Plan a 3-day trip to Paris"}' \
  --no-buffer
```

## License

Same as the main Azure AI Travel Agents project.
