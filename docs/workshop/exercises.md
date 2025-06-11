# Workshop Exercises - Detailed Instructions

This document provides detailed step-by-step instructions for all workshop exercises, complete with code examples and expected outcomes.

## Exercise 1: Extend Echo Server with Reverse Tool

### Objective
Add a new `reverse` tool to the existing echo-ping MCP server to understand MCP tool creation.

### Prerequisites
- Workshop environment set up and running
- Familiarity with TypeScript basics

### Step-by-Step Instructions

#### Step 1: Examine the Current Echo Server
1. Navigate to the echo-ping server directory:
   ```bash
   cd src/tools/echo-ping
   ```

2. Open and examine the main server file:
   ```bash
   code src/index.ts
   ```

3. Identify the existing tool structure around line 50-70.

#### Step 2: Add the Reverse Tool
1. In `src/index.ts`, locate the tools array and add a new tool definition:

```typescript
// Add this tool definition to the tools array
{
  name: "reverse",
  description: "Reverse the input text",
  inputSchema: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "Text to reverse"
      }
    },
    required: ["text"]
  }
}
```

#### Step 3: Implement the Tool Handler
1. In the tool call handler section (around line 80-100), add the reverse tool case:

```typescript
case "reverse":
  if (!args.text) {
    throw new Error("Missing required parameter: text");
  }
  
  const reversedText = args.text.split('').reverse().join('');
  
  return {
    content: [
      {
        type: "text",
        text: `Reversed text: ${reversedText}`
      }
    ]
  };
```

#### Step 4: Test the Implementation
1. Restart the echo-ping server:
   ```bash
   docker-compose restart tool-echo-ping
   ```

2. Check the server logs:
   ```bash
   docker-compose logs tool-echo-ping
   ```

3. Test via the UI by asking: "Can you reverse the text 'hello world'?"

### Expected Outcome
- The echo agent should be able to reverse text using the new tool
- The response should show "dlrow olleh" for input "hello world"

---

## Exercise 2: Create Weather MCP Server

### Objective
Build a complete weather MCP server in Python with multiple tools.

### Prerequisites
- Python knowledge
- Understanding of MCP server structure

### Step-by-Step Instructions

#### Step 1: Create the Project Structure
1. Create the weather service directory:
   ```bash
   mkdir src/tools/weather-service
   cd src/tools/weather-service
   ```

2. Create the following files:
   ```bash
   touch Dockerfile
   touch requirements.txt
   touch src/main.py
   mkdir src
   ```

#### Step 2: Implement the Weather Server

Create `requirements.txt`:
```txt
mcp
uvicorn
fastapi
requests
pydantic
```

Create `src/main.py`:
```python
#!/usr/bin/env python3

import asyncio
import json
import logging
from typing import Any, Dict, List, Optional
from mcp.server import Server
from mcp.server.models import InitializationOptions
from mcp.server.stdio import stdio_server
from mcp.types import Resource, Tool, TextContent
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Mock weather data for demo purposes
MOCK_WEATHER_DATA = {
    "tokyo": {"temperature": 22, "condition": "Sunny", "humidity": 65},
    "london": {"temperature": 15, "condition": "Cloudy", "humidity": 80},
    "new york": {"temperature": 18, "condition": "Rainy", "humidity": 75},
    "paris": {"temperature": 20, "condition": "Partly Cloudy", "humidity": 70},
    "sydney": {"temperature": 25, "condition": "Sunny", "humidity": 60}
}

app = Server("weather-service")

@app.list_tools()
async def handle_list_tools() -> List[Tool]:
    """List available weather tools."""
    return [
        Tool(
            name="get_current_weather",
            description="Get current weather for a specific location",
            inputSchema={
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "City name"
                    }
                },
                "required": ["location"]
            }
        ),
        Tool(
            name="get_weather_forecast",
            description="Get weather forecast for a location",
            inputSchema={
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "City name"
                    },
                    "days": {
                        "type": "integer",
                        "description": "Number of days for forecast",
                        "default": 3
                    }
                },
                "required": ["location"]
            }
        ),
        Tool(
            name="compare_weather",
            description="Compare weather between two locations",
            inputSchema={
                "type": "object",
                "properties": {
                    "location1": {
                        "type": "string",
                        "description": "First city"
                    },
                    "location2": {
                        "type": "string",
                        "description": "Second city"
                    }
                },
                "required": ["location1", "location2"]
            }
        )
    ]

@app.call_tool()
async def handle_call_tool(name: str, arguments: Optional[Dict[str, Any]]) -> List[TextContent]:
    """Handle tool calls."""
    
    if name == "get_current_weather":
        location = arguments.get("location", "").lower()
        weather_data = MOCK_WEATHER_DATA.get(location)
        
        if not weather_data:
            return [TextContent(
                type="text",
                text=f"Weather data not available for {location}. Available cities: {', '.join(MOCK_WEATHER_DATA.keys())}"
            )]
        
        return [TextContent(
            type="text",
            text=f"Current weather in {location.title()}:\n"
                 f"Temperature: {weather_data['temperature']}°C\n"
                 f"Condition: {weather_data['condition']}\n"
                 f"Humidity: {weather_data['humidity']}%"
        )]
    
    elif name == "get_weather_forecast":
        location = arguments.get("location", "").lower()
        days = arguments.get("days", 3)
        
        if location not in MOCK_WEATHER_DATA:
            return [TextContent(
                type="text",
                text=f"Weather data not available for {location}"
            )]
        
        base_weather = MOCK_WEATHER_DATA[location]
        forecast = []
        
        for day in range(1, days + 1):
            # Mock forecast with slight variations
            temp_variation = (-2, 0, 1, -1, 2)[day % 5]
            forecast.append(f"Day {day}: {base_weather['temperature'] + temp_variation}°C, {base_weather['condition']}")
        
        return [TextContent(
            type="text",
            text=f"{days}-day forecast for {location.title()}:\n" + "\n".join(forecast)
        )]
    
    elif name == "compare_weather":
        loc1 = arguments.get("location1", "").lower()
        loc2 = arguments.get("location2", "").lower()
        
        weather1 = MOCK_WEATHER_DATA.get(loc1)
        weather2 = MOCK_WEATHER_DATA.get(loc2)
        
        if not weather1 or not weather2:
            return [TextContent(
                type="text",
                text="One or both locations not found in weather database"
            )]
        
        temp_diff = weather1['temperature'] - weather2['temperature']
        comparison = f"Weather comparison between {loc1.title()} and {loc2.title()}:\n\n"
        comparison += f"{loc1.title()}: {weather1['temperature']}°C, {weather1['condition']}\n"
        comparison += f"{loc2.title()}: {weather2['temperature']}°C, {weather2['condition']}\n\n"
        
        if temp_diff > 0:
            comparison += f"{loc1.title()} is {temp_diff}°C warmer than {loc2.title()}"
        elif temp_diff < 0:
            comparison += f"{loc2.title()} is {abs(temp_diff)}°C warmer than {loc1.title()}"
        else:
            comparison += "Both cities have the same temperature"
        
        return [TextContent(type="text", text=comparison)]
    
    else:
        raise ValueError(f"Unknown tool: {name}")

async def main():
    """Main entry point."""
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="weather-service",
                server_version="1.0.0",
                capabilities=app.get_capabilities(
                    notification_options=None,
                    experimental_capabilities=None,
                )
            )
        )

if __name__ == "__main__":
    asyncio.run(main())
```

#### Step 3: Create Dockerfile
Create `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/

EXPOSE 5008

CMD ["python", "src/main.py"]
```

#### Step 4: Update Docker Compose
1. Add the weather service to `src/docker-compose.yml`:

```yaml
  tool-weather-service:
    build:
      context: ./tools/weather-service
      dockerfile: Dockerfile
    ports:
      - "5008:5008"
    environment:
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://aspire-dashboard:18889
      - OTEL_SERVICE_NAME=weather-service
    networks:
      - ai-travel-agents
```

#### Step 5: Register with API
1. Update `src/api/src/config/mcp-tools.ts` to include the weather service:

```typescript
"weather-service": {
  config: {
    command: "stdio",
    args: [],
    env: {},
    url: "http://tool-weather-service:5008/sse",
    accessToken: process.env.MCP_ACCESS_TOKEN || "local-dev-token"
  }
}
```

2. Update the orchestrator in `src/api/src/orchestrator/llamaindex/index.ts`:

```typescript
if (tools["weather-service"]) {
  const mcpServerConfig = mcpToolsConfig["weather-service"];
  const tools = await mcp(mcpServerConfig.config).tools();
  const weatherAgent = agent({
    name: "WeatherAgent",
    systemPrompt: "Provides weather information and forecasts. Always be accurate and helpful with weather-related queries.",
    tools,
    llm,
    verbose,
  });
  agentsList.push(weatherAgent);
  handoffTargets.push(weatherAgent);
  toolsList.push(...tools);
}
```

#### Step 6: Test the Implementation
1. Build and start the services:
   ```bash
   docker-compose up --build tool-weather-service
   ```

2. Test via the UI: "What's the weather like in Tokyo?"

### Expected Outcome
- New weather agent responds to weather queries
- Multiple weather tools are available and functional
- Integration with the orchestrator works seamlessly

---

## Exercise 3: Custom Travel Budget Agent

### Objective
Create a specialized agent for travel budget management and planning.

### Step-by-Step Instructions

#### Step 1: Create Budget MCP Server
1. Create `src/tools/budget-planner/src/main.py`:

```python
#!/usr/bin/env python3

import asyncio
import json
from typing import Any, Dict, List, Optional
from mcp.server import Server
from mcp.server.models import InitializationOptions
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

app = Server("budget-planner")

# Sample budget data
BUDGET_TEMPLATES = {
    "budget": {"accommodation": 0.4, "food": 0.3, "activities": 0.2, "transport": 0.1},
    "luxury": {"accommodation": 0.5, "food": 0.25, "activities": 0.15, "transport": 0.1},
    "backpacker": {"accommodation": 0.2, "food": 0.4, "activities": 0.3, "transport": 0.1}
}

DAILY_COSTS = {
    "tokyo": {"budget": 80, "luxury": 200, "backpacker": 40},
    "london": {"budget": 90, "luxury": 250, "backpacker": 45},
    "paris": {"budget": 85, "luxury": 220, "backpacker": 42},
    "new york": {"budget": 100, "luxury": 300, "backpacker": 50}
}

@app.list_tools()
async def handle_list_tools() -> List[Tool]:
    return [
        Tool(
            name="calculate_trip_budget",
            description="Calculate total budget for a trip",
            inputSchema={
                "type": "object",
                "properties": {
                    "destination": {"type": "string"},
                    "days": {"type": "integer"},
                    "budget_type": {"type": "string", "enum": ["budget", "luxury", "backpacker"]},
                    "travelers": {"type": "integer", "default": 1}
                },
                "required": ["destination", "days", "budget_type"]
            }
        ),
        Tool(
            name="budget_breakdown",
            description="Get detailed budget breakdown by category",
            inputSchema={
                "type": "object",
                "properties": {
                    "total_budget": {"type": "number"},
                    "budget_type": {"type": "string", "enum": ["budget", "luxury", "backpacker"]}
                },
                "required": ["total_budget", "budget_type"]
            }
        ),
        Tool(
            name="compare_destinations",
            description="Compare costs between destinations",
            inputSchema={
                "type": "object",
                "properties": {
                    "destinations": {"type": "array", "items": {"type": "string"}},
                    "days": {"type": "integer"},
                    "budget_type": {"type": "string", "enum": ["budget", "luxury", "backpacker"]}
                },
                "required": ["destinations", "days", "budget_type"]
            }
        )
    ]

@app.call_tool()
async def handle_call_tool(name: str, arguments: Optional[Dict[str, Any]]) -> List[TextContent]:
    if name == "calculate_trip_budget":
        destination = arguments.get("destination", "").lower()
        days = arguments.get("days", 1)
        budget_type = arguments.get("budget_type", "budget")
        travelers = arguments.get("travelers", 1)
        
        if destination not in DAILY_COSTS:
            return [TextContent(
                type="text",
                text=f"Cost data not available for {destination}. Available: {', '.join(DAILY_COSTS.keys())}"
            )]
        
        daily_cost = DAILY_COSTS[destination][budget_type]
        total_cost = daily_cost * days * travelers
        
        return [TextContent(
            type="text",
            text=f"Budget calculation for {destination.title()}:\n"
                 f"Duration: {days} days\n"
                 f"Travelers: {travelers}\n"
                 f"Budget type: {budget_type.title()}\n"
                 f"Daily cost per person: ${daily_cost}\n"
                 f"Total estimated cost: ${total_cost}"
        )]
    
    elif name == "budget_breakdown":
        total_budget = arguments.get("total_budget")
        budget_type = arguments.get("budget_type", "budget")
        
        percentages = BUDGET_TEMPLATES[budget_type]
        breakdown = {}
        
        for category, percentage in percentages.items():
            breakdown[category] = total_budget * percentage
        
        result = f"Budget breakdown ({budget_type} style):\n"
        for category, amount in breakdown.items():
            result += f"{category.title()}: ${amount:.2f} ({int(percentages[category]*100)}%)\n"
        
        return [TextContent(type="text", text=result)]
    
    elif name == "compare_destinations":
        destinations = arguments.get("destinations", [])
        days = arguments.get("days", 1)
        budget_type = arguments.get("budget_type", "budget")
        
        comparison = f"Cost comparison for {days} days ({budget_type} budget):\n\n"
        
        costs = []
        for dest in destinations:
            dest_lower = dest.lower()
            if dest_lower in DAILY_COSTS:
                daily_cost = DAILY_COSTS[dest_lower][budget_type]
                total_cost = daily_cost * days
                costs.append((dest, total_cost))
                comparison += f"{dest.title()}: ${total_cost} (${daily_cost}/day)\n"
        
        if costs:
            cheapest = min(costs, key=lambda x: x[1])
            most_expensive = max(costs, key=lambda x: x[1])
            comparison += f"\nCheapest: {cheapest[0]} (${cheapest[1]})\n"
            comparison += f"Most expensive: {most_expensive[0]} (${most_expensive[1]})"
        
        return [TextContent(type="text", text=comparison)]
    
    else:
        raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="budget-planner",
                server_version="1.0.0",
                capabilities=app.get_capabilities()
            )
        )

if __name__ == "__main__":
    asyncio.run(main())
```

#### Step 2: Add Budget Agent to Orchestrator
Update `src/api/src/orchestrator/llamaindex/index.ts`:

```typescript
if (tools["budget-planner"]) {
  const mcpServerConfig = mcpToolsConfig["budget-planner"];
  const tools = await mcp(mcpServerConfig.config).tools();
  const budgetAgent = agent({
    name: "BudgetPlannerAgent",
    systemPrompt: `You are a specialized travel budget planning agent. You help travelers:
    - Calculate accurate trip budgets based on destination and travel style
    - Provide detailed budget breakdowns by category
    - Compare costs between different destinations
    - Suggest budget optimization strategies
    
    Always be practical and helpful with money-related advice. Consider different budget levels (budget, luxury, backpacker) and provide realistic estimates.`,
    tools,
    llm,
    verbose,
  });
  agentsList.push(budgetAgent);
  handoffTargets.push(budgetAgent);
  toolsList.push(...tools);
}
```

#### Step 3: Test Budget Agent
Test with queries like:
- "What would it cost for 2 people to visit Tokyo for 5 days on a budget?"
- "Can you break down a $1000 budget for luxury travel?"
- "Compare costs between London and Paris for a 7-day trip"

### Expected Outcome
- Specialized budget agent handles financial planning queries
- Accurate budget calculations and breakdowns
- Cost comparisons between destinations

---

## Exercise 4: Production Deployment

### Objective
Deploy the enhanced application with new services to Azure.

### Step-by-Step Instructions

#### Step 1: Update Azure Configuration
1. Update `azure.yaml` to include new services:

```yaml
services:
  weather-service:
    language: python
    host: containerapp
    docker:
      path: ./src/tools/weather-service/Dockerfile
      context: ./src/tools/weather-service
  
  budget-planner:
    language: python
    host: containerapp
    docker:
      path: ./src/tools/budget-planner/Dockerfile
      context: ./src/tools/budget-planner
```

#### Step 2: Deploy to Azure
1. Build and deploy:
   ```bash
   azd up
   ```

2. Monitor deployment:
   ```bash
   azd monitor --live
   ```

#### Step 3: Verify Production Deployment
1. Test the deployed application
2. Check container app logs
3. Verify all services are running

### Expected Outcome
- All services deployed successfully to Azure Container Apps
- New agents accessible in production environment
- Monitoring and logging configured properly

---

## Tips for Success

### Common Pitfalls
1. **Port Conflicts**: Ensure all ports are unique
2. **Environment Variables**: Verify all required variables are set
3. **Docker Build Context**: Check Dockerfile paths and contexts
4. **Agent Registration**: Ensure new agents are properly registered

### Debugging Strategies
1. **Check Logs**: Use `docker-compose logs [service]`
2. **Test Individually**: Test MCP servers independently
3. **Verify Configuration**: Double-check all configuration files
4. **Use Monitoring**: Leverage Aspire Dashboard for tracing

### Best Practices
1. **Error Handling**: Implement comprehensive error handling
2. **Validation**: Validate all inputs and parameters
3. **Documentation**: Document all new tools and agents
4. **Testing**: Test thoroughly before deployment