# Workshop Quick Reference

This quick reference card provides essential commands, patterns, and troubleshooting tips for the Azure AI Travel Agents workshop.

## Essential Commands

### Repository Setup
```bash
# Clone repository
git clone https://github.com/Azure-Samples/azure-ai-travel-agents.git
cd azure-ai-travel-agents

# Azure authentication
azd auth login

# Provision Azure resources
azd provision

# Start local development
npm start --prefix=src/api &
npm start --prefix=src/ui &
```

### Docker Operations
```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up tool-echo-ping

# View logs
docker-compose logs tool-echo-ping

# Restart service
docker-compose restart tool-echo-ping

# Rebuild and start
docker-compose up --build tool-echo-ping
```

### Azure Deployment
```bash
# Deploy to Azure
azd up

# Monitor deployment
azd monitor --live

# View Azure resources
azd show

# Clean up resources
azd down --purge
```

## MCP Server Patterns

### Basic Tool Definition
```typescript
{
  name: "tool_name",
  description: "Tool description",
  inputSchema: {
    type: "object",
    properties: {
      parameter: {
        type: "string",
        description: "Parameter description"
      }
    },
    required: ["parameter"]
  }
}
```

### Tool Handler Pattern
```typescript
case "tool_name":
  const param = args.parameter;
  if (!param) {
    throw new Error("Missing required parameter: parameter");
  }
  
  // Process the request
  const result = processRequest(param);
  
  return {
    content: [
      {
        type: "text",
        text: result
      }
    ]
  };
```

### Python MCP Server Template
```python
from mcp.server import Server
from mcp.types import Tool, TextContent

app = Server("server-name")

@app.list_tools()
async def handle_list_tools() -> List[Tool]:
    return [
        Tool(
            name="tool_name",
            description="Tool description",
            inputSchema={
                "type": "object",
                "properties": {
                    "param": {"type": "string"}
                },
                "required": ["param"]
            }
        )
    ]

@app.call_tool()
async def handle_call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    if name == "tool_name":
        param = arguments.get("param")
        result = f"Processed: {param}"
        return [TextContent(type="text", text=result)]
    else:
        raise ValueError(f"Unknown tool: {name}")
```

## Agent Configuration

### Agent Creation Pattern
```typescript
const customAgent = agent({
  name: "CustomAgent",
  systemPrompt: "You are a specialized agent that...",
  tools: mcpTools,
  llm: llm,
  verbose: false,
});

// Register agent
agentsList.push(customAgent);
handoffTargets.push(customAgent);
toolsList.push(...mcpTools);
```

### System Prompt Best Practices
```typescript
systemPrompt: `You are a specialized [DOMAIN] agent. Your responsibilities include:
- [PRIMARY RESPONSIBILITY]
- [SECONDARY RESPONSIBILITY]
- [ADDITIONAL RESPONSIBILITIES]

Guidelines:
- Always be [TONE/STYLE]
- [SPECIFIC BEHAVIOR RULE]
- [ERROR HANDLING INSTRUCTION]

When you cannot help, hand off to another agent.`
```

## Configuration Patterns

### MCP Tools Configuration
```typescript
// src/api/src/config/mcp-tools.ts
"service-name": {
  config: {
    command: "stdio",
    args: [],
    env: {},
    url: "http://tool-service-name:PORT/sse",
    accessToken: process.env.MCP_ACCESS_TOKEN || "local-dev-token"
  }
}
```

### Docker Compose Service
```yaml
tool-service-name:
  build:
    context: ./tools/service-name
    dockerfile: Dockerfile
  ports:
    - "PORT:PORT"
  environment:
    - OTEL_EXPORTER_OTLP_ENDPOINT=http://aspire-dashboard:18889
    - OTEL_SERVICE_NAME=service-name
  networks:
    - ai-travel-agents
```

### Azure Configuration
```yaml
# azure.yaml
services:
  service-name:
    language: python  # or typescript/java/dotnet
    host: containerapp
    docker:
      path: ./src/tools/service-name/Dockerfile
      context: ./src/tools/service-name
```

## Debugging Commands

### Check Service Status
```bash
# Check if services are running
docker-compose ps

# Check specific service logs
docker-compose logs -f tool-echo-ping

# Check API logs
npm run dev --prefix=src/api

# Check UI logs
npm run dev --prefix=src/ui
```

### Test MCP Server Directly
```bash
# Test server is responding
curl http://localhost:5007/health

# Check container network
docker network ls
docker network inspect azure-ai-travel-agents_ai-travel-agents
```

### Azure Debugging
```bash
# Check Azure resources
az resource list --resource-group [rg-name]

# Check container app logs
az containerapp logs show --name [app-name] --resource-group [rg-name]

# Check container app status
az containerapp show --name [app-name] --resource-group [rg-name]
```

## Common Error Solutions

### Port Already in Use
```bash
# Find process using port
lsof -i :4200  # or other port
kill -9 [PID]

# Or change port in configuration
```

### Docker Build Failures
```bash
# Clear Docker cache
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache tool-echo-ping
```

### Azure Authentication Issues
```bash
# Re-authenticate
azd auth logout
azd auth login

# Check subscription
az account show
az account set --subscription [subscription-id]
```

### MCP Server Not Registering
1. Check docker-compose.yml service definition
2. Verify mcp-tools.ts configuration
3. Check orchestrator agent registration
4. Restart API service

## URLs and Endpoints

### Local Development
- **UI**: http://localhost:4200
- **API**: http://localhost:4000
- **Aspire Dashboard**: http://localhost:18888
- **Echo Ping**: http://localhost:5007
- **Customer Query**: http://localhost:5001
- **Destination Rec**: http://localhost:5002
- **Itinerary Planning**: http://localhost:5003
- **Code Evaluation**: http://localhost:5004
- **Model Inference**: http://localhost:5005
- **Web Search**: http://localhost:5006

### Health Check Endpoints
Most services provide health checks at:
- `http://localhost:[PORT]/health`
- `http://localhost:[PORT]/mcp` (for MCP info)

## File Structure Reference

```
src/
├── api/                    # Main API orchestrator
│   ├── src/orchestrator/   # Agent orchestration logic
│   └── src/config/         # MCP tools configuration
├── ui/                     # Frontend application
├── tools/                  # MCP servers
│   ├── echo-ping/         # TypeScript MCP server
│   ├── customer-query/    # C# MCP server
│   ├── destination-recommendation/  # Java MCP server
│   ├── itinerary-planning/          # Python MCP server
│   ├── code-evaluation/             # Python MCP server
│   ├── model-inference/             # Python MCP server
│   └── web-search/                  # TypeScript MCP server
└── docker-compose.yml     # Local development services
```

## Key Configuration Files

- **`src/docker-compose.yml`**: Local service orchestration
- **`src/api/src/config/mcp-tools.ts`**: MCP server configurations
- **`src/api/src/orchestrator/llamaindex/index.ts`**: Agent definitions
- **`azure.yaml`**: Azure deployment configuration
- **`.env`**: Environment variables

## Testing Queries

### Basic Agent Testing
- "Hello, can you help me plan a trip?"
- "What's the weather like in Tokyo?"
- "Calculate budget for 3 days in Paris"
- "Find flights to London"

### Multi-Agent Testing
- "I want to plan a 7-day trip to Japan with a $2000 budget"
- "Compare costs between Tokyo and Osaka for a luxury trip"
- "Create an itinerary for Paris including weather and budget"

### Error Testing
- Invalid location names
- Missing required parameters
- Very complex queries requiring multiple agents

## Environment Variables

### Required for Local Development
```bash
# Azure Services
AZURE_OPENAI_ENDPOINT=https://your-openai.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini

# Bing Search
BING_SEARCH_API_KEY=your-bing-key

# MCP Server URLs (automatically configured)
MCP_ECHO_PING_URL=http://localhost:5007
# ... other MCP URLs
```

## Best Practices

### Development
- Test each MCP server independently before integration
- Use meaningful error messages and validation
- Implement comprehensive logging
- Follow consistent naming conventions

### Deployment
- Verify all environment variables are set
- Test in staging environment before production
- Monitor resource usage and costs
- Implement proper secret management

### Debugging
- Check logs systematically (UI → API → MCP servers)
- Use Aspire Dashboard for distributed tracing
- Test with simple queries before complex ones
- Verify network connectivity between services

---

## Quick Help

**Stuck on something?**
1. Check the logs first: `docker-compose logs [service-name]`
2. Verify service is running: `docker-compose ps`
3. Test individual components before integration
4. Ask for help - don't struggle alone!

**Workshop Slack/Teams**: [Add workshop communication channel]
**Presenter Contact**: [Add presenter contact info]
**Emergency Backup**: [Add backup contact or resources]