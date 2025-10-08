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

```
┌──────────────────────────────────────────────────────────────┐
│                      Frontend (Angular)                       │
│                    Port: 4200 (Development)                   │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTP/SSE
┌───────────────────────────▼──────────────────────────────────┐
│              TypeScript API (Express.js)                      │
│                      Port: 4000                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │         LlamaIndex.TS Orchestration Layer              │  │
│  │                                                         │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │ Multi-Agent Workflow                             │  │  │
│  │  │  • TravelAgent (Triage/Root)                     │  │  │
│  │  │  • CustomerQueryAgent                            │  │  │
│  │  │  • DestinationRecommendationAgent                │  │  │
│  │  │  • ItineraryPlanningAgent                        │  │  │
│  │  │  • CodeEvaluationAgent                           │  │  │
│  │  │  • ModelInferenceAgent                           │  │  │
│  │  │  • WebSearchAgent                                │  │  │
│  │  │  • EchoAgent                                     │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │ MCP Client Integration                           │  │  │
│  │  │  • HTTP MCP Client (TypeScript)                  │  │  │
│  │  │  • SSE MCP Client (TypeScript)                   │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────────────────┬──────────────────────────────────┘
                            │ MCP Protocol
┌───────────────────────────▼──────────────────────────────────┐
│                    MCP Tool Servers                           │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐   │
│  │ Customer   │  │ Destination│  │ Itinerary Planning   │   │
│  │ Query      │  │ Recommend  │  │ (Python)             │   │
│  │ (C#/.NET)  │  │ (Java)     │  │ Port: 5003           │   │
│  │ Port: 5001 │  │ Port: 5002 │  └──────────────────────┘   │
│  └────────────┘  └────────────┘                              │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐   │
│  │ Code Eval  │  │ Model      │  │ Web Search           │   │
│  │ (Python)   │  │ Inference  │  │ (TypeScript)         │   │
│  │ Port: 5004 │  │ (Python)   │  │ Port: 5006           │   │
│  │            │  │ Port: 5005 │  └──────────────────────┘   │
│  └────────────┘  └────────────┘                              │
└───────────────────────────────────────────────────────────────┘
```

### Proposed Architecture (MAF)

```
┌──────────────────────────────────────────────────────────────┐
│                      Frontend (Angular)                       │
│                    Port: 4200 (Development)                   │
│                    (No changes required)                      │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTP/SSE (Same API contract)
┌───────────────────────────▼──────────────────────────────────┐
│              Python API (FastAPI + Uvicorn)                   │
│                      Port: 4000                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │    Microsoft Agent Framework Orchestration Layer       │  │
│  │                                                         │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │ MAF Workflow Engine                              │  │  │
│  │  │  • Multi-agent coordination                      │  │  │
│  │  │  • State management                              │  │  │
│  │  │  • Agent handoff orchestration                   │  │  │
│  │  │  • Parallel/Sequential execution                 │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │ MAF Agents                                       │  │  │
│  │  │  • TriageAgent (Root)                            │  │  │
│  │  │  • CustomerQueryAgent                            │  │  │
│  │  │  • DestinationRecommendationAgent                │  │  │
│  │  │  • ItineraryPlanningAgent                        │  │  │
│  │  │  • CodeEvaluationAgent                           │  │  │
│  │  │  • ModelInferenceAgent                           │  │  │
│  │  │  • WebSearchAgent                                │  │  │
│  │  │  • EchoAgent                                     │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │ MCP Client Integration (Python)                  │  │  │
│  │  │  • HTTP MCP Client (httpx)                       │  │  │
│  │  │  • SSE MCP Client (async)                        │  │  │
│  │  │  • Tool Registry                                 │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────────────────┬──────────────────────────────────┘
                            │ MCP Protocol (Same as current)
┌───────────────────────────▼──────────────────────────────────┐
│                    MCP Tool Servers                           │
│                    (No changes required)                      │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐   │
│  │ Customer   │  │ Destination│  │ Itinerary Planning   │   │
│  │ Query      │  │ Recommend  │  │ (Python)             │   │
│  │ (C#/.NET)  │  │ (Java)     │  │ Port: 5003           │   │
│  │ Port: 5001 │  │ Port: 5002 │  └──────────────────────┘   │
│  └────────────┘  └────────────┘                              │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐   │
│  │ Code Eval  │  │ Model      │  │ Web Search           │   │
│  │ (Python)   │  │ Inference  │  │ (TypeScript)         │   │
│  │ Port: 5004 │  │ (Python)   │  │ Port: 5006           │   │
│  │            │  │ Port: 5005 │  └──────────────────────┘   │
│  └────────────┘  └────────────┘                              │
└───────────────────────────────────────────────────────────────┘
```

**Key Changes**:
- ✅ Replace Express.js → FastAPI
- ✅ Replace LlamaIndex.TS → Microsoft Agent Framework
- ✅ Replace TypeScript → Python
- ✅ Keep same API contract (no UI changes)
- ✅ Keep same MCP tool servers (no changes)

## MAF Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    src/api-python/                               │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    main.py (FastAPI App)                    │ │
│  │  • Endpoints: /api/health, /api/chat, /api/tools          │ │
│  │  • SSE Streaming                                            │ │
│  │  • CORS Configuration                                       │ │
│  └──────────────────────┬──────────────────────────────────────┘ │
│                         │                                        │
│  ┌──────────────────────▼──────────────────────────────────────┐ │
│  │              orchestrator/workflow.py                       │ │
│  │  • TravelWorkflow Class                                     │ │
│  │  • Agent Initialization                                     │ │
│  │  • Workflow Execution                                       │ │
│  │  • Tool Filtering                                           │ │
│  └──────────┬──────────────────────────┬───────────────────────┘ │
│             │                          │                         │
│  ┌──────────▼────────────┐  ┌──────────▼──────────────────────┐ │
│  │   orchestrator/       │  │   orchestrator/                 │ │
│  │   agents/             │  │   tools/                        │ │
│  │                       │  │                                 │ │
│  │  • base.py            │  │  • mcp_client.py (base)        │ │
│  │  • triage_agent.py    │  │  • http_client.py              │ │
│  │  • customer_query_    │  │  • sse_client.py               │ │
│  │    agent.py           │  │  • tool_registry.py            │ │
│  │  • destination_       │  │                                 │ │
│  │    agent.py           │  │  Handles MCP protocol          │ │
│  │  • itinerary_agent.py │  │  communication                  │ │
│  │  • code_eval_agent.py │  │                                 │ │
│  │  • model_inference_   │  │                                 │ │
│  │    agent.py           │  │                                 │ │
│  │  • web_search_agent.py│  │                                 │ │
│  │  • echo_agent.py      │  │                                 │ │
│  └───────────────────────┘  └─────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    config.py                                │ │
│  │  • Settings (Pydantic)                                      │ │
│  │  • Environment Variables                                    │ │
│  │  • Azure OpenAI Config                                      │ │
│  │  • MCP Server URLs                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    utils/                                   │ │
│  │  • telemetry.py (OpenTelemetry)                            │ │
│  │  • streaming.py (SSE utilities)                            │ │
│  │  • logging.py (Structured logging)                         │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Agent Workflow Patterns

### Sequential Workflow

```
User Query: "I want to plan a 7-day trip to Japan"

┌─────────────┐
│ User Query  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  Triage Agent       │  Analyzes intent → "itinerary planning"
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Customer Query      │  Extracts preferences:
│ Agent               │  • Duration: 7 days
└──────┬──────────────┘  • Destination: Japan
       │                 • Budget: Not specified
       ▼
┌─────────────────────┐
│ Destination         │  Recommends:
│ Recommendation      │  • Tokyo (3 days)
│ Agent               │  • Kyoto (2 days)
└──────┬──────────────┘  • Osaka (2 days)
       │
       ▼
┌─────────────────────┐
│ Itinerary Planning  │  Creates detailed itinerary:
│ Agent               │  • Day-by-day activities
└──────┬──────────────┘  • Travel routes
       │                 • Accommodation suggestions
       ▼
┌─────────────────────┐
│ Final Response      │
└─────────────────────┘
```

### Parallel Workflow

```
User Query: "What are the best beach destinations in Europe?"

┌─────────────┐
│ User Query  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  Triage Agent       │  Decides parallel execution
└──────┬──────────────┘
       │
       ├──────────────────────┬─────────────────────────┐
       │                      │                         │
       ▼                      ▼                         ▼
┌───────────────┐   ┌────────────────────┐   ┌─────────────────┐
│ Destination   │   │ Web Search Agent   │   │ Code Evaluation │
│ Recommendation│   │                    │   │ Agent           │
│ Agent         │   │ Search for:        │   │                 │
│               │   │ • Current weather  │   │ Calculate:      │
│ Returns:      │   │ • Travel deals     │   │ • Best time     │
│ • Santorini   │   │ • Events           │   │ • Price ranges  │
│ • Amalfi Coast│   │                    │   │                 │
│ • Algarve     │   └────────────────────┘   └─────────────────┘
└───────┬───────┘              │                       │
        │                      │                       │
        └──────────────────────┴───────────────────────┘
                               │
                               ▼
                    ┌────────────────────┐
                    │ Combine Results    │
                    │ • Destinations     │
                    │ • Current info     │
                    │ • Price analysis   │
                    └──────┬─────────────┘
                           │
                           ▼
                    ┌────────────────────┐
                    │ Final Response     │
                    └────────────────────┘
```

### Conditional Workflow with Agent Handoff

```
User Query: Various queries

┌─────────────┐
│ User Query  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│         Triage Agent                    │
│         (Analyzes Intent)               │
└──────┬──────────────┬───────────────┬───┘
       │              │               │
       │              │               │
    Intent:        Intent:        Intent:
   "search"     "calculate"      "echo"
       │              │               │
       ▼              ▼               ▼
┌──────────┐   ┌─────────────┐  ┌─────────┐
│Destination│  │Code Eval    │  │Echo     │
│Agent      │  │Agent        │  │Agent    │
└───────────┘  └─────────────┘  └─────────┘
```

## Migration Strategy

### Parallel Deployment Approach

```
Week 0-2: Foundation
┌────────────────┐
│ Current: TS API│  ◀── All traffic
├────────────────┤
│ New: Python API│  (Build & test)
└────────────────┘

Week 3-8: Development
┌────────────────┐
│ Current: TS API│  ◀── All traffic
├────────────────┤
│ New: Python API│  (Development)
└────────────────┘

Week 9-12: Testing
┌────────────────┐
│ Current: TS API│  ◀── 100% traffic
├────────────────┤
│ New: Python API│  ◀── Internal testing
└────────────────┘

Week 13-15: Gradual Rollout
┌────────────────┐
│ Current: TS API│  ◀── 90% traffic
├────────────────┤
│ New: Python API│  ◀── 10% traffic (monitoring)
└────────────────┘

Week 16-17: Increased Traffic
┌────────────────┐
│ Current: TS API│  ◀── 50% traffic
├────────────────┤
│ New: Python API│  ◀── 50% traffic
└────────────────┘

Week 18: Full Migration
┌────────────────┐
│ Current: TS API│  ◀── 0% traffic (standby)
├────────────────┤
│ New: Python API│  ◀── 100% traffic
└────────────────┘

Week 19-20: Deprecation
┌────────────────┐
│ New: Python API│  ◀── 100% traffic
└────────────────┘
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

```
┌─────────────────────────────────────────────────────────────┐
│                    Current (LlamaIndex.TS)                   │
├─────────────────────────────────────────────────────────────┤
│ Language:        TypeScript                                  │
│ Runtime:         Node.js 22+                                 │
│ Web Framework:   Express.js 5.0                              │
│ Agent Framework: LlamaIndex.TS 0.10.3                        │
│ MCP Client:      @llamaindex/tools 0.1.2                     │
│ Type System:     TypeScript                                  │
│ Package Manager: npm                                         │
│ Config:          .env + dotenv                               │
│ Observability:   OpenTelemetry                               │
└─────────────────────────────────────────────────────────────┘
                           ↓ MIGRATION ↓
┌─────────────────────────────────────────────────────────────┐
│              Proposed (Microsoft Agent Framework)            │
├─────────────────────────────────────────────────────────────┤
│ Language:        Python 3.12+                                │
│ Runtime:         Python                                      │
│ Web Framework:   FastAPI + Uvicorn                           │
│ Agent Framework: agent-framework (MAF)                       │
│ MCP Client:      Custom (httpx-based)                        │
│ Type System:     Pydantic                                    │
│ Package Manager: pip                                         │
│ Config:          .env + pydantic-settings                    │
│ Observability:   OpenTelemetry                               │
└─────────────────────────────────────────────────────────────┘
```

## Request Flow Comparison

### Current Flow (LlamaIndex.TS)
```
1. User Input → Angular UI
2. HTTP POST → Express.js Server (:4000)
3. setupAgents() → Creates LlamaIndex agents
4. multiAgent.run() → Executes workflow
5. Triage Agent → Analyzes query
6. Specialized Agents → Process tasks
7. MCP Clients → Call tool servers
8. Response Stream → SSE to UI
9. UI Update → Display results
```

### Proposed Flow (MAF)
```
1. User Input → Angular UI
2. HTTP POST → FastAPI Server (:4000)
3. TravelWorkflow.run() → Executes MAF workflow
4. Triage Agent → Analyzes query
5. Specialized Agents → Process tasks
6. MCP Clients → Call tool servers
7. Response Stream → SSE to UI
8. UI Update → Display results
```

**Note**: The flow is essentially identical from the UI perspective!

## Benefits Summary

```
┌────────────────────────────────────────────────────────────┐
│                  Benefits of MAF Migration                  │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ Native Azure AI Integration                            │
│     • Better Azure OpenAI support                          │
│     • Azure AI Services integration                        │
│     • Managed Identity support                             │
│                                                             │
│  ✅ Python AI/ML Ecosystem                                 │
│     • Access to scikit-learn, pandas, numpy                │
│     • Better ML library support                            │
│     • Integration with Jupyter notebooks                   │
│                                                             │
│  ✅ Microsoft Backing                                      │
│     • Long-term support guaranteed                         │
│     • Regular updates and improvements                     │
│     • Enterprise-grade reliability                         │
│                                                             │
│  ✅ Modern Agent Patterns                                  │
│     • Latest agent architecture                            │
│     • Advanced workflow capabilities                       │
│     • Built-in state management                            │
│                                                             │
│  ✅ Performance                                            │
│     • FastAPI high performance                             │
│     • Async/await throughout                               │
│     • Efficient resource usage                             │
│                                                             │
│  ✅ Type Safety                                            │
│     • Pydantic for data validation                         │
│     • Strong type hints                                    │
│     • Runtime validation                                   │
│                                                             │
└────────────────────────────────────────────────────────────┘
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
