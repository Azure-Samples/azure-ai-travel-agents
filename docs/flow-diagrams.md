# Data Flow and Sequence Diagrams

This document provides detailed flow diagrams and sequence diagrams to illustrate how requests flow through the Azure AI Travel Agents system, from the UI to the API, and through the AI agent integrations with MCP servers.

## Request Flow Diagrams

### 1. High-Level System Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User      │    │ Angular UI  │    │  Express API    │    │ LlamaIndex      │
│             │    │             │    │                 │    │ Orchestrator    │
└─────┬───────┘    └──────┬──────┘    └────────┬────────┘    └────────┬────────┘
      │                   │                    │                      │
      │ 1. Travel Query   │                    │                      │
      ├──────────────────►│                    │                      │
      │                   │ 2. POST /api/chat  │                      │
      │                   ├───────────────────►│                      │
      │                   │                    │ 3. Setup Agents     │
      │                   │                    ├─────────────────────►│
      │                   │                    │                      │
      │                   │ 4. SSE Stream      │ 5. Agent Processing  │
      │ 6. Real-time      │◄───────────────────┤◄─────────────────────┤
      │    Updates        │                    │                      │
      ◄───────────────────┤                    │                      │
      │                   │                    │                      │
```

### 2. MCP Server Integration Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Specialized     │    │   MCP Client    │    │   MCP Server    │    │ External APIs/  │
│ Agent           │    │                 │    │                 │    │ Services        │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                      │                      │
         │ 1. Tool Call Request │                      │                      │
         ├─────────────────────►│                      │                      │
         │                      │ 2. HTTP/SSE Request  │                      │
         │                      ├─────────────────────►│                      │
         │                      │                      │ 3. External API Call│
         │                      │                      ├─────────────────────►│
         │                      │                      │ 4. API Response      │
         │                      │                      ◄─────────────────────┤
         │                      │ 5. Processed Result  │                      │
         │ 6. Tool Response     ◄─────────────────────┤                      │
         ◄─────────────────────┤                      │                      │
         │                      │                      │                      │
```

### 3. Multi-Agent Collaboration Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Triage    │    │ Customer    │    │Destination  │    │ Itinerary   │
│   Agent     │    │ Query Agent │    │Recommendation│    │ Planning    │
│             │    │             │    │   Agent     │    │   Agent     │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │                  │
       │ 1. Analyze Query │                  │                  │
       │                  │                  │                  │
       │ 2. Extract       │                  │                  │
       │    Preferences   │                  │                  │
       ├─────────────────►│                  │                  │
       │ 3. Preferences   │                  │                  │
       ◄─────────────────┤                  │                  │
       │                  │                  │                  │
       │ 4. Get           │                  │                  │
       │    Recommendations                  │                  │
       ├────────────────────────────────────►│                  │
       │ 5. Destinations  │                  │                  │
       ◄────────────────────────────────────┤                  │
       │                  │                  │                  │
       │ 6. Plan Itinerary│                  │                  │
       ├───────────────────────────────────────────────────────►│
       │ 7. Complete Plan │                  │                  │
       ◄───────────────────────────────────────────────────────┤
       │                  │                  │                  │
```

## Detailed Sequence Diagrams

### 1. Complete User Journey

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Angular UI
    participant API as Express API
    participant LI as LlamaIndex
    participant TA as Triage Agent
    participant CQA as Customer Query Agent
    participant DRA as Destination Rec Agent
    participant IPA as Itinerary Planning Agent
    participant WSA as Web Search Agent
    participant MCPCQ as MCP Customer Query
    participant MCPDR as MCP Destination Rec
    participant MCPIP as MCP Itinerary Plan
    participant MCPWS as MCP Web Search
    participant BING as Bing Search API
    participant AOAI as Azure OpenAI

    U->>UI: Enter travel query "Plan 7-day Japan trip"
    UI->>UI: Validate input and selected tools
    UI->>API: POST /api/chat {message, tools}
    
    API->>API: Validate request
    API->>LI: setupAgents(filteredTools)
    
    LI->>TA: Initialize Triage Agent
    LI->>CQA: Initialize Customer Query Agent  
    LI->>DRA: Initialize Destination Rec Agent
    LI->>IPA: Initialize Itinerary Planning Agent
    LI->>WSA: Initialize Web Search Agent
    
    API->>TA: process("Plan 7-day Japan trip")
    API-->>UI: SSE: AgentSetup event
    
    TA->>TA: Analyze query complexity
    TA->>CQA: handoff(extract preferences)
    API-->>UI: SSE: AgentHandoff event
    
    CQA->>MCPCQ: callTool("extract_preferences", query)
    MCPCQ->>AOAI: Process NLP request
    AOAI-->>MCPCQ: Extracted preferences
    MCPCQ-->>CQA: {duration: 7, destination: "Japan", interests: [...]}
    CQA-->>TA: return preferences
    API-->>UI: SSE: AgentOutput event
    
    TA->>DRA: handoff(recommend destinations, preferences)
    DRA->>MCPDR: callTool("recommend", preferences)
    MCPDR->>AOAI: Generate recommendations
    AOAI-->>MCPDR: Destination recommendations
    MCPDR-->>DRA: [Tokyo, Kyoto, Osaka] with details
    DRA-->>TA: return recommendations
    API-->>UI: SSE: AgentStream event (partial results)
    
    TA->>WSA: handoff(search current travel info)
    WSA->>MCPWS: callTool("search", "Japan travel 2024")
    MCPWS->>BING: Search API request
    BING-->>MCPWS: Current travel information
    MCPWS-->>WSA: Processed search results
    WSA-->>TA: return current info
    API-->>UI: SSE: AgentStream event
    
    TA->>IPA: handoff(create itinerary, destinations + preferences)
    IPA->>MCPIP: callTool("plan_itinerary", full_context)
    MCPIP->>AOAI: Generate detailed itinerary
    AOAI-->>MCPIP: Day-by-day itinerary
    MCPIP-->>IPA: Complete 7-day itinerary
    IPA-->>TA: return final itinerary
    
    TA->>API: Final consolidated response
    API-->>UI: SSE: AgentOutput final event
    API-->>UI: SSE: END event
    UI->>UI: Display complete travel plan
    UI-->>U: Show final itinerary
```

### 2. MCP Tool Communication Pattern

```mermaid
sequenceDiagram
    participant Agent
    participant MCPClient as MCP Client
    participant MCPServer as MCP Server
    participant ExtAPI as External API
    participant Cache as Response Cache

    Agent->>MCPClient: callTool("search_destinations", params)
    
    MCPClient->>MCPClient: Validate parameters
    MCPClient->>MCPServer: HTTP POST /mcp/call
    Note right of MCPClient: Request includes tool name,<br/>parameters, and context
    
    MCPServer->>MCPServer: Parse request & validate
    
    alt Cache Hit
        MCPServer->>Cache: Check cache
        Cache-->>MCPServer: Cached result
    else Cache Miss
        MCPServer->>ExtAPI: External API call
        ExtAPI-->>MCPServer: API response
        MCPServer->>Cache: Store result
    end
    
    MCPServer->>MCPServer: Process & format response
    MCPServer-->>MCPClient: Tool result + metadata
    
    MCPClient->>MCPClient: Validate response
    MCPClient-->>Agent: Formatted tool result
    
    Note over Agent,ExtAPI: Error handling occurs at each step<br/>with appropriate fallbacks
```

### 3. Agent Handoff and Coordination

```mermaid
sequenceDiagram
    participant TA as Triage Agent
    participant LI as LlamaIndex Orchestrator  
    participant SA as Specialized Agent
    participant MT as MCP Tools
    participant Mon as Monitoring

    TA->>LI: requestHandoff("DestinationAgent", context)
    LI->>Mon: Trace: handoff_initiated
    
    LI->>LI: Validate handoff target
    LI->>SA: activate(context, tools)
    SA->>Mon: Trace: agent_activated
    
    SA->>SA: Process assigned task
    
    loop Tool Execution
        SA->>MT: callTool(toolName, params)
        MT-->>SA: tool_result
        SA->>Mon: Trace: tool_executed
    end
    
    SA->>SA: Compile results
    SA->>LI: taskComplete(results, metadata)
    LI->>Mon: Trace: task_completed
    
    LI-->>TA: handoffResult(results)
    TA->>Mon: Trace: handoff_completed
    
    Note over TA,Mon: All interactions are traced<br/>for observability and debugging
```

### 4. Error Handling and Recovery

```mermaid
sequenceDiagram
    participant UI
    participant API
    participant Agent
    participant MCPServer
    participant ExtAPI

    UI->>API: POST /api/chat
    API->>Agent: process(query)
    
    Agent->>MCPServer: callTool(params)
    MCPServer->>ExtAPI: API request
    
    ExtAPI-->>MCPServer: Error response (500)
    MCPServer->>MCPServer: Handle API error
    
    alt Retry Strategy
        MCPServer->>ExtAPI: Retry request
        ExtAPI-->>MCPServer: Success response
        MCPServer-->>Agent: Tool result
    else Fallback Strategy  
        MCPServer->>MCPServer: Use cached/default data
        MCPServer-->>Agent: Fallback result + warning
    else Fatal Error
        MCPServer-->>Agent: Error response
        Agent->>Agent: Handle tool error
        Agent-->>API: Partial results + error info
    end
    
    API-->>UI: SSE response (success or error)
    UI->>UI: Display results or error message
```

### 5. Real-time Streaming Response

```mermaid
sequenceDiagram
    participant UI
    participant API  
    participant Agent
    participant MCP

    UI->>API: POST /api/chat (start stream)
    API->>API: Setup SSE connection
    API-->>UI: SSE: Connection established
    
    API->>Agent: Begin processing
    
    loop Processing Steps
        Agent->>MCP: Tool call
        MCP-->>Agent: Partial result
        Agent->>API: Emit progress event
        API-->>UI: SSE: Progress update
        UI->>UI: Update interface progressively
    end
    
    Agent->>Agent: Finalize response
    Agent->>API: Emit final result
    API-->>UI: SSE: Final result
    API-->>UI: SSE: Stream end
    UI->>UI: Display complete response
```

## Integration Patterns

### 1. Synchronous vs Asynchronous Processing

```mermaid
graph TD
    A[User Query] --> B{Query Complexity}
    
    B -->|Simple| C[Synchronous Processing]
    B -->|Complex| D[Asynchronous Processing]
    
    C --> E[Single Agent]
    E --> F[Direct MCP Call]
    F --> G[Immediate Response]
    
    D --> H[Multi-Agent Workflow]
    H --> I[Parallel Processing]
    H --> J[Sequential Processing]
    
    I --> K[Concurrent MCP Calls]
    J --> L[Dependent MCP Calls]
    
    K --> M[Result Aggregation]
    L --> M
    M --> N[Streaming Response]
```

### 2. Tool Selection and Routing

```mermaid
graph TD
    A[Incoming Query] --> B[Triage Agent Analysis]
    
    B --> C{Query Intent}
    
    C -->|Destination| D[Destination Recommendation]
    C -->|Planning| E[Itinerary Planning]  
    C -->|Information| F[Web Search]
    C -->|Complex Logic| G[Code Evaluation]
    C -->|Custom Model| H[Model Inference]
    
    D --> I[MCP Destination Server]
    E --> J[MCP Itinerary Server]
    F --> K[MCP Web Search Server]
    G --> L[MCP Code Eval Server]
    H --> M[MCP Model Server]
    
    I --> N[Response Synthesis]
    J --> N
    K --> N
    L --> N
    M --> N
    
    N --> O[Final Response]
```

### 3. Error Recovery Strategies

```mermaid
graph TD
    A[Tool Call] --> B{MCP Server Response}
    
    B -->|Success| C[Process Result]
    B -->|Timeout| D[Retry Strategy]
    B -->|Error 5xx| E[Fallback Strategy]
    B -->|Error 4xx| F[Input Validation]
    
    D --> G{Retry Count}
    G -->|< Max| H[Exponential Backoff]
    G -->|>= Max| I[Fallback Strategy]
    
    H --> A
    
    E --> J[Use Cached Data]
    E --> K[Alternative Tool]
    E --> L[Graceful Degradation]
    
    F --> M[Error Response]
    
    C --> N[Success Response]
    I --> O[Partial Response]
    J --> O
    K --> O
    L --> O
    M --> P[Error Response]
    
    N --> Q[Continue Processing]
    O --> Q
    P --> R[Stop Processing]
```

### 4. Monitoring and Observability Flow

```mermaid
graph TD
    A[Request Start] --> B[Create Trace Context]
    
    B --> C[API Span]
    C --> D[Agent Orchestration Span]
    
    D --> E[Agent Processing Spans]
    E --> F[MCP Tool Call Spans]
    F --> G[External API Spans]
    
    G --> H[Response Processing Spans]
    H --> I[Result Aggregation Span]
    I --> J[Response Streaming Span]
    
    J --> K[Request Complete]
    
    C --> L[Metrics Collection]
    E --> L
    F --> L
    G --> L
    
    L --> M[Aspire Dashboard]
    
    B --> N[Error Tracking]
    D --> N
    E --> N
    F --> N
    
    N --> O[Error Aggregation]
    O --> M
```

These diagrams provide a comprehensive view of how data flows through the Azure AI Travel Agents system, illustrating the complex interactions between components and the various patterns used for communication, error handling, and monitoring.