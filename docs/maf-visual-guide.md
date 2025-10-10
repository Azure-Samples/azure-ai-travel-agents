# MAF Orchestration Visual Guide

This document provides visual diagrams to help understand the Microsoft Agent Framework (MAF) orchestration architecture.

## Table of Contents
1. [Current vs Proposed Architecture](#current-vs-proposed-architecture)
2. [MAF Component Architecture](#maf-component-architecture)
3. [Agent Workflow Patterns](#agent-workflow-patterns)
4. [Migration Strategy](#migration-strategy)
5. [Directory Structure](#directory-structure)

## Current vs Proposed Architecture

### Current Architecture (LlamaIndex.TS)

```mermaid
flowchart TB
    subgraph Frontend["Frontend - Angular - Port 4200"]
        UI[Angular UI]
    end
    
    subgraph API["TypeScript API - Express.js - Port 4000"]
        subgraph LLAMA["LlamaIndex.TS Orchestration Layer"]
            subgraph AGENTS["Multi-Agent Workflow"]
                TA[TravelAgent<br/>Triage/Root]
                CQA[CustomerQueryAgent]
                DRA[DestinationRecommendationAgent]
                IPA[ItineraryPlanningAgent]
                CEA[CodeEvaluationAgent]
                MIA[ModelInferenceAgent]
                WSA[WebSearchAgent]
                EA[EchoAgent]
            end
            subgraph MCP_CLIENT["MCP Client Integration"]
                HTTP[HTTP MCP Client<br/>TypeScript]
                SSE[SSE MCP Client<br/>TypeScript]
            end
        end
    end
    
    subgraph TOOLS["MCP Tool Servers"]
        CQ[Customer Query<br/>C#/.NET<br/>Port 5001]
        DR[Destination Recommend<br/>Java<br/>Port 5002]
        IP[Itinerary Planning<br/>Python<br/>Port 5003]
        CE[Code Eval<br/>Python<br/>Port 5004]
        MI[Model Inference<br/>Python<br/>Port 5005]
        WS[Web Search<br/>TypeScript<br/>Port 5006]
    end
    
    UI -->|HTTP/SSE| API
    LLAMA -->|MCP Protocol| TOOLS
```

### Proposed Architecture (MAF)

```mermaid
flowchart TB
    subgraph Frontend["Frontend - Angular - Port 4200 - No changes required"]
        UI[Angular UI]
    end
    
    subgraph API["Python API - FastAPI + Uvicorn - Port 4000"]
        subgraph MAF["Microsoft Agent Framework Orchestration Layer"]
            subgraph ENGINE["MAF Workflow Engine"]
                COORD[Multi-agent coordination]
                STATE[State management]
                HANDOFF[Agent handoff orchestration]
                EXEC[Parallel/Sequential execution]
            end
            subgraph AGENTS["MAF Agents"]
                TA[TriageAgent<br/>Root]
                CQA[CustomerQueryAgent]
                DRA[DestinationRecommendationAgent]
                IPA[ItineraryPlanningAgent]
                CEA[CodeEvaluationAgent]
                MIA[ModelInferenceAgent]
                WSA[WebSearchAgent]
                EA[EchoAgent]
            end
            subgraph MCP_CLIENT["MCP Client Integration - Python"]
                HTTP[HTTP MCP Client<br/>httpx]
                SSE[SSE MCP Client<br/>async]
                REGISTRY[Tool Registry]
            end
        end
    end
    
    subgraph TOOLS["MCP Tool Servers - No changes required"]
        CQ[Customer Query<br/>C#/.NET<br/>Port 5001]
        DR[Destination Recommend<br/>Java<br/>Port 5002]
        IP[Itinerary Planning<br/>Python<br/>Port 5003]
        CE[Code Eval<br/>Python<br/>Port 5004]
        MI[Model Inference<br/>Python<br/>Port 5005]
        WS[Web Search<br/>TypeScript<br/>Port 5006]
    end
    
    UI -->|HTTP/SSE<br/>Same API contract| API
    MAF -->|MCP Protocol<br/>Same as current| TOOLS
```

**Key Changes**:
- ✅ Replace Express.js → FastAPI
- ✅ Replace LlamaIndex.TS → Microsoft Agent Framework
- ✅ Replace TypeScript → Python
- ✅ Keep same API contract (no UI changes)
- ✅ Keep same MCP tool servers (no changes)

## MAF Component Architecture

```mermaid
flowchart TB
    subgraph APIPYTHON["src/api-python/"]
        MAIN[main.py - FastAPI App<br/>• Endpoints: /api/health, /api/chat, /api/tools<br/>• SSE Streaming<br/>• CORS Configuration]
        
        WORKFLOW[orchestrator/workflow.py<br/>• TravelWorkflow Class<br/>• Agent Initialization<br/>• Workflow Execution<br/>• Tool Filtering]
        
        subgraph AGENTS_DIR["orchestrator/agents/"]
            BASE_A[base.py]
            TRIAGE[triage_agent.py]
            CQ_A[customer_query_agent.py]
            DEST_A[destination_agent.py]
            ITIN_A[itinerary_agent.py]
            CODE_A[code_eval_agent.py]
            MODEL_A[model_inference_agent.py]
            WEB_A[web_search_agent.py]
            ECHO_A[echo_agent.py]
        end
        
        subgraph TOOLS_DIR["orchestrator/tools/"]
            MCP_BASE[mcp_client.py - base]
            HTTP_C[http_client.py]
            SSE_C[sse_client.py]
            REGISTRY_T[tool_registry.py]
            NOTE_T[Handles MCP protocol<br/>communication]
        end
        
        CONFIG[config.py<br/>• Settings - Pydantic<br/>• Environment Variables<br/>• Azure OpenAI Config<br/>• MCP Server URLs]
        
        subgraph UTILS["utils/"]
            TELEM[telemetry.py<br/>OpenTelemetry]
            STREAM[streaming.py<br/>SSE utilities]
            LOG[logging.py<br/>Structured logging]
        end
        
        MAIN --> WORKFLOW
        WORKFLOW --> AGENTS_DIR
        WORKFLOW --> TOOLS_DIR
        MAIN --> CONFIG
        MAIN --> UTILS
    end
```

## Agent Workflow Patterns

### Sequential Workflow

```mermaid
flowchart TD
    UQ[User Query:<br/>'I want to plan a 7-day trip to Japan']
    
    TA[Triage Agent<br/>Analyzes intent → 'itinerary planning']
    
    CQA[Customer Query Agent<br/>Extracts preferences:<br/>• Duration: 7 days<br/>• Destination: Japan<br/>• Budget: Not specified]
    
    DRA[Destination Recommendation Agent<br/>Recommends:<br/>• Tokyo - 3 days<br/>• Kyoto - 2 days<br/>• Osaka - 2 days]
    
    IPA[Itinerary Planning Agent<br/>Creates detailed itinerary:<br/>• Day-by-day activities<br/>• Travel routes<br/>• Accommodation suggestions]
    
    FR[Final Response]
    
    UQ --> TA --> CQA --> DRA --> IPA --> FR
```

### Parallel Workflow

```mermaid
flowchart TD
    UQ[User Query:<br/>'What are the best beach destinations in Europe?']
    
    TA[Triage Agent<br/>Decides parallel execution]
    
    DRA[Destination Recommendation Agent<br/>Returns:<br/>• Santorini<br/>• Amalfi Coast<br/>• Algarve]
    
    WSA[Web Search Agent<br/>Search for:<br/>• Current weather<br/>• Travel deals<br/>• Events]
    
    CEA[Code Evaluation Agent<br/>Calculate:<br/>• Best time<br/>• Price ranges]
    
    COMBINE[Combine Results<br/>• Destinations<br/>• Current info<br/>• Price analysis]
    
    FR[Final Response]
    
    UQ --> TA
    TA --> DRA
    TA --> WSA
    TA --> CEA
    DRA --> COMBINE
    WSA --> COMBINE
    CEA --> COMBINE
    COMBINE --> FR
```

### Conditional Workflow with Agent Handoff

```mermaid
flowchart TD
    UQ[User Query:<br/>Various queries]
    
    TA[Triage Agent<br/>Analyzes Intent]
    
    DRA[Destination Agent<br/>Intent: 'search']
    CEA[Code Eval Agent<br/>Intent: 'calculate']
    EA[Echo Agent<br/>Intent: 'echo']
    
    UQ --> TA
    TA -->|search| DRA
    TA -->|calculate| CEA
    TA -->|echo| EA
```

## Migration Strategy

### Parallel Deployment Approach

```mermaid
gantt
    title Migration Timeline
    dateFormat  YYYY-MM-DD
    axisFormat  Week %W
    
    section Foundation
    Build & test (Python API)     :w0, 2025-01-01, 2w
    
    section Development
    Development (Python API)       :w3, 2025-01-15, 6w
    
    section Testing
    Internal testing (Python API)  :w9, 2025-02-26, 4w
    
    section Rollout
    10% traffic to Python          :w13, 2025-03-26, 3w
    50% traffic to Python          :w16, 2025-04-16, 2w
    
    section Completion
    100% traffic to Python         :w18, 2025-04-30, 1w
    Deprecate TypeScript API       :w19, 2025-05-07, 2w
```

**Traffic Distribution by Phase:**

```mermaid
graph LR
    subgraph "Week 0-2: Foundation"
        TS1[TS API: 100%]
        PY1[Python API: Build & Test]
    end
    
    subgraph "Week 13-15: Gradual"
        TS2[TS API: 90%]
        PY2[Python API: 10%]
    end
    
    subgraph "Week 16-17: Balanced"
        TS3[TS API: 50%]
        PY3[Python API: 50%]
    end
    
    subgraph "Week 18+: Complete"
        PY4[Python API: 100%]
    end
```

## Directory Structure

### Current Structure
```
src/
├── api/                          # TypeScript API
│   ├── src/
│   │   ├── index.ts             # Express server
│   │   ├── mcp/                 # MCP clients
│   │   │   ├── mcp-http-client.ts
│   │   │   ├── mcp-sse-client.ts
│   │   │   └── mcp-tools.ts
│   │   └── orchestrator/
│   │       └── llamaindex/      # LlamaIndex.TS
│   │           ├── index.ts     # Agent setup
│   │           ├── providers/   # LLM providers
│   │           └── tools/       # Tool config
│   ├── package.json
│   └── tsconfig.json
├── tools/                        # MCP servers
│   ├── customer-query/          # C#/.NET
│   ├── destination-recommendation/ # Java
│   ├── itinerary-planning/      # Python
│   ├── code-evaluation/         # Python
│   ├── model-inference/         # Python
│   ├── web-search/              # TypeScript
│   └── echo-ping/               # TypeScript
└── ui/                          # Angular frontend
```

### Proposed Structure (Parallel)
```
src/
├── api/                          # TypeScript API (existing)
│   └── ...
├── api-python/                   # NEW: Python API
│   ├── src/
│   │   ├── main.py              # FastAPI server
│   │   ├── config.py            # Configuration
│   │   ├── orchestrator/        # MAF orchestration
│   │   │   ├── __init__.py
│   │   │   ├── workflow.py      # Workflow engine
│   │   │   ├── agents/          # Agent implementations
│   │   │   │   ├── __init__.py
│   │   │   │   ├── base.py
│   │   │   │   ├── triage_agent.py
│   │   │   │   ├── customer_query_agent.py
│   │   │   │   ├── destination_agent.py
│   │   │   │   ├── itinerary_agent.py
│   │   │   │   ├── code_eval_agent.py
│   │   │   │   ├── model_inference_agent.py
│   │   │   │   ├── web_search_agent.py
│   │   │   │   └── echo_agent.py
│   │   │   └── tools/           # MCP client integration
│   │   │       ├── __init__.py
│   │   │       ├── mcp_client.py
│   │   │       ├── http_client.py
│   │   │       ├── sse_client.py
│   │   │       └── tool_registry.py
│   │   ├── api/                 # API routes
│   │   │   ├── __init__.py
│   │   │   ├── chat.py
│   │   │   ├── tools.py
│   │   │   └── health.py
│   │   └── utils/               # Utilities
│   │       ├── __init__.py
│   │       ├── telemetry.py
│   │       ├── streaming.py
│   │       └── logging.py
│   ├── tests/                   # Test files
│   │   ├── __init__.py
│   │   ├── test_agents.py
│   │   ├── test_workflow.py
│   │   └── test_api.py
│   ├── pyproject.toml           # Python dependencies
│   ├── Dockerfile               # Container config
│   └── .env.sample              # Environment template
├── tools/                        # MCP servers (no changes)
│   └── ...
└── ui/                          # Angular frontend (no changes)
```

## Technology Stack Comparison

```mermaid
graph LR
    subgraph CURRENT["Current - LlamaIndex.TS"]
        direction TB
        CL[Language: TypeScript]
        CR[Runtime: Node.js 22+]
        CW[Web Framework: Express.js 5.0]
        CA[Agent Framework: LlamaIndex.TS 0.10.3]
        CM[MCP Client: @llamaindex/tools 0.1.2]
        CT[Type System: TypeScript]
        CP[Package Manager: npm]
        CC[Config: .env + dotenv]
        CO[Observability: OpenTelemetry]
    end
    
    CURRENT -->|MIGRATION| PROPOSED
    
    subgraph PROPOSED["Proposed - Microsoft Agent Framework"]
        direction TB
        PL[Language: Python 3.12+]
        PR[Runtime: Python]
        PW[Web Framework: FastAPI + Uvicorn]
        PA[Agent Framework: agent-framework - MAF]
        PM[MCP Client: Custom - httpx-based]
        PT[Type System: Pydantic]
        PP[Package Manager: pip]
        PC[Config: .env + pydantic-settings]
        PO[Observability: OpenTelemetry]
    end
```

## Request Flow Comparison

### Current Flow (LlamaIndex.TS)
```mermaid
flowchart TD
    A[1. User Input → Angular UI]
    B[2. HTTP POST → Express.js Server :4000]
    C[3. setupAgents - Creates LlamaIndex agents]
    D[4. multiAgent.run - Executes workflow]
    E[5. Triage Agent → Analyzes query]
    F[6. Specialized Agents → Process tasks]
    G[7. MCP Clients → Call tool servers]
    H[8. Response Stream → SSE to UI]
    I[9. UI Update → Display results]
    
    A --> B --> C --> D --> E --> F --> G --> H --> I
```

### Proposed Flow (MAF)
```mermaid
flowchart TD
    A[1. User Input → Angular UI]
    B[2. HTTP POST → FastAPI Server :4000]
    C[3. TravelWorkflow.run - Executes MAF workflow]
    D[4. Triage Agent → Analyzes query]
    E[5. Specialized Agents → Process tasks]
    F[6. MCP Clients → Call tool servers]
    G[7. Response Stream → SSE to UI]
    H[8. UI Update → Display results]
    
    A --> B --> C --> D --> E --> F --> G --> H
```

**Note**: The flow is essentially identical from the UI perspective!

## Benefits Summary

```mermaid
mindmap
  root((MAF Migration<br/>Benefits))
    Native Azure AI
      Better Azure OpenAI support
      Azure AI Services integration
      Managed Identity support
    Python AI/ML Ecosystem
      scikit-learn, pandas, numpy
      Better ML library support
      Jupyter notebooks integration
    Microsoft Backing
      Long-term support guaranteed
      Regular updates
      Enterprise-grade reliability
    Modern Agent Patterns
      Latest agent architecture
      Advanced workflow capabilities
      Built-in state management
    Performance
      FastAPI high performance
      Async/await throughout
      Efficient resource usage
    Type Safety
      Pydantic data validation
      Strong type hints
      Runtime validation
```

## Next Steps

1. **Review Documentation**
   - Read [MAF-README.md](./MAF-README.md) for complete overview
   - Study [maf-orchestration-design.md](./maf-orchestration-design.md) for architecture
   - Review [maf-migration-plan.md](./maf-migration-plan.md) for timeline

2. **Make Decision**
   - Stay with LlamaIndex.TS
   - Migrate to MAF
   - Parallel deployment (recommended)

3. **Begin Implementation**
   - Follow [maf-implementation-guide.md](./maf-implementation-guide.md)
   - Use [maf-quick-reference.md](./maf-quick-reference.md) for coding

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-02  
**Status**: Planning Complete
