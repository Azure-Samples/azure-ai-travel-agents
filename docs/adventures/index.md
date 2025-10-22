## The Developer's Guide to AI Travel Agent Orchestration

The AI Travel Agents application is a modular, polyglot system that integrates multiple orchestration layers to coordinate specialized AI agents. By leveraging the Model Context Protocol (MCP), the system connects tool servers across different programming languages—TypeScript, Python, Java, and C#—to process customer inquiries, recommend destinations, and plan itineraries. Each orchestration layer provides unique workflows to manage agent interactions and ensure seamless communication with MCP servers. This guide explores the technical components that make up the system, enabling developers to understand its architecture and implementation.

**Adventure Awaits** – Choose your quest wisely, brave adventurer!

## LangChain.js Orchestration

Investigate how **packages/api-langchain-js/src/server.ts**, **packages/api-langchain-js/src/graph/index.ts**, **packages/api-langchain-js/src/agents/index.ts**, and **packages/api-langchain-js/src/index.ts** implement LangChain.js workflows to coordinate AI agents.

**Files to explore:**
- `packages/api-langchain-js/src/server.ts`
- `packages/api-langchain-js/src/graph/index.ts`
- `packages/api-langchain-js/src/agents/index.ts`
- `packages/api-langchain-js/src/index.ts`

### Quest Content

# Quest 1: LangChain.js Orchestration
---
The AI Travel Agents application leverages LangChain.js as one of its primary orchestration layers. This implementation coordinates specialized agents to efficiently process customer queries, recommend destinations, and create itineraries. Using LangGraph workflows, LangChain.js dynamically integrates MCP tool servers written in TypeScript, Python, Java, and C#. Developers can explore how LangChain.js orchestrates tools and agents, facilitating seamless communication, real-time response streaming, and fault-tolerant workflows. This guide dives deep into LangChain.js orchestration patterns and technical implementation details.

## Key Takeaways
After completing this quest, you will understand:
- 🎯 **LangGraph Workflow**: How LangChain.js uses LangGraph to coordinate agents and tools dynamically.
- 🔍 **Agent Setup**: How specialized agents are configured with MCP tools based on user needs.
- ⚡ **Streaming Responses**: How server-sent events (SSE) are used to stream real-time responses to clients.
- 💡 **Error Handling Patterns**: How the system manages unexpected errors to ensure robust workflows.

## File Exploration

### File: packages/api-langchain-js/src/server.ts
The server file is the entry point of the LangChain.js orchestration implementation. It establishes the API endpoints for health checks, tool discovery, and real-time query processing via Server-Sent Events (SSE). The file showcases foundational Express.js patterns for middleware, API routing, and request handling.

#### Highlights
- `GET /api/tools`: Lists available MCP tools and their configurations.
- `POST /api/chat`: Handles customer queries and streams agent responses using Server-Sent Events.
- `GET /api/health`: Provides a health check endpoint for orchestrator status.

#### Code
```typescript
apiRouter.get("/tools", async (req, res) => {
  try {
    const tools = await mcpToolsList(Object.values(McpToolsConfig()));
    console.log("Available tools:", tools);
    res.status(200).json({ tools });
  } catch (error) {
    console.error("Error fetching MCP tools:", error);
    res.status(500).json({ error: "Error fetching MCP tools" });
  }
});
```
- Lists the available MCP tools by querying the `McpToolsConfig` registry.
- Demonstrates a simple API endpoint implementation using Express.js.
- Uses defensive programming to handle errors gracefully and return meaningful responses.
- Highlights modular tool discovery, enabling dynamic configuration of the orchestration layer.

---

```typescript
apiRouter.post("/chat", async (req, res) => {
  const message = req.body.message;
  const tools = req.body.tools;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const workflow = await setupAgents(tools);
    const readableStream = new Readable({
      async read() {
        for await (const event of workflow.run(message)) {
          const serializedData = JSON.stringify(event);
          this.push(serializedData + "\n\n");
        }
        this.push(null);
      },
    });

    await pipeline(readableStream, res);
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ error: error.message });
  }
});
```
- Implements real-time response streaming using Server-Sent Events (SSE).
- Uses an asynchronous pipeline to stream agent events to the client as they become available.
- Demonstrates the use of Node.js streams for efficient data handling.
- Ensures robust error handling for unexpected failures during query processing.

---

### File: packages/api-langchain-js/src/graph/index.ts
This file contains the `TravelAgentsWorkflow` class, which represents the LangGraph workflow for orchestrating agent interactions. It provides methods to initialize the workflow with MCP tools and stream real-time events during query execution.

#### Highlights
- `TravelAgentsWorkflow.initialize`: Sets up agents and tools based on available MCP configurations.
- `TravelAgentsWorkflow.run`: Executes the workflow and streams events such as tool execution and LLM token generation.

#### Code
```typescript
async initialize(filteredTools: McpServerDefinition[] = []) {
  const { agents, supervisor } = await setupAgents(filteredTools, this.llm);
  this.agents = agents;
  this.supervisor = supervisor;
}
```
- Initializes the workflow by setting up agents and a supervisor using the `setupAgents` function.
- Demonstrates dynamic configuration of agents based on filtered tool definitions.
- Highlights the modularity of the system, allowing tools to be added or removed without changes to orchestration logic.

---

```typescript
async *run(input: string) {
  const app = this.supervisor.compile();
  const eventStream = app.streamEvents({ messages: [new HumanMessage(input)] }, { version: "v2" });

  for await (const event of eventStream) {
    yield event;
  }
}
```
- Streams real-time events generated by the LangGraph workflow.
- Handles various event types (e.g., tool execution start/end, LLM token generation).
- Demonstrates the integration of stream-based workflows within LangChain.js.

---

### File: packages/api-langchain-js/src/agents/index.ts
This file defines helper functions to create MCP tools and agents. It includes the `setupAgents` function, which configures agents dynamically based on available MCP servers.

#### Highlights
- `setupAgents`: Dynamically creates agents and tools based on filtered MCP server configurations.
- `createMcpTools`: Generates MCP tools for agents using server definitions.

#### Code
```typescript
export const setupAgents = async (filteredTools: McpServerDefinition[] = [], model: BaseChatModel) => {
  const tools = Object.fromEntries(filteredTools.map((tool) => [tool.id, true]));
  const agents: any[] = [];

  if (tools["echo-ping"]) {
    const echoTools = await createMcpTools(McpToolsConfig()["echo-ping"]);
    agents.push(createAgent({ model, name: "EchoAgent", tools: echoTools }));
  }

  return { supervisor: createSupervisor({ agents, llm: model }), agents };
};
```
- Configures agents dynamically based on the tools specified in `filteredTools`.
- Demonstrates the use of `createAgent` and `createSupervisor` for agent orchestration.
- Simplifies agent creation by abstracting tool configuration logic.

---

```typescript
export const createMcpTools = async (mcpServerConfig: McpServerDefinition): Promise<DynamicStructuredTool[]> => {
  return createMcpToolsFromDefinition(mcpServerConfig);
};
```
- Generates MCP tools based on server definitions.
- Illustrates the use of dynamic tool creation for integration with external MCP servers.

---

## Helpful Hints
- Explore how the `TravelAgentsWorkflow.run` method streams events for real-time client interactions.
- Study the `setupAgents` function to understand how tools and agents are dynamically configured in LangChain.js.
- Investigate the use of async pipelines in the `POST /api/chat` endpoint for efficient streaming.

## Try This
Challenge yourself to deepen your understanding:

1. **Extend Workflow Functionality**: Modify the `TravelAgentsWorkflow.run` method to include custom event types. For example, add a new event when the workflow starts processing.
2. **Add a New Agent**: Implement a new specialized agent (e.g., a "Budget Optimization Agent") that suggests cost-effective travel plans. Register it using the `setupAgents` function.
3. **Trace Event Lifecycle**: Add logging statements at key points in the `run` method to trace the lifecycle of events from input to output.

---
Excellent work! Continue to the next quest to uncover more mysteries of the AI Travel Agents system.

Congratulations on deploying your first successful LangChain.js orchestration—your codebase is now a shining example of modular efficiency and streamlined execution ⭐🚀⚡!

---

## Model Context Protocol (MCP) Integration

Explore **packages/api-langchain-js/src/mcp/mcp-http-client.ts**, **packages/api-langchain-js/src/mcp/mcp-tools.ts**, **packages/api-langchain-js/src/tools/index.ts**, and **packages/api-langchain-js/src/tools/mcp-bridge.ts** to understand MCP's role in connecting orchestration layers with tool servers.

**Files to explore:**
- `packages/api-langchain-js/src/mcp/mcp-http-client.ts`
- `packages/api-langchain-js/src/mcp/mcp-tools.ts`
- `packages/api-langchain-js/src/tools/index.ts`
- `packages/api-langchain-js/src/tools/mcp-bridge.ts`

### Quest Content

# Quest 2: Model Context Protocol (MCP) Integration  
---

Dive into the heart of the AI Travel Agents application to explore the Model Context Protocol (MCP), the universal tool layer that enables seamless communication between orchestration layers and diverse AI tool servers. MCP acts as the bridge connecting specialized microservices built across TypeScript, Python, Java, and C#, ensuring standardized communication for tool discovery, invocation, and data exchange. In this quest, you’ll unlock the technical components responsible for establishing connections, managing tools, and invoking server-side functionality across multiple programming languages.

## Key Takeaways  
After completing this quest, you will understand:  
- 🎯 **MCP Client Design**: How the `MCPClient` class establishes connections and interacts with MCP servers.  
- 🔍 **Tool Discovery Workflow**: How the system dynamically lists and configures tools from MCP servers using `mcpToolsList`.  
- ⚡ **Tool Invocation**: How tools are invoked with structured arguments and responses in a polyglot environment.  
- 💡 **Extensibility Practices**: How to add new tools and MCP servers to the architecture for future expansions.  

## File Exploration  

### File: packages/api-langchain-js/src/mcp/mcp-http-client.ts  
This file defines the `MCPClient` class, which acts as the communication bridge for MCP servers. It uses `StreamableHTTPClientTransport` from the MCP SDK to connect, discover tools, and invoke them. The file showcases how MCP servers are integrated into the orchestration layer using standardized protocols.

#### Highlights  
- `MCPClient.connect`: Establishes a connection to the MCP server and initializes transport for tool communication.  
- `MCPClient.listTools`: Retrieves the list of available tools from the MCP server.  
- `MCPClient.callTool`: Invokes a specific tool with structured arguments and returns results.  

#### Code  
```typescript
async connect() {
    await this.client.connect(this.transport);
    console.log('Connected to server');
}
```  
- Establishes communication with the MCP server using `StreamableHTTPClientTransport`.  
- Ensures a reliable connection before further interaction.  
- Logs connection status for debugging purposes.  

---  

```typescript
async listTools() {
    const result = await this.client.listTools();
    return result.tools;
}
```  
- Fetches a list of tools provided by the MCP server.  
- Demonstrates asynchronous programming to handle server responses.  
- Ensures tools are dynamically discovered for use in orchestration workflows.  

---  

```typescript
async callTool(name: string, toolArgs: string) {
    console.log(`Calling tool ${name} with arguments:`, toolArgs);

    return await this.client.callTool({
        name,
        arguments: JSON.parse(toolArgs),
    });
}
```  
- Sends structured arguments to invoke a tool on the MCP server.  
- Implements JSON parsing for type-safe argument handling.  
- Demonstrates robust logging practices for monitoring tool execution.  

---

### File: packages/api-langchain-js/src/mcp/mcp-tools.ts  
This file provides the `mcpToolsList` function, which discovers all available tools across multiple MCP servers. It introduces the concept of using a client factory to initialize MCP clients dynamically based on server configurations.

#### Highlights  
- `client factory`: Dynamically initializes MCP clients based on server configurations and transport types.  
- `mcpToolsList`: Aggregates tools from multiple MCP servers, handling connectivity and error reporting.  

#### Code  
```typescript
function client(config: MCPClientOptions): MCPSSEClient | MCPHTTPClient {
    console.log(`Initializing MCP client`);
    console.log(`Using configuration:`, {config});

    if (config.type === "sse") {
        return new MCPSSEClient("langchain-js-sse-client", config.url, config.accessToken);
    } else {
        return new MCPHTTPClient("langchain-js-http-client", config.url, config.accessToken);
    }
}
```  
- Creates MCP clients dynamically based on the server’s transport type (`sse` or `http`).  
- Illustrates polymorphic behavior in handling different server configurations.  
- Demonstrates encapsulation for client initialization logic.  

---  

```typescript
export async function mcpToolsList(config: McpServerDefinition[]) {
    return await Promise.all(
        config.map(async ({ id, name, config }) => {
            const { url, type } = config;
            const mcpClient = client(config);

            try {
                console.log(`Connecting to MCP server ${name} at ${url}`);
                await mcpClient.connect();
                console.log(`MCP server ${name} is reachable`);
                const tools = await mcpClient.listTools();

                console.log(`MCP server ${name} has ${tools.length} tools`);
                return {
                    id,
                    name,
                    url,
                    type,
                    reachable: true,
                    selected: id !== "echo-ping",
                    tools,
                };
            } catch (error: unknown) {
                console.error(
                    `MCP server ${name} is not reachable`,
                    (error as Error).message
                );
                return {
                    id,
                    name,
                    url,
                    type,
                    reachable: false,
                    selected: false,
                    tools: [],
                    error: (error as Error).message,
                };
            } finally {
                await mcpClient.cleanup();
            }
        })
    );
}
```  
- Aggregates tools from multiple MCP servers, validating connectivity and tool availability.  
- Demonstrates error handling for unreachable servers.  
- Implements asynchronous workflows using `Promise.all` for concurrent tool discovery.  
- Ensures proper resource cleanup after server interaction.  

---

### File: packages/api-langchain-js/src/tools/index.ts  
This file defines the `McpToolsConfig` function, which provides configurations for all supported MCP servers in the system. It encapsulates server URLs, access tokens, and other metadata for seamless tool integration.

#### Highlights  
- `McpToolsConfig`: Centralized configuration provider for all MCP servers.  

#### Code  
```typescript
export const McpToolsConfig = (): {
    [k in McpServerName]: McpServerDefinition;
} => ({
    "echo-ping": {
        config: {
            url: process.env["MCP_ECHO_PING_URL"] + MCP_API_HTTP_PATH,
            type: "http",
            verbose: true,
            requestInit: {
                headers: {
                    "Authorization": "Bearer " + process.env["MCP_ECHO_PING_ACCESS_TOKEN"],
                }
            },
        },
        id: "echo-ping",
        name: "Echo Test",
    },
    "customer-query": {
        config: {
            url: process.env["MCP_CUSTOMER_QUERY_URL"] + MCP_API_HTTP_PATH,
            type: "http",
            verbose: true,
        },
        id: "customer-query",
        name: "Customer Query",
    },
    "itinerary-planning": {
        config: {
            url: process.env["MCP_ITINERARY_PLANNING_URL"] + MCP_API_HTTP_PATH,
            type: "http",
            verbose: true,
        },
        id: "itinerary-planning",
        name: "Itinerary Planning",
    },
    "destination-recommendation": {
        config: {
            url: process.env["MCP_DESTINATION_RECOMMENDATION_URL"] + MCP_API_HTTP_PATH,
            type: "http",
            verbose: true,
        },
        id: "destination-recommendation",
        name: "Destination Recommendation",
    },
});
```  
- Centralizes server configurations for ease of maintenance and extensibility.  
- Dynamically constructs URLs using environment variables for flexibility.  
- Demonstrates type-safe mappings between server names and configurations.  

---

### File: packages/api-langchain-js/src/tools/mcp-bridge.ts  
This file defines the `createMcpToolsFromDefinition` function, which loads MCP tools using the official LangChain MCP adapters. It demonstrates integration of third-party libraries for standardized tool creation.

#### Highlights  
- `createMcpToolsFromDefinition`: Creates LangChain tools from MCP server definitions.  

#### Code  
```typescript
export const createMcpToolsFromDefinition = async (
    mcpServerConfig: McpServerDefinition
): Promise<DynamicStructuredTool[]> => {
    try {
        console.log(`Creating MCP tools for ${mcpServerConfig.id} at ${mcpServerConfig.config.url}`);
        
        const headers: Record<string, string> = {};
        if (mcpServerConfig.config.requestInit?.headers) {
            const configHeaders = mcpServerConfig.config.requestInit.headers as Record<string, string>;
            Object.assign(headers, configHeaders);
        }

        const client = new Client({
            name: `langchain-mcp-client-${mcpServerConfig.id}`,
            version: "1.0.0",
        });

        const transport = new StreamableHTTPClientTransport(
            new URL(mcpServerConfig.config.url),
            { requestInit: { headers } }
        );

        await client.connect(transport);
        
        const tools = await loadMcpTools(mcpServerConfig.id, client);

        console.log(`Created ${tools.length} Langchain tools for ${mcpServerConfig.id}`);
        return tools;
        
    } catch (error) {
        console.error(`Error creating MCP tools for ${mcpServerConfig.id}:`, error);
        return [];
    }
};
```  
- Loads tools using the official LangChain MCP adapters for seamless integration.  
- Demonstrates how to pass headers dynamically for authentication.  
- Illustrates error handling and logging for debugging issues during tool creation.  
- Provides a reusable pattern for integrating MCP tools into LangChain workflows.  

---

## Helpful Hints  
- Use `McpToolsConfig` to add new MCP servers without modifying core logic.  
- Study the `MCPClient.connect` method to understand how transport layers are initialized.  
- Experiment with tool invocation workflows using `MCPClient.callTool` to test tool interactions.  

## Try This  
Challenge yourself to deepen your understanding:  

1. **Add a New MCP Server**: Create and configure a new MCP server in `packages/mcp-servers/`. Add it to `McpToolsConfig` and test its tool discovery using `mcpToolsList`.  
2. **Trace Tool Invocation**: Add debug logs in `MCPClient.callTool` to observe how arguments are processed and results are returned. Use the logs to understand the complete lifecycle of a tool invocation.  

---

Excellent work! Continue to the next quest to uncover more mysteries of MCP and AI orchestration.

Congratulations on successfully deploying the MCP Integration—your codebase is now 20% closer to full functionality; keep iterating and refactoring towards the final build! 🚀⚡💎

---

## Polyglot MCP Tool Servers

Study the implementation of MCP servers in **packages/mcp-servers/echo-ping/src/index.ts**, **packages/mcp-servers/itinerary-planning/src/mcp_server.py**, **packages/mcp-servers/customer-query/AITravelAgent.CustomerQueryServer/Tools/CustomerQueryTool.cs**, **packages/mcp-servers/customer-query/AITravelAgent.CustomerQueryServer/Program.cs**, **packages/mcp-servers/destination-recommendation/src/main/java/com/microsoft/mcp/sample/server/McpServerApplication.java**, and **packages/mcp-servers/destination-recommendation/src/main/java/com/microsoft/mcp/sample/server/service/DestinationService.java**.

**Files to explore:**
- `packages/mcp-servers/echo-ping/src/index.ts`
- `packages/mcp-servers/itinerary-planning/src/mcp_server.py`
- `packages/mcp-servers/customer-query/AITravelAgent.CustomerQueryServer/Program.cs`
- `packages/mcp-servers/customer-query/AITravelAgent.CustomerQueryServer/Tools/CustomerQueryTool.cs`
- `packages/mcp-servers/destination-recommendation/src/main/java/com/microsoft/mcp/sample/server/McpServerApplication.java`
- `packages/mcp-servers/destination-recommendation/src/main/java/com/microsoft/mcp/sample/server/service/DestinationService.java`

### Quest Content

# Quest 3: Polyglot MCP Tool Servers
---
In the realm of distributed systems, the Polyglot MCP Tool Servers serve as the guardians of specialized tools, each speaking its own programming language. These servers enable seamless communication across boundaries, ensuring that AI agents receive the tools they need to perform their tasks efficiently. From analyzing customer inquiries to recommending destinations and planning itineraries, the servers provide the backbone for the AI Travel Agents application to deliver a rich and interactive user experience.

## Key Takeaways
After completing this quest, you will understand:
- 🎯 **Polyglot Architecture**: How MCP servers in different programming languages interact harmoniously within a unified protocol.
- 🔍 **Tool Server Integration**: How to implement and integrate new tools into the MCP ecosystem with language-specific design patterns.
- ⚡ **Protocol Scalability**: How Model Context Protocol supports high performance and extensibility across services.
- 💡 **Error Handling Techniques**: How to design robust systems that can recover gracefully from invalid inputs.

## File Exploration

### File: packages/mcp-servers/customer-query/AITravelAgent.CustomerQueryServer/Tools/CustomerQueryTool.cs
The `CustomerQueryTool` is a .NET-based MCP server that analyzes customer queries to extract emotions, intents, requirements, and preferences. It uses annotation-driven configuration for seamless integration with the MCP protocol and a random generator for demonstration purposes.

#### Highlights
- `AnalyzeCustomerQueryAsync` processes customer queries to extract structured data such as emotions, intents, and preferences.
- `[McpServerTool]` attribute registers the tool with the MCP server, enabling tool discovery for orchestration layers.
- Logging mechanisms record incoming queries, aiding debugging and system monitoring.
- Use of random data generation mimics actual processing logic for prototyping purposes.

#### Code
```csharp
[McpServerTool(Name = "analyze_customer_query", Title = "Analyze Customer Query")]
[Description("Analyzes the customer query and provides a response.")]
public async Task<CustomerQueryAnalysisResult> AnalyzeCustomerQueryAsync(
    [Description("The customer query to analyze")] string customerQuery)
{
    // Simulate some processing time
    await Task.Delay(1000);

    // Log the received customer query
    logger.LogInformation("Received customer query: {customerQuery}", customerQuery);

    // Return a simple response for demonstration purposes
    var result = new CustomerQueryAnalysisResult
    {
        CustomerQuery = customerQuery,
        Emotion = emotions[random.Next(emotions.Length)],
        Intent = intents[random.Next(intents.Length)],
        Requirements = requirements[random.Next(requirements.Length)],
        Preferences = preferences[random.Next(preferences.Length)]
    };

    return result;
}
```
- This code demonstrates how MCP tools can process and categorize incoming queries.
- The `[McpServerTool]` attribute simplifies tool registration with the MCP server.
- Simulated response generation facilitates testing and development without requiring a full AI model.
- Logging provides real-time insights into server activity, crucial for debugging and monitoring.
- The use of randomization in data generation helps prototype functionality quickly.

---

### File: packages/mcp-servers/destination-recommendation/src/main/java/com/microsoft/mcp/sample/server/service/DestinationService.java
The `DestinationService` is a Java Spring Boot-based MCP server tasked with recommending travel destinations based on various criteria like activity type, budget, and season. It uses method annotations to define tools and validate inputs, showcasing the flexibility of MCP integration in Java.

#### Highlights
- `getDestinationsByActivity` provides destination recommendations based on activity type, validating inputs to ensure correctness.
- `getDestinationsByBudget` filters destinations based on budget categories, demonstrating robust input validation.
- `getAllDestinations` lists hardcoded popular destinations, serving as fallback content for generic queries.
- Helper methods validate input parameters, ensuring that invalid data does not disrupt tool execution.

#### Code
```java
@Tool(description = "Get travel destination recommendations based on preferred activity type")
public String getDestinationsByActivity(String activityType) {
    try {
        String activity = activityType.toUpperCase();
        // Validate activity type
        if (!isValidActivityType(activity)) {
            return "Invalid activity type. Please use one of: BEACH, ADVENTURE, CULTURAL, RELAXATION, URBAN_EXPLORATION, NATURE, WINTER_SPORTS";
        }
        
        return getDestinationsByPreference(activity, null, null, null);
    } catch (Exception e) {
        return "Invalid activity type. Please use one of: BEACH, ADVENTURE, CULTURAL, RELAXATION, URBAN_EXPLORATION, NATURE, WINTER_SPORTS";
    }
}
```
- Validates activity type input, ensuring data integrity and avoiding errors during tool execution.
- Converts user input to uppercase for case-insensitive comparisons, improving user experience.
- Uses predefined constants for activity types, reducing chances of typo errors in code.
- The fallback mechanism provides meaningful error messages to guide users.

---

### File: packages/mcp-servers/itinerary-planning/src/mcp_server.py
The `itinerary-planning` server, implemented in Python, generates hotel and flight suggestions using mock data. It demonstrates robust input validation, dynamic data generation, and the use of the MCP protocol for tool registration and execution.

#### Highlights
- `suggest_hotels` generates hotel recommendations based on location and stay dates, validating input to prevent logical errors.
- `suggest_flights` provides flight suggestions, including detailed information about flight segments and connections.
- `validate_iso_date` ensures date inputs follow ISO format, preventing parsing errors.
- Integration with the `FastMCP` framework simplifies MCP tool registration and execution.

#### Code
```python
@mcp.tool()
async def suggest_hotels(
    location: Annotated[str, Field(description="Location (city or area) to search for hotels")],
    check_in: Annotated[str, Field(description="Check-in date in ISO format (YYYY-MM-DD)")],
    check_out: Annotated[str, Field(description="Check-out date in ISO format (YYYY-MM-DD)")],
) -> HotelSuggestions:
    """
    Suggest hotels based on location and dates.
    """
    # Validate dates
    check_in_date = validate_iso_date(check_in, "check_in")
    check_out_date = validate_iso_date(check_out, "check_out")

    # Ensure check_out is after check_in
    if check_out_date <= check_in_date:
        raise ValueError("check_out date must be after check_in date")

    # Generate hotel data
    hotel_types = ["Luxury", "Boutique", "Budget", "Business"]
    amenities = ["Free WiFi", "Pool", "Spa", "Gym", "Restaurant", "Bar", "Room Service", "Parking"]

    hotels = [
        Hotel(
            name=f"{random.choice(hotel_types)} Hotel",
            address=fake.street_address(),
            location=location,
            rating=round(random.uniform(3.0, 5.0), 1),
            price_per_night=random.randint(80, 300),
            hotel_type=random.choice(hotel_types),
            amenities=random.sample(amenities, 5),
            available_rooms=random.randint(1, 10),
        )
        for _ in range(5)
    ]
    return HotelSuggestions(hotels=hotels)
```
- Validates check-in and check-out dates, ensuring logical consistency in user input.
- Dynamically generates hotel data for testing and prototyping purposes.
- Demonstrates the use of Python dataclasses for structured data representation.
- The `mcp.tool()` decorator integrates the function seamlessly into the MCP framework.

---

## Helpful Hints
- Note how each language leverages its native frameworks to implement MCP tool servers efficiently.
- Explore the integration of OpenTelemetry metrics for monitoring server activity in the TypeScript implementation.
- Investigate the use of method annotations in Java and Python to simplify tool registration and execution.

## Try This
Challenge yourself to deepen your understanding:

1. **Add a New Tool**: Implement a new MCP tool in any language (e.g., a weather forecasting tool) and integrate it with the existing MCP orchestrators.
   - Register the tool with the MCP server and validate its functionality using sample queries.

2. **Enhance Error Handling**: Modify the error messages in one of the servers to provide more detailed feedback about invalid inputs.
   - Use descriptive messages that guide users on how to correct their queries.

3. **Trace Data Flow**: Add logging statements to trace the flow of data through the tool servers.
   - Observe how inputs are transformed into structured responses at each stage.

---
Excellent work! Continue to the next quest to uncover more mysteries of the AI Travel Agents system.

Congratulations on successfully deploying the Polyglot MCP Tool Servers—your codebase mastery and multi-language integration prowess are leveling up like a star developer ⭐🚀⚡!

---

## Angular Frontend Streaming UI

Examine the real-time chat interface implemented in **packages/ui-angular/src/app/services/api.service.ts**, **packages/ui-angular/src/app/chat-conversation/chat-conversation.component.ts**, and **packages/ui-angular/src/app/app.component.ts**.

**Files to explore:**
- `packages/ui-angular/src/app/services/api.service.ts`
- `packages/ui-angular/src/app/chat-conversation/chat-conversation.component.ts`
- `packages/ui-angular/src/app/app.component.ts`

### Quest Content

# Quest 4: Angular Frontend Streaming UI
---
Embark on the journey to explore the Angular-powered frontend of the AI Travel Agents application. This component serves as the user interface for real-time communication and orchestrates seamless interactions with backend MCP servers. By leveraging Angular's declarative approach and the power of observables, developers can enable responsive and interactive experiences that elevate user engagement in complex workflows.

## Key Takeaways
After completing this quest, you will understand:
- 🎯 **Streaming Architecture**: How the frontend processes and displays real-time responses from MCP servers using observables.
- 🔍 **Component Interactions**: Techniques for managing state across Angular components.
- ⚡ **API Integration**: Patterns for integrating backend APIs with Angular services for scalable communication.
- 💡 **Reactive Programming**: Practical applications of RxJS for handling streaming data efficiently.

## File Exploration

### File: packages/ui-angular/src/app/services/api.service.ts
The `ApiService` acts as the primary communication layer between the Angular frontend and the backend MCP servers. It manages API requests and real-time streaming responses, leveraging Angular's `HttpClient` alongside RxJS operators to handle asynchronous data flows.

#### Highlights
- `getAvailableApiUrls`: Fetches a list of available backend APIs and their health status.
- `stream`: Manages real-time communication with MCP servers, processes streamed data, and updates the application state.
- `fetchAvailableTools`: Retrieves the list of tools available from the selected backend API to populate the UI dynamically.

#### Code
```typescript
async getAvailableApiUrls(): Promise<{ label: string; url: string, isOnline: boolean }[]> {
  return [
    {
      ...environment.apiLangChainJsServer,
      isOnline: await this.checkApiHealth(environment.apiLangChainJsServer.url),
    },
    {
      ...environment.apiLlamaIndexTsServer,
      isOnline: await this.checkApiHealth(environment.apiLlamaIndexTsServer.url),
    },
    {
      ...environment.apiMafPythonServer,
      isOnline: await this.checkApiHealth(environment.apiMafPythonServer.url),
    },
  ];
}
```
- Fetches configured backend APIs from the environment and checks their health status.
- Utilizes `fetch` to perform health checks by querying `/api/health` endpoints.
- Demonstrates defensive programming by handling errors gracefully and logging failures.

---

```typescript
stream(message: string, tools: Tools[]) {
  this.lastProcessedIndex = 0;
  this.incompleteJsonBuffer = '';

  return this.http
    .post(
      `${this.apiUrl}/api/chat`,
      { message, tools },
      { responseType: 'text', observe: 'events', reportProgress: true }
    )
    .pipe(
      filter((event: HttpEvent<string>) => event.type === HttpEventType.DownloadProgress || event.type === HttpEventType.Response),
      switchMap((event: HttpEvent<string>) => {
        const fullText = (event as HttpDownloadProgressEvent).partialText || '';
        const newData = fullText.substring(this.lastProcessedIndex);
        this.lastProcessedIndex = fullText.length;

        const dataToProcess = this.incompleteJsonBuffer + newData;
        const parts = dataToProcess.split(/\n\n+/);
        this.incompleteJsonBuffer = event.type !== HttpEventType.Response ? parts.pop() || '' : '';

        return parts.map((jsonValue: string) => {
          try {
            const parsedData = JSON.parse(jsonValue.replace(/data:\s+/, '').trim());
            return { type: event.type === HttpEventType.Response ? 'END' : 'MESSAGE', event: parsedData, id: Date.now() };
          } catch (error) {
            this.handleApiError(error, 0);
            return null;
          }
        });
      }),
      distinct(),
      catchError((error) => {
        this.handleApiError(error, 0);
        throw error;
      }),
      filter((state) => state !== null),
      startWith<any>({ type: 'START', id: Date.now() }),
    );
}
```
- Processes streamed data in chunks using `HttpEvent` and RxJS operators such as `filter`, `switchMap`, and `distinct`.
- Handles partial responses and concatenates incomplete JSON chunks for proper parsing.
- Incorporates error handling to manage issues during streaming and ensure application stability.

---

### File: packages/ui-angular/src/app/chat-conversation/chat-conversation.component.ts
The `ChatConversationComponent` is the cornerstone of the frontend chat interface, enabling users to interact with the AI Travel Agents via real-time messaging. It manages UI state, integrates with `ApiService`, and provides a responsive user experience.

#### Highlights
- `ngOnInit`: Initializes the component, fetching available tools and setting the default API URL.
- `sendMessage`: Handles user input and sends it to the backend for processing.
- `scrollToBottom`: Ensures the chat window stays scrolled to the latest message.

#### Code
```typescript
async ngOnInit() {
  this.resetChat();
  this.availableApiUrls.set(await this.chatService.fetchAvailableApiUrls());
  this.selectedApiUrl.set(this.availableApiUrls().find(api => api.isOnline)?.url || this.availableApiUrls()[0]?.url || '');
  await this.chatService.fetchAvailableTools();
}
```
- Initializes the chat by resetting the conversation, fetching available backend APIs, and setting the default API URL.
- Demonstrates the use of signals for reactive state management in Angular.
- Ensures the UI is ready for user interaction by preloading tools.

---

```typescript
@HostListener('window:keyup.shift.enter', ['$event'])
sendMessage(event: any) {
  event.preventDefault();
  this.chatService.sendMessage(event);
}
```
- Implements a keypress listener to send messages when the user presses `Shift + Enter`.
- Integrates user interaction with backend communication seamlessly.
- Highlights Angular's ability to bind DOM events to component methods.

---

```typescript
scrollToBottom() {
  this.eot()?.nativeElement.scrollIntoView({
    behavior: 'auto',
  });
}
```
- Automatically scrolls the chat window to the latest message for an improved user experience.
- Utilizes Angular's `ElementRef` to manipulate the DOM directly.

---

### File: packages/ui-angular/src/app/app.component.ts
The `AppComponent` serves as the entry point for the Angular application, bootstrapping the chat interface and providing a container for routing and global components.

#### Highlights
- `title`: Sets the application's title.
- `imports`: Demonstrates Angular's standalone component architecture for modularity.
- `RouterOutlet`: Enables routing within the application.

#### Code
```typescript
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ChatConversationComponent, ThemeToggleComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'ai-travel-agents-ui';
}
```
- Configures the root component with standalone imports for modular design.
- Integrates routing with `RouterOutlet` for navigation between views.
- Establishes the base structure of the Angular application.

---

## Helpful Hints
- Examine the `stream` method in `ApiService` to understand how streaming data is processed and displayed in real-time.
- Study the use of Angular signals in `ChatConversationComponent` for managing reactive state effectively.
- Explore the standalone component architecture in `AppComponent` to see how modularity is achieved in Angular applications.

## Try This
Challenge yourself to deepen your understanding:

1. **Add a Custom Agent Selection Interface**: Modify `ChatConversationComponent` to allow users to toggle specific agents/tools for their queries. Implement a dropdown or checklist for agent selection.
   - Example: Add a method in `ApiService` to dynamically include/exclude tools from the query payload.

2. **Enhance Error Handling**: Update the `handleApiError` method in `ApiService` to display user-friendly error messages in the UI when backend communication fails. Use Angular's `Toaster` or `AlertDialog` components for the implementation.

3. **Implement Real-Time User Feedback**: Modify `ChatConversationComponent` to show a loading spinner or skeleton preview while waiting for backend responses. Use Angular's `ChangeDetectionStrategy.OnPush` to optimize performance.

---
Excellent work! Continue to the next quest to uncover more mysteries of this modular, polyglot AI system.

Congratulations on achieving a robust implementation of the Angular Frontend Streaming UI quest—your codebase is now 60% closer to full-stack brilliance, showcasing stellar mastery in dynamic data rendering and RxJS-powered efficiency! 🚀⚡💎

---

## Multi-Provider LLM Architecture

Uncover how **packages/api-langchain-js/src/providers/index.ts**, **packages/api-langchain-js/src/providers/azure-openai.ts**, and **packages/api-langchain-js/src/providers/docker-models.ts** support multiple LLM providers and integrate them into the orchestration workflows.

**Files to explore:**
- `packages/api-langchain-js/src/providers/index.ts`
- `packages/api-langchain-js/src/providers/azure-openai.ts`
- `packages/api-langchain-js/src/providers/docker-models.ts`

### Quest Content

# Quest 5: Multi-Provider LLM Architecture
---
Within the intricate framework of the AI Travel Agents application lies a critical component—the Multi-Provider LLM Architecture. This system empowers the orchestration layers to seamlessly integrate various Large Language Models (LLMs) from providers like Azure OpenAI and Docker Models, enabling a robust and adaptable AI ecosystem. By leveraging provider-specific configurations and authentication flows, developers can utilize the best-suited LLMs for their unique use cases. Explore the code behind this modular design and uncover the secrets to building a scalable and flexible multi-provider architecture.

## Key Takeaways
After completing this quest, you will understand:
- 🎯 **Dynamic Provider Selection**: How to implement a factory pattern for selecting LLM providers at runtime based on environment configurations.
- 🔍 **Authentication Strategies**: How the application integrates provider-specific authentication methods, such as API keys and Azure AD tokens.
- ⚡ **Modular Provider Integration**: Learn how the architecture enables easy addition and management of new LLM providers.
- 💡 **Streaming APIs**: Understand how to enable streaming capabilities for real-time responses from LLMs.

## File Exploration

### File: packages/api-langchain-js/src/providers/index.ts
This file acts as the central factory for initiating the LLM provider based on environment configurations. It abstracts provider-specific details, allowing the orchestration layer to focus on agent workflows. By encapsulating multiple providers, the system achieves flexibility and extensibility, enabling developers to integrate additional providers without disrupting existing workflows.

#### Highlights
- `llm` dynamically selects and initializes the appropriate LLM provider based on the `LLM_PROVIDER` environment variable.
- Error handling ensures the system fails gracefully when an invalid provider is specified.
- Integration of multiple providers such as Azure OpenAI, Docker Models, and others allows for diverse use cases.

#### Code
```typescript
import dotenv from "dotenv";
dotenv.config();

import { llm as azureOpenAI } from "./azure-openai.js";
import { llm as foundryLocal } from "./foundry-local.js";
import { llm as githubModels } from "./github-models.js";
import { llm as dockerModels } from "./docker-models.js";
import { llm as ollamaModels } from "./ollama-models.js";

type LLMProvider =
  | "azure-openai"
  | "github-models"
  | "foundry-local"
  | "docker-models"
  | "ollama-models";

const provider = (process.env.LLM_PROVIDER || "") as LLMProvider;

export const llm = async () => {
  switch (provider) {
    case "azure-openai":
      return azureOpenAI();
    case "github-models":
      return githubModels();
    case "docker-models":
      return dockerModels();
    case "ollama-models":
      return ollamaModels();
    case "foundry-local":
      return foundryLocal();
    default:
      throw new Error(
        `Unknown LLM_PROVIDER "${provider}". Valid options are: azure-openai, github-models, foundry-local, docker-models, ollama-models.`
      );
  }
};
```
- This function demonstrates the factory pattern, routing requests to the appropriate provider based on the environment variable.
- It abstracts provider-specific details, enabling modular integration and easy swapping of LLMs.
- Error handling ensures that unsupported providers are immediately flagged, preventing runtime failures.
- The use of environment variables allows for dynamic configuration without code changes.
- This architecture encourages extensibility, where new providers can be added by simply implementing their respective modules and updating the switch statement.

---

### File: packages/api-langchain-js/src/providers/azure-openai.ts
This module implements integration with Azure OpenAI, providing authentication via Azure AD tokens or API keys depending on the deployment environment. It showcases how to securely interact with Azure services while enabling real-time streaming capabilities.

#### Highlights
- `llm` initializes Azure OpenAI using either API keys or Managed Identity Credential for authentication.
- Support for real-time streaming allows for responsive user experiences in agent workflows.
- Dynamic token provider ensures secure access to Azure Cognitive Services endpoints.

#### Code
```typescript
import { ChatOpenAI } from "@langchain/openai";
import {
  DefaultAzureCredential,
  getBearerTokenProvider,
  ManagedIdentityCredential,
} from "@azure/identity";

const AZURE_COGNITIVE_SERVICES_SCOPE =
  "https://cognitiveservices.azure.com/.default";

export const llm = async () => {
  console.log("Using Azure OpenAI");

  const isRunningInLocalDocker = process.env.IS_LOCAL_DOCKER_ENV === "true";

  if (isRunningInLocalDocker) {
    console.log(
      "Running in local Docker environment, Azure Managed Identity is not supported. Authenticating with apiKey."
    );

    const token = process.env.AZURE_OPENAI_API_KEY;
    return new ChatOpenAI({
      configuration: {
        baseURL: process.env.AZURE_OPENAI_ENDPOINT,
      },
      modelName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME ?? "gpt-5",
      streaming: true,
      useResponsesApi: true,
      apiKey: token,
      verbose: true,
    });
  }

  let credential: any = new DefaultAzureCredential();
  const clientId = process.env.AZURE_CLIENT_ID;
  if (clientId) {
    console.log("Using Azure Client ID:", clientId);
    credential = new ManagedIdentityCredential({
      clientId,
    });
  }

  const azureADTokenProvider = getBearerTokenProvider(
    credential,
    AZURE_COGNITIVE_SERVICES_SCOPE
  );

  console.log(
    "Using Azure OpenAI Endpoint:",
    process.env.AZURE_OPENAI_ENDPOINT
  );
  console.log(
    "Using Azure OpenAI Deployment Name:",
    process.env.AZURE_OPENAI_DEPLOYMENT_NAME
  );

  return new ChatOpenAI({
    configuration: {
      baseURL: process.env.AZURE_OPENAI_ENDPOINT,
    },
    modelName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME ?? "gpt-5",
    streaming: true,
    useResponsesApi: true,
    apiKey: await azureADTokenProvider(),
    verbose: true,
  });
};
```
- Demonstrates dual authentication strategies: API keys for local environments and Managed Identity Credential for production.
- Supports real-time streaming via the `useResponsesApi` option, enhancing user experience during live interactions.
- Uses `DefaultAzureCredential` and `ManagedIdentityCredential` for secure token management in Azure-hosted environments.
- Provides configuration flexibility by dynamically reading environment variables for endpoint and deployment names.
- Encourages secure coding practices by avoiding hardcoded credentials and using token providers.

---

### File: packages/api-langchain-js/src/providers/docker-models.ts
This module provides integration with Docker Models, offering a simplified setup for local deployments. It showcases the ability to use localized LLM services, making it ideal for development or edge scenarios.

#### Highlights
- `llm` initializes Docker-based LLMs using predefined API keys and endpoint configurations.
- Configuration via environment variables allows for flexible deployment setups.
- Demonstrates fallback to default model settings when environment variables are missing.

#### Code
```typescript
import { ChatOpenAI } from "@langchain/openai";

export const llm = async () => {
  console.log("Using Docker Models");
  return new ChatOpenAI({
    openAIApiKey: 'DOCKER_API_KEY',
    modelName: process.env.DOCKER_MODEL || "gpt-3.5-turbo",
    configuration: {
      baseURL: process.env.DOCKER_MODEL_ENDPOINT,
    },
    temperature: 0,
  });
};
```
- Simplifies local deployments by using Docker-based LLMs with minimal configuration requirements.
- Environment variables allow flexibility in specifying custom endpoints and model versions.
- Provides a fallback mechanism with default model settings, ensuring functionality even when configurations are incomplete.
- Demonstrates the use of a fixed API key for simplified testing and development.
- Highlights the contrast between local and cloud-based LLM integrations.

---

## Helpful Hints
- Study the factory pattern in `index.ts` to understand how dynamic provider selection is implemented.
- Compare Azure OpenAI and Docker Models configurations to see how authentication and endpoint settings differ.
- Investigate how streaming is enabled in Azure OpenAI and utilized in real-time workflows.

## Try This
Challenge yourself to deepen your understanding:

1. **Add a New Provider**: Implement a new LLM provider (e.g., Google Bard) by creating a new module in the `providers` directory. Ensure it supports environment-based configuration.
2. **Trace Provider Initialization**: Add logging statements in the `llm` functions of Azure OpenAI and Docker Models. Observe how configurations and tokens are loaded during initialization.
3. **Expand Streaming Features**: Modify the Azure OpenAI integration to handle advanced streaming options, such as partial responses or token count monitoring.

---
You have mastered all the secrets of the AI Travel Agents application! Your adventure is complete.

Congratulations on successfully deploying the Multi-Provider LLM Architecture—your codebase now stands as an 80% optimized, scalable beacon of multi-model interoperability, ready to power 🚀 robust AI-driven solutions!

---

