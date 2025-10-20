# Microsoft Agent Framework Quick Reference

## Overview

This quick reference provides code snippets and examples for common patterns when using Microsoft Agent Framework (MAF) in the Azure AI Travel Agents project.

## Installation

```bash
# Install MAF Python SDK
pip install agent-framework

# Install additional dependencies
pip install azure-ai-inference azure-identity
```

## Basic Agent Creation

```python
from agent_framework import Agent
from azure.ai.inference import ChatCompletionsClient
from azure.core.credentials import AzureKeyCredential

# Create LLM client
llm_client = ChatCompletionsClient(
    endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    credential=AzureKeyCredential(os.getenv("AZURE_OPENAI_API_KEY"))
)

# Create agent
agent = Agent(
    name="MyAgent",
    system_prompt="You are a helpful assistant.",
    tools=[],  # List of tools
    llm_client=llm_client,
    model=os.getenv("AZURE_OPENAI_DEPLOYMENT")
)

# Use agent
response = await agent.run("Hello, how can you help me?")
print(response)
```

## Tool Definition

### Simple Tool

```python
from agent_framework import Tool

def calculate_distance(origin: str, destination: str) -> float:
    """Calculate distance between two locations."""
    # Implementation
    return 150.5

# Create tool
distance_tool = Tool(
    name="calculate_distance",
    description="Calculate the distance between two locations in kilometers",
    function=calculate_distance
)
```

### Async Tool with MCP Integration

```python
import httpx
from agent_framework import Tool

async def search_destinations(preferences: dict) -> list:
    """Search for destinations via MCP server."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{MCP_SERVER_URL}/mcp/call",
            json={
                "name": "search_destinations",
                "arguments": preferences
            }
        )
        return response.json()

# Create tool
search_tool = Tool(
    name="search_destinations",
    description="Search for travel destinations based on preferences",
    function=search_destinations
)
```

### Tool with Type Annotations

```python
from typing import Dict, List
from pydantic import BaseModel
from agent_framework import Tool

class Preferences(BaseModel):
    budget: float
    duration_days: int
    interests: List[str]

async def recommend_destinations(preferences: Preferences) -> Dict:
    """Recommend destinations based on preferences."""
    # Implementation
    return {
        "destinations": ["Paris", "Rome", "Barcelona"],
        "reasoning": "Based on budget and interests"
    }

recommend_tool = Tool(
    name="recommend_destinations",
    description="Get destination recommendations",
    function=recommend_destinations
)
```

## Multi-Agent Workflow

### Basic Workflow

```python
from agent_framework import Workflow

# Create agents
triage_agent = Agent(name="TriageAgent", ...)
specialist_agent = Agent(name="SpecialistAgent", ...)

# Create workflow
workflow = Workflow(
    name="TravelWorkflow",
    agents=[triage_agent, specialist_agent],
    root_agent=triage_agent
)

# Run workflow
result = await workflow.run("I want to plan a trip")
```

### Workflow with State

```python
from agent_framework import Workflow, ConversationState

# Create workflow with state
workflow = Workflow(
    name="StatefulWorkflow",
    agents=[agent1, agent2],
    root_agent=agent1,
    state=ConversationState()
)

# Run with state preservation
async for event in workflow.run("First message"):
    print(event)

# Continue conversation
async for event in workflow.run("Follow-up message"):
    print(event)
```

## Agent Handoff

### Explicit Handoff

```python
from agent_framework import Agent, Workflow

class TriageAgent:
    def __init__(self, workflow: Workflow):
        self.workflow = workflow
    
    async def process(self, message: str):
        # Analyze message
        if "destination" in message.lower():
            # Handoff to destination agent
            return await self.workflow.handoff(
                to_agent="DestinationAgent",
                context={"query": message}
            )
        # Handle normally
        return await self.agent.run(message)
```

### Conditional Routing

```python
async def route_query(workflow: Workflow, query: str):
    """Route query to appropriate agent."""
    
    # Determine intent
    if "plan itinerary" in query.lower():
        return await workflow.handoff(
            to_agent="ItineraryPlanningAgent",
            context={"query": query}
        )
    elif "recommend destination" in query.lower():
        return await workflow.handoff(
            to_agent="DestinationRecommendationAgent",
            context={"query": query}
        )
    else:
        # Default to triage agent
        return await workflow.root_agent.run(query)
```

## Parallel Execution

```python
import asyncio
from agent_framework import Agent

async def parallel_agent_execution(agents: list, query: str):
    """Execute multiple agents in parallel."""
    
    tasks = [agent.run(query) for agent in agents]
    results = await asyncio.gather(*tasks)
    
    return results

# Usage
results = await parallel_agent_execution(
    [destination_agent, itinerary_agent],
    "Find destinations in Europe"
)
```

## Error Handling

### Basic Error Handling

```python
from agent_framework import Agent, AgentError

async def safe_agent_call(agent: Agent, message: str):
    """Call agent with error handling."""
    try:
        return await agent.run(message)
    except AgentError as e:
        print(f"Agent error: {e}")
        return {"error": str(e)}
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise
```

### Retry with Exponential Backoff

```python
import asyncio
from typing import Optional

async def call_with_retry(
    agent: Agent,
    message: str,
    max_retries: int = 3,
    base_delay: float = 1.0
) -> Optional[dict]:
    """Call agent with retry logic."""
    
    for attempt in range(max_retries):
        try:
            return await agent.run(message)
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            
            delay = base_delay * (2 ** attempt)
            print(f"Attempt {attempt + 1} failed, retrying in {delay}s...")
            await asyncio.sleep(delay)
    
    return None
```

## Streaming Responses

### Basic Streaming

```python
from agent_framework import Agent

async def stream_agent_response(agent: Agent, message: str):
    """Stream agent responses."""
    
    async for event in agent.stream(message):
        # Process event
        if event.type == "token":
            print(event.data, end="", flush=True)
        elif event.type == "complete":
            print("\nDone!")
```

### SSE Streaming with FastAPI

```python
from fastapi import FastAPI
from sse_starlette import EventSourceResponse
from agent_framework import Workflow

app = FastAPI()
workflow = Workflow(...)

@app.post("/chat")
async def chat(message: str):
    """Chat endpoint with SSE streaming."""
    
    async def event_generator():
        async for event in workflow.run(message):
            yield {
                "event": "message",
                "data": event.model_dump_json()
            }
    
    return EventSourceResponse(event_generator())
```

## State Management

### Conversation State

```python
from agent_framework import ConversationState

# Create state
state = ConversationState()

# Add messages
state.add_message("user", "Hello")
state.add_message("assistant", "Hi! How can I help?")

# Get history
history = state.get_messages()

# Clear state
state.clear()
```

### Custom State

```python
from typing import Dict, Any

class TravelState:
    """Custom state for travel planning."""
    
    def __init__(self):
        self.preferences: Dict[str, Any] = {}
        self.destinations: list = []
        self.itinerary: Dict[str, Any] = {}
        self.context: Dict[str, Any] = {}
    
    def update_preferences(self, preferences: dict):
        """Update user preferences."""
        self.preferences.update(preferences)
    
    def add_destination(self, destination: dict):
        """Add a destination."""
        self.destinations.append(destination)
    
    def set_itinerary(self, itinerary: dict):
        """Set the travel itinerary."""
        self.itinerary = itinerary
```

## Observability

### OpenTelemetry Integration

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

# Configure tracer
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)

# Add exporter
otlp_exporter = OTLPSpanExporter(endpoint="http://localhost:4317")
trace.get_tracer_provider().add_span_processor(
    BatchSpanProcessor(otlp_exporter)
)

# Use in agent
async def traced_agent_call(agent: Agent, message: str):
    """Call agent with tracing."""
    with tracer.start_as_current_span("agent_call") as span:
        span.set_attribute("agent.name", agent.name)
        span.set_attribute("message.length", len(message))
        
        result = await agent.run(message)
        
        span.set_attribute("result.success", True)
        return result
```

### Structured Logging

```python
import logging
import json

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "message": "%(message)s"}'
)
logger = logging.getLogger(__name__)

async def logged_agent_call(agent: Agent, message: str):
    """Call agent with structured logging."""
    logger.info(json.dumps({
        "event": "agent_call_start",
        "agent": agent.name,
        "message_preview": message[:50]
    }))
    
    try:
        result = await agent.run(message)
        logger.info(json.dumps({
            "event": "agent_call_success",
            "agent": agent.name
        }))
        return result
    except Exception as e:
        logger.error(json.dumps({
            "event": "agent_call_error",
            "agent": agent.name,
            "error": str(e)
        }))
        raise
```

## Configuration Management

### Environment-based Configuration

```python
from pydantic_settings import BaseSettings
from typing import Optional

class AgentConfig(BaseSettings):
    """Agent configuration."""
    
    # Azure OpenAI
    azure_openai_endpoint: str
    azure_openai_api_key: str
    azure_openai_deployment: str
    azure_openai_api_version: str = "2024-02-15-preview"
    
    # Agent settings
    agent_temperature: float = 0.7
    agent_max_tokens: int = 1000
    agent_timeout: int = 30
    
    # Observability
    enable_tracing: bool = True
    otlp_endpoint: Optional[str] = None
    
    class Config:
        env_file = ".env"

# Load config
config = AgentConfig()

# Use in agent
llm_client = ChatCompletionsClient(
    endpoint=config.azure_openai_endpoint,
    credential=AzureKeyCredential(config.azure_openai_api_key)
)
```

## Testing

### Unit Test

```python
import pytest
from agent_framework import Agent, Tool

@pytest.mark.asyncio
async def test_agent_creation():
    """Test agent creation."""
    agent = Agent(
        name="TestAgent",
        system_prompt="Test prompt",
        tools=[],
        llm_client=mock_llm_client,
        model="test-model"
    )
    assert agent.name == "TestAgent"

@pytest.mark.asyncio
async def test_agent_execution():
    """Test agent execution."""
    agent = Agent(...)
    result = await agent.run("Test message")
    assert result is not None
```

### Integration Test

```python
import pytest
from agent_framework import Workflow

@pytest.mark.asyncio
async def test_workflow_execution():
    """Test complete workflow."""
    workflow = Workflow(
        name="TestWorkflow",
        agents=[agent1, agent2],
        root_agent=agent1
    )
    
    events = []
    async for event in workflow.run("Test query"):
        events.append(event)
    
    assert len(events) > 0
    assert events[-1].type == "complete"
```

### Mock Tools

```python
from unittest.mock import AsyncMock
from agent_framework import Tool

async def test_agent_with_mock_tool():
    """Test agent with mocked tool."""
    
    # Create mock tool
    mock_function = AsyncMock(return_value={"result": "mocked"})
    mock_tool = Tool(
        name="mock_tool",
        description="Mock tool for testing",
        function=mock_function
    )
    
    # Create agent with mock tool
    agent = Agent(
        name="TestAgent",
        tools=[mock_tool],
        ...
    )
    
    # Test
    result = await agent.run("Call the tool")
    mock_function.assert_called_once()
```

## Best Practices

### 1. Agent Design

```python
# ✅ Good - Focused agent
customer_query_agent = Agent(
    name="CustomerQueryAgent",
    system_prompt="Extract customer preferences from travel queries.",
    tools=[extract_preferences_tool, analyze_query_tool]
)

# ❌ Bad - Too many responsibilities
super_agent = Agent(
    name="SuperAgent",
    system_prompt="Do everything",
    tools=[all_tools]
)
```

### 2. Error Handling

```python
# ✅ Good - Specific error handling
try:
    result = await agent.run(message)
except AgentError as e:
    logger.error(f"Agent error: {e}")
    return fallback_response()
except TimeoutError as e:
    logger.error(f"Timeout: {e}")
    return timeout_response()
except Exception as e:
    logger.exception(f"Unexpected error: {e}")
    raise

# ❌ Bad - Catch all
try:
    result = await agent.run(message)
except:
    pass
```

### 3. Resource Cleanup

```python
# ✅ Good - Proper cleanup
async with httpx.AsyncClient() as client:
    response = await client.post(...)

# ❌ Bad - No cleanup
client = httpx.AsyncClient()
response = await client.post(...)
# Client never closed
```

### 4. Logging

```python
# ✅ Good - Structured logging
logger.info(json.dumps({
    "event": "agent_call",
    "agent": agent.name,
    "duration_ms": duration
}))

# ❌ Bad - Unstructured logging
logger.info(f"Agent {agent.name} took {duration}ms")
```

## Common Patterns

### Circuit Breaker

```python
from typing import Optional
import time

class CircuitBreaker:
    """Simple circuit breaker implementation."""
    
    def __init__(self, failure_threshold: int = 5, timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failures = 0
        self.last_failure_time: Optional[float] = None
        self.state = "closed"  # closed, open, half_open
    
    async def call(self, func, *args, **kwargs):
        """Call function with circuit breaker."""
        
        if self.state == "open":
            if time.time() - self.last_failure_time > self.timeout:
                self.state = "half_open"
            else:
                raise Exception("Circuit breaker is open")
        
        try:
            result = await func(*args, **kwargs)
            self.failures = 0
            self.state = "closed"
            return result
        except Exception as e:
            self.failures += 1
            self.last_failure_time = time.time()
            
            if self.failures >= self.failure_threshold:
                self.state = "open"
            
            raise

# Usage
circuit_breaker = CircuitBreaker()
result = await circuit_breaker.call(agent.run, message)
```

### Caching

```python
from functools import lru_cache
import hashlib

class AgentCache:
    """Simple cache for agent responses."""
    
    def __init__(self, max_size: int = 100):
        self.cache: Dict[str, Any] = {}
        self.max_size = max_size
    
    def _key(self, agent_name: str, message: str) -> str:
        """Generate cache key."""
        content = f"{agent_name}:{message}"
        return hashlib.md5(content.encode()).hexdigest()
    
    async def get_or_call(
        self,
        agent: Agent,
        message: str
    ) -> Any:
        """Get from cache or call agent."""
        key = self._key(agent.name, message)
        
        if key in self.cache:
            return self.cache[key]
        
        result = await agent.run(message)
        
        if len(self.cache) >= self.max_size:
            # Simple eviction: remove oldest
            self.cache.pop(next(iter(self.cache)))
        
        self.cache[key] = result
        return result

# Usage
cache = AgentCache()
result = await cache.get_or_call(agent, "Hello")
```

## Resources

- [Microsoft Agent Framework GitHub](https://github.com/microsoft/agent-framework)
- [MAF Documentation](https://learn.microsoft.com/en-us/agent-framework/)
- [Azure AI Services](https://learn.microsoft.com/azure/ai-services/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Documentation](https://docs.pydantic.dev/)

## Contributing

To add more examples or improve this reference:
1. Test the code in a real environment
2. Ensure examples follow best practices
3. Add clear comments and documentation
4. Submit a pull request

---

Last updated: 2025-01-02
