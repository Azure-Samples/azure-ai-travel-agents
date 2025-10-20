# Microsoft Agent Framework Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the orchestration layer using Microsoft Agent Framework (MAF) in Python.

## Prerequisites

- Python 3.12+
- Azure OpenAI access
- MCP tool servers running
- Understanding of async Python programming
- Familiarity with FastAPI

## Installation

### 1. Install Microsoft Agent Framework

```bash
pip install agent-framework
```

The MAF Python SDK provides:
- Agent creation and orchestration
- Workflow management
- LLM integration (Azure OpenAI, OpenAI, etc.)
- Tool calling capabilities
- State management

### 2. Additional Dependencies

```bash
pip install fastapi uvicorn httpx sse-starlette pydantic python-dotenv
pip install opentelemetry-api opentelemetry-sdk
pip install azure-identity azure-ai-projects
```

## Core Concepts

### 1. Agents in MAF

Agents are the primary building blocks in MAF. Each agent has:
- **Name**: Unique identifier
- **System Prompt**: Instructions for the agent's behavior
- **Tools**: Functions the agent can call
- **LLM**: Language model for decision making
- **State**: Conversation context and history

Example agent creation:
```python
from agent_framework import Agent
from azure.ai.inference import ChatCompletionsClient
from azure.core.credentials import AzureKeyCredential

# Create LLM client
llm_client = ChatCompletionsClient(
    endpoint=AZURE_OPENAI_ENDPOINT,
    credential=AzureKeyCredential(AZURE_OPENAI_API_KEY)
)

# Create agent
customer_query_agent = Agent(
    name="CustomerQueryAgent",
    system_prompt="Extract customer preferences from travel queries.",
    tools=[analyze_query_tool, extract_preferences_tool],
    llm_client=llm_client,
    model=AZURE_OPENAI_DEPLOYMENT
)
```

### 2. Tools in MAF

Tools are functions that agents can call. For MCP integration, tools wrap MCP client calls:

```python
from agent_framework import Tool

async def call_customer_query_mcp(query: str) -> dict:
    """Call the customer query MCP server."""
    async with MCPClient(MCP_CUSTOMER_QUERY_URL) as client:
        result = await client.call_tool("analyze_query", {"query": query})
        return result

# Create tool from function
analyze_query_tool = Tool(
    name="analyze_customer_query",
    description="Analyze customer travel query and extract preferences",
    function=call_customer_query_mcp
)
```

### 3. Workflows in MAF

Workflows orchestrate multiple agents:

```python
from agent_framework import Workflow

# Create workflow
travel_workflow = Workflow(
    name="TravelPlanningWorkflow",
    agents=[
        triage_agent,
        customer_query_agent,
        destination_agent,
        itinerary_agent
    ],
    root_agent=triage_agent
)

# Execute workflow
result = await travel_workflow.run(user_message)
```

### 4. Agent Handoff

MAF supports agent-to-agent handoff:

```python
# In triage agent's logic
if needs_destination_recommendation:
    # Handoff to destination agent
    result = await workflow.handoff(
        to_agent="DestinationRecommendationAgent",
        context={
            "preferences": extracted_preferences,
            "budget": budget_info
        }
    )
```

## Implementation Steps

### Step 1: Project Setup

Create the Python project structure:

```bash
cd src
mkdir -p api-python/src/{orchestrator/agents,orchestrator/tools,api,utils}
cd api-python
```

Create `pyproject.toml`:
```toml
[project]
name = "@azure-ai-travel-agents/api-gateway-python"
version = "1.0.0"
requires-python = ">=3.12"
dependencies = [
    "agent-framework>=0.1.0",
    "fastapi>=0.115.0",
    "uvicorn>=0.34.0",
    "httpx>=0.28.1",
    "sse-starlette>=2.2.1",
    "pydantic>=2.10.6",
    "python-dotenv>=1.0.1",
    "opentelemetry-api>=1.30.0",
    "opentelemetry-sdk>=1.30.0",
    "azure-identity>=1.20.0",
    "azure-ai-projects>=1.0.0b5"
]

[tool.ruff]
line-length = 120
target-version = "py312"

[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_backend"
```

### Step 2: Configuration

Create `src/config.py`:
```python
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Azure OpenAI
    azure_openai_endpoint: str
    azure_openai_api_key: str
    azure_openai_deployment: str
    azure_openai_api_version: str = "2024-02-15-preview"
    
    # MCP Servers
    mcp_customer_query_url: str
    mcp_destination_recommendation_url: str
    mcp_itinerary_planning_url: str
    mcp_echo_ping_url: str
    mcp_echo_ping_access_token: Optional[str] = None
    
    # Server
    port: int = 4000
    log_level: str = "INFO"
    
    # Telemetry
    otlp_endpoint: Optional[str] = None
    otel_service_name: str = "api-python"
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### Step 3: MCP Client Implementation

Create `src/orchestrator/tools/mcp_client.py`:
```python
import httpx
from typing import Any, Dict, Optional
from abc import ABC, abstractmethod

class MCPClient(ABC):
    """Base MCP client interface."""
    
    @abstractmethod
    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        """Call a tool on the MCP server."""
        pass
    
    @abstractmethod
    async def list_tools(self) -> list:
        """List available tools."""
        pass

class HTTPMCPClient(MCPClient):
    """HTTP-based MCP client."""
    
    def __init__(self, base_url: str, access_token: Optional[str] = None):
        self.base_url = base_url
        self.access_token = access_token
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        """Call a tool via HTTP."""
        headers = {}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        
        response = await self.client.post(
            f"{self.base_url}/call",
            json={"name": tool_name, "arguments": arguments},
            headers=headers
        )
        response.raise_for_status()
        return response.json()
    
    async def list_tools(self) -> list:
        """List available tools."""
        response = await self.client.get(f"{self.base_url}")
        response.raise_for_status()
        return response.json()
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()
```

### Step 4: Tool Registry

Create `src/orchestrator/tools/tool_registry.py`:
```python
from typing import Dict
from .mcp_client import HTTPMCPClient
from ..config import settings

class ToolRegistry:
    """Registry for MCP tools."""
    
    def __init__(self):
        self.clients: Dict[str, HTTPMCPClient] = {}
        self._initialize_clients()
    
    def _initialize_clients(self):
        """Initialize MCP clients."""
        # Customer Query
        self.clients["customer-query"] = HTTPMCPClient(
            settings.mcp_customer_query_url
        )
        
        # Destination Recommendation
        self.clients["destination-recommendation"] = HTTPMCPClient(
            settings.mcp_destination_recommendation_url
        )
        
        # Itinerary Planning
        self.clients["itinerary-planning"] = HTTPMCPClient(
            settings.mcp_itinerary_planning_url
        )
        
        # Echo Ping
        self.clients["echo-ping"] = HTTPMCPClient(
            settings.mcp_echo_ping_url,
            access_token=settings.mcp_echo_ping_access_token
        )
    
    async def call_tool(self, server: str, tool_name: str, arguments: dict) -> any:
        """Call a tool on a specific MCP server."""
        if server not in self.clients:
            raise ValueError(f"Unknown MCP server: {server}")
        
        return await self.clients[server].call_tool(tool_name, arguments)
    
    async def close_all(self):
        """Close all MCP clients."""
        for client in self.clients.values():
            await client.close()

# Global instance
tool_registry = ToolRegistry()
```

### Step 5: Agent Implementation

Create `src/orchestrator/agents/base.py`:
```python
from agent_framework import Agent, Tool
from typing import List, Optional

class BaseAgent:
    """Base class for all agents."""
    
    def __init__(
        self,
        name: str,
        system_prompt: str,
        tools: List[Tool],
        llm_client,
        model: str
    ):
        self.agent = Agent(
            name=name,
            system_prompt=system_prompt,
            tools=tools,
            llm_client=llm_client,
            model=model
        )
    
    async def process(self, message: str, context: Optional[dict] = None):
        """Process a message."""
        return await self.agent.run(message, context=context)
    
    @property
    def name(self) -> str:
        """Get agent name."""
        return self.agent.name
```

Create `src/orchestrator/agents/triage_agent.py`:
```python
from .base import BaseAgent
from agent_framework import Tool

class TriageAgent(BaseAgent):
    """Triage agent that routes queries to specialized agents."""
    
    def __init__(self, llm_client, model: str, all_tools: list):
        system_prompt = """
        You are a triage agent for a travel agency AI system.
        Your role is to analyze customer queries and determine which specialized agents 
        should handle them.
        
        You can delegate to these agents:
        - CustomerQueryAgent: For understanding customer preferences
        - DestinationRecommendationAgent: For suggesting destinations
        - ItineraryPlanningAgent: For creating travel itineraries
        
        Always choose the most appropriate agent(s) for the query.
        You may coordinate multiple agents for complex queries.
        """
        
        super().__init__(
            name="TriageAgent",
            system_prompt=system_prompt,
            tools=all_tools,
            llm_client=llm_client,
            model=model
        )
```

### Step 6: Workflow Orchestration

Create `src/orchestrator/workflow.py`:
```python
from agent_framework import Workflow
from .agents.triage_agent import TriageAgent
from .agents.customer_query_agent import CustomerQueryAgent
# ... import other agents
from .tools.tool_registry import tool_registry
from azure.ai.inference import ChatCompletionsClient
from azure.core.credentials import AzureKeyCredential
from config import settings

class TravelWorkflow:
    """Main workflow for travel agent system."""
    
    def __init__(self):
        # Initialize LLM client
        self.llm_client = ChatCompletionsClient(
            endpoint=settings.azure_openai_endpoint,
            credential=AzureKeyCredential(settings.azure_openai_api_key)
        )
        
        # Initialize agents
        self.agents = self._initialize_agents()
        
        # Create workflow
        self.workflow = Workflow(
            name="TravelPlanningWorkflow",
            agents=list(self.agents.values()),
            root_agent=self.agents["triage"]
        )
    
    def _initialize_agents(self) -> dict:
        """Initialize all agents."""
        agents = {}
        
        # Create tools and agents
        # ... (implementation details)
        
        return agents
    
    async def run(self, message: str, selected_tools: list = None):
        """Execute the workflow."""
        # Filter tools based on selection
        # Run workflow
        async for event in self.workflow.run(message):
            yield event
```

### Step 7: FastAPI Integration

Create `src/main.py`:
```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from sse_starlette import EventSourceResponse
from .orchestrator.workflow import TravelWorkflow
from .config import settings
import logging

app = FastAPI(title="Azure AI Travel Agents API (Python)")
workflow = TravelWorkflow()

logging.basicConfig(level=settings.log_level)
logger = logging.getLogger(__name__)

@app.get("/api/health")
async def health():
    """Health check endpoint."""
    return {"status": "OK"}

@app.post("/api/chat")
async def chat(request: dict):
    """Chat endpoint with streaming responses."""
    message = request.get("message")
    tools = request.get("tools", [])
    
    if not message:
        return {"error": "Message is required"}, 400
    
    async def event_generator():
        """Generate SSE events from workflow."""
        async for event in workflow.run(message, selected_tools=tools):
            yield {
                "event": "message",
                "data": event.model_dump_json()
            }
    
    return EventSourceResponse(event_generator())

@app.get("/api/tools")
async def list_tools():
    """List available tools."""
    # Implementation
    pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.port)
```

## Best Practices

### 1. Error Handling

```python
from agent_framework import AgentError

async def safe_agent_call(agent, message, context=None):
    """Safely call an agent with error handling."""
    try:
        return await agent.process(message, context)
    except AgentError as e:
        logger.error(f"Agent error: {e}")
        # Implement fallback logic
        return {"error": str(e), "fallback": True}
    except Exception as e:
        logger.exception(f"Unexpected error: {e}")
        raise
```

### 2. Observability

```python
from opentelemetry import trace

tracer = trace.get_tracer(__name__)

async def traced_agent_call(agent, message):
    """Call agent with tracing."""
    with tracer.start_as_current_span(f"agent_{agent.name}") as span:
        span.set_attribute("agent.name", agent.name)
        span.set_attribute("message.length", len(message))
        
        result = await agent.process(message)
        
        span.set_attribute("result.success", True)
        return result
```

### 3. State Management

```python
from agent_framework import ConversationState

class StatefulWorkflow:
    """Workflow with state management."""
    
    def __init__(self):
        self.state = ConversationState()
    
    async def run(self, message: str):
        """Run workflow with state."""
        # Add message to state
        self.state.add_message("user", message)
        
        # Execute workflow with state
        result = await self.workflow.run(message, state=self.state)
        
        # Update state with result
        self.state.add_message("assistant", result)
        
        return result
```

## Testing

### Unit Tests

```python
import pytest
from orchestrator.agents.triage_agent import TriageAgent

@pytest.mark.asyncio
async def test_triage_agent():
    """Test triage agent."""
    agent = TriageAgent(llm_client, model, tools)
    result = await agent.process("I want to plan a trip to Japan")
    assert result is not None
```

### Integration Tests

```python
@pytest.mark.asyncio
async def test_workflow_execution():
    """Test complete workflow."""
    workflow = TravelWorkflow()
    events = []
    
    async for event in workflow.run("Plan a 7-day trip to Japan"):
        events.append(event)
    
    assert len(events) > 0
```

## Deployment

### Docker

Create `Dockerfile`:
```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml .
RUN pip install --no-cache-dir -e .

COPY src/ ./src/

EXPOSE 4000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "4000"]
```

### Environment Variables

Ensure all required environment variables are set in production:
- Azure OpenAI credentials
- MCP server URLs
- Telemetry endpoints

## Migration from LlamaIndex.TS

### Key Differences

1. **Language**: Python vs TypeScript
2. **Framework**: MAF vs LlamaIndex.TS
3. **Agent Pattern**: Similar multi-agent pattern
4. **Tool Integration**: MCP clients remain the same

### Migration Steps

1. Deploy Python API alongside TypeScript API
2. Test with subset of traffic
3. Validate all workflows
4. Gradually shift traffic
5. Deprecate old API when ready

## Troubleshooting

### Common Issues

1. **MCP Connection Errors**: Check MCP server URLs and network connectivity
2. **Azure OpenAI Errors**: Verify credentials and deployment name
3. **Agent Timeout**: Increase timeout in MCP client configuration
4. **Memory Issues**: Monitor workflow state size

## Conclusion

This implementation guide provides the foundation for building the orchestration layer using Microsoft Agent Framework. Follow the steps sequentially and test thoroughly at each stage.

## Next Steps

1. Complete all agent implementations
2. Add comprehensive error handling
3. Implement full test coverage
4. Set up CI/CD pipeline
5. Performance optimization
6. Production deployment

## Resources

- [MAF Documentation](https://learn.microsoft.com/en-us/agent-framework/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [MCP Specification](https://modelcontextprotocol.io/)
