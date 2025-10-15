# Comparison: LlamaIndex.TS vs Microsoft Agent Framework

## Overview

This document provides a side-by-side comparison of the current LlamaIndex.TS orchestration implementation and the proposed Microsoft Agent Framework (MAF) implementation.

## High-Level Comparison

| Aspect | LlamaIndex.TS (Current) | Microsoft Agent Framework (Proposed) |
|--------|-------------------------|-------------------------------------|
| **Language** | TypeScript | Python |
| **Runtime** | Node.js 22+ | Python 3.12+ |
| **Web Framework** | Express.js | FastAPI |
| **Package Manager** | npm | pip/poetry |
| **Agent Framework** | LlamaIndex.TS 0.10.3 | agent-framework (latest) |
| **Multi-Agent Support** | Yes | Yes |
| **Workflow Support** | Yes | Yes |
| **LLM Integration** | Multiple providers | Azure OpenAI, OpenAI |
| **Tool Calling** | Yes | Yes |
| **Streaming** | SSE (Server-Sent Events) | SSE (Server-Sent Events) |
| **State Management** | Built-in | Built-in |
| **Observability** | OpenTelemetry | OpenTelemetry |
| **Community** | Growing | New, Microsoft-backed |
| **Documentation** | Good | Emerging |
| **Azure Integration** | Via SDKs | Native Azure AI integration |

## Code Comparison

### Agent Definition

**Using LlamaIndex.TS**:
```typescript
import { agent, multiAgent } from "llamaindex";
import { mcp } from "@llamaindex/tools";

// Create agent
const customerQueryAgent = agent({
  name: "CustomerQueryAgent",
  systemPrompt: "Assists employees in understanding customer needs.",
  tools: await mcp(mcpServerConfig.config).tools(),
  llm,
  verbose: false
});
```

**Using Microsoft Agent Framework**:
```python
from agent_framework import Agent
from azure.ai.inference import ChatCompletionsClient

# Create agent
customer_query_agent = Agent(
    name="CustomerQueryAgent",
    system_prompt="Assists employees in understanding customer needs.",
    tools=[customer_query_tool],
    llm_client=llm_client,
    model=deployment_name
)
```

### Multi-Agent Workflow

**LlamaIndex.TS (Current)**:
```typescript
// Create multi-agent workflow
const workflow = multiAgent({
  agents: agentsList,
  rootAgent: travelAgent,
  verbose: false
});

// Run workflow
for await (const event of workflow.run(message)) {
  console.log(event);
}
```

**Microsoft Agent Framework (Proposed)**:
```python
from agent_framework import Workflow

# Create workflow
workflow = Workflow(
    name="TravelPlanningWorkflow",
    agents=agents_list,
    root_agent=triage_agent
)

# Run workflow
async for event in workflow.run(message):
    print(event)
```

### Tool Integration

**With LlamaIndex.TS**:
```typescript
import { mcp } from "@llamaindex/tools";

// MCP tool configuration
const mcpServerConfig = {
  url: process.env.MCP_CUSTOMER_QUERY_URL + "/mcp",
  type: "http",
  verbose: true,
  useSSETransport: false
};

// Get tools from MCP server
const tools = await mcp(mcpServerConfig).tools();
```

**With Microsoft Agent Framework**:
```python
from agent_framework import Tool
import httpx

# Create MCP client wrapper
async def call_customer_query_tool(query: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{MCP_SERVER_URL}/mcp/call",
            json={"name": "analyze_query", "arguments": {"query": query}}
        )
        return response.json()

# Create tool
customer_query_tool = Tool(
    name="analyze_customer_query",
    description="Analyze customer query",
    function=call_customer_query_tool
)
```

### API Endpoint

**LlamaIndex.TS (Current)**:
```typescript
import express from "express";

const apiRouter = express.Router();

apiRouter.post("/chat", async (req, res) => {
  const message = req.body.message;
  const tools = req.body.tools;
  
  res.setHeader("Content-Type", "text/event-stream");
  
  const agents = await setupAgents(tools);
  const context = agents.run(message);
  
  for await (const event of context) {
    const data = JSON.stringify(event);
    res.write(data + "\n\n");
  }
  
  res.end();
});
```

**Microsoft Agent Framework (Proposed)**:
```python
from fastapi import FastAPI
from sse_starlette import EventSourceResponse

app = FastAPI()

@app.post("/api/chat")
async def chat(request: dict):
    message = request.get("message")
    tools = request.get("tools", [])
    
    async def event_generator():
        async for event in workflow.run(message, selected_tools=tools):
            yield {
                "event": "message",
                "data": event.model_dump_json()
            }
    
    return EventSourceResponse(event_generator())
```

### Configuration

**LlamaIndex.TS (Current)**:
```typescript
// .env configuration
const config = {
  azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
  azureOpenAIKey: process.env.AZURE_OPENAI_API_KEY,
  mcpServers: {
    customerQuery: process.env.MCP_CUSTOMER_QUERY_URL,
    // ...
  }
};
```

**Microsoft Agent Framework (Proposed)**:
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    azure_openai_endpoint: str
    azure_openai_api_key: str
    mcp_customer_query_url: str
    # ...
    
    class Config:
        env_file = ".env"

settings = Settings()
```

## Feature Comparison

### Supported Features

| Feature | LlamaIndex.TS | MAF | Notes |
|---------|---------------|-----|-------|
| Multi-agent orchestration | ✅ | ✅ | Both support well |
| Agent handoff | ✅ | ✅ | Similar patterns |
| Tool calling | ✅ | ✅ | Both support |
| Streaming responses | ✅ | ✅ | SSE in both |
| State management | ✅ | ✅ | Built-in support |
| Parallel execution | ✅ | ✅ | Via async/await |
| Error handling | ✅ | ✅ | Similar capabilities |
| OpenTelemetry | ✅ | ✅ | Both support |
| Azure integration | ✅ | ✅✅ | MAF has native Azure AI |
| MCP protocol | ✅ | ➖ | Need custom integration |
| Type safety | ✅ | ✅ | TypeScript vs Pydantic |
| Hot reload | ✅ | ✅ | tsx vs uvicorn |

✅ = Fully supported, ➖ = Requires custom implementation, ❌ = Not supported

### Performance Characteristics

| Metric | LlamaIndex.TS | MAF (Estimated) | Notes |
|--------|---------------|-----------------|-------|
| Startup time | ~2-3s | ~1-2s | Python faster to start |
| Memory usage | ~150MB | ~100MB | Python more efficient |
| Request latency | ~500ms | ~400ms | Similar, depends on LLM |
| Concurrent requests | High | High | Both async frameworks |
| Streaming overhead | Low | Low | SSE in both |
| Tool call overhead | Low | Medium | Custom MCP integration |

*Note: Performance metrics are estimates and should be validated through benchmarking.*

### Developer Experience

| Aspect | LlamaIndex.TS | MAF | Winner |
|--------|---------------|-----|--------|
| Learning curve | Medium | Medium | Tie |
| Type safety | Strong | Strong | Tie |
| IDE support | Excellent | Excellent | Tie |
| Debugging | Good | Good | Tie |
| Testing | Good | Good | Tie |
| Hot reload | ✅ | ✅ | Tie |
| Package ecosystem | Large (npm) | Large (PyPI) | Tie |
| Documentation | Good | Emerging | LlamaIndex |
| Community support | Growing | New | LlamaIndex |
| Azure ecosystem | Good | Native | MAF |
| AI/ML ecosystem | Good | Excellent | MAF |

## Migration Effort

### Low Effort Items (Easy)

1. **Configuration management** - Similar env-based config
2. **API structure** - Express → FastAPI is straightforward
3. **SSE streaming** - Similar implementation
4. **OpenTelemetry** - Similar setup
5. **Environment variables** - 1:1 mapping

### Medium Effort Items

1. **Agent definitions** - Similar but different syntax
2. **Workflow orchestration** - Conceptually similar
3. **Error handling** - Need to reimplement patterns
4. **State management** - Different APIs
5. **Testing** - Need to rewrite tests

### High Effort Items (Complex)

1. **MCP client integration** - Need custom implementation
2. **Tool wrapping** - Different approach needed
3. **Deployment configuration** - New Docker setup
4. **Documentation** - Comprehensive rewrite needed
5. **Team training** - Python vs TypeScript

## Pros and Cons

### LlamaIndex.TS (Current)

**Pros**:
- ✅ Already implemented and working
- ✅ Team familiar with TypeScript
- ✅ Good documentation
- ✅ Active community
- ✅ MCP integration built-in
- ✅ No migration risk
- ✅ Proven in production

**Cons**:
- ❌ Not native to Azure AI ecosystem
- ❌ TypeScript for AI/ML less common
- ❌ Limited Python ML library access
- ❌ Smaller AI framework ecosystem

### Microsoft Agent Framework (Proposed)

**Pros**:
- ✅ Native Azure AI integration
- ✅ Microsoft backing and support
- ✅ Python AI/ML ecosystem
- ✅ Modern agent architecture
- ✅ Pydantic for type safety
- ✅ FastAPI performance
- ✅ Better Azure integration

**Cons**:
- ❌ Migration effort required
- ❌ New framework (less mature)
- ❌ Custom MCP integration needed
- ❌ Team needs Python skills
- ❌ Migration risk
- ❌ Emerging documentation
- ❌ Smaller community

## Decision Factors

### When to Choose LlamaIndex.TS

1. **Team expertise**: Team is primarily TypeScript-focused
2. **Stability**: Need proven, stable solution
3. **Time constraints**: Can't afford migration time
4. **MCP focus**: Heavy reliance on MCP ecosystem
5. **Risk aversion**: Want to avoid migration risks

### When to Choose Microsoft Agent Framework

1. **Azure ecosystem**: Deep Azure AI integration needed
2. **Python expertise**: Team has Python AI/ML skills
3. **ML integration**: Need Python ML libraries
4. **Long-term support**: Want Microsoft backing
5. **Modern architecture**: Want latest agent patterns
6. **Innovation**: Willing to adopt emerging technology

## Recommendation

### Short-term (0-6 months)

**Stick with LlamaIndex.TS** if:
- Current implementation is working well
- No pressing issues with current architecture
- Team bandwidth is limited
- Migration risk is too high

### Long-term (6-12+ months)

**Consider MAF migration** if:
- Azure AI integration becomes critical
- Python ML capabilities are needed
- Microsoft support is valuable
- Team can invest in migration
- Modern agent architecture is desired

### Hybrid Approach

**Parallel deployment** allows:
- Test MAF without full commitment
- Gradual migration of features
- Risk mitigation through rollback
- Performance comparison
- Team skill building

## Conclusion

Both LlamaIndex.TS and Microsoft Agent Framework are capable solutions for multi-agent orchestration. The choice depends on:

1. **Team expertise** - TypeScript vs Python
2. **Ecosystem needs** - npm vs PyPI, Node vs Python
3. **Azure integration** - Nice-to-have vs critical
4. **Risk tolerance** - Stable vs emerging
5. **Time horizon** - Short-term vs long-term

For this project, we recommend:
- **Option 1**: Continue with LlamaIndex.TS for stability
- **Option 2**: Migrate to MAF for Azure AI integration
- **Option 3**: Parallel deployment for gradual transition ✅ (Recommended)

The parallel deployment approach provides the best of both worlds: maintain stability while exploring new capabilities.

## Next Steps

If proceeding with MAF:
1. Review [MAF Orchestration Design](./maf-orchestration-design.md)
2. Follow [MAF Implementation Guide](./maf-implementation-guide.md)
3. Execute [MAF Migration Plan](./maf-migration-plan.md)
4. Use [MAF Quick Reference](./maf-quick-reference.md) for development

If staying with LlamaIndex.TS:
1. Continue current development
2. Monitor MAF maturity
3. Reevaluate in 6 months
4. Keep migration option open

## Resources

- [LlamaIndex.TS Documentation](https://ts.llamaindex.ai/)
- [Microsoft Agent Framework](https://github.com/microsoft/agent-framework)
- [MAF Documentation](https://learn.microsoft.com/en-us/agent-framework/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Express.js Documentation](https://expressjs.com/)

---

Last updated: 2025-01-02
