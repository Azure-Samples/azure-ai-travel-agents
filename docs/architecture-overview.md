---
title: architecture-overview
createTime: 2025/06/06 13:07:02
---
# Architecture Overview

This document provides a comprehensive breakdown of the Azure AI Travel Agents system architecture, explaining the different components and how they work together in both local and cloud environments.

## Table of Contents

1. [System Components](#system-components)
2. [Local Development Architecture](#local-development-architecture)
3. [Azure Cloud Architecture](#azure-cloud-architecture)
4. [Component Interactions](#component-interactions)
5. [Deployment Comparison](#deployment-comparison)

## System Components

The Azure AI Travel Agents system consists of several key components that work together to provide intelligent travel assistance:

### Core Components

- **Frontend UI (Angular)**: User interface for travel queries and responses
- **API Gateway (Express.js)**: Main orchestration layer and API endpoints
- **Agent Orchestrator (LlamaIndex.TS)**: Multi-agent coordination and workflow management
- **MCP Servers**: Specialized microservices for different travel functions
- **LLM Providers**: AI models for natural language processing and generation

### MCP Server Components

- **Echo Ping Server (TypeScript)**: Testing and validation service
- **Customer Query Server (C#/.NET)**: Natural language query processing
- **Destination Recommendation Server (Java)**: Travel destination suggestions
- **Itinerary Planning Server (Python)**: Trip planning and scheduling
- **Code Evaluation Server (Python)**: Dynamic code execution and analysis
- **Model Inference Server (Python)**: Local AI model inference
- **Web Search Server (TypeScript)**: Real-time web search integration

### Supporting Infrastructure

- **Monitoring & Observability**: OpenTelemetry tracing and metrics
- **Message Queuing**: Server-Sent Events (SSE) for real-time communication
- **Configuration Management**: Environment-specific settings and secrets
- **Container Orchestration**: Docker and Azure Container Apps

## Local Development Architecture

### Local Setup with Docker Model Runner

```
┌─────────────────────────────────────────────────────────────────┐
│                        Local Development Environment             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │ Angular UI  │    │ Express API │    │   Docker Model      │ │
│  │ Port: 4200  │    │ Port: 4000  │    │   Runner (Phi-4)    │ │
│  └─────────────┘    └─────────────┘    └─────────────────────┘ │
│         │                   │                       │           │
│         │                   │                       │           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                  MCP Servers (Docker)                       │ │
│  │                                                             │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │ │
│  │  │   Echo Ping  │ │Customer Query│ │ Destination Recommend│ │ │
│  │  │  Port: 5007  │ │  Port: 5001  │ │      Port: 5002      │ │ │
│  │  └──────────────┘ └──────────────┘ └──────────────────────┘ │ │
│  │                                                             │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │ │
│  │  │  Itinerary   │ │Code Evaluation│ │   Model Inference   │ │ │
│  │  │  Port: 5003  │ │  Port: 5004   │ │      Port: 5005     │ │ │
│  │  └──────────────┘ └──────────────┘ └──────────────────────┘ │ │
│  │                                                             │ │
│  │  ┌──────────────┐                                          │ │
│  │  │  Web Search  │                                          │ │
│  │  │  Port: 5006  │                                          │ │
│  │  └──────────────┘                                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              Monitoring & Observability                     │ │
│  │   ┌─────────────────┐    ┌─────────────────────────────────┐ │ │
│  │   │ Aspire Dashboard│    │    OpenTelemetry Collector     │ │ │
│  │   │   Port: 18888   │    │         Port: 18889             │ │ │
│  │   └─────────────────┘    └─────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Key Characteristics of Local Setup

- **Free to Run**: Uses Docker Model Runner with local Phi-4 model
- **Full Development Environment**: All services running locally
- **Real-time Development**: Code changes reflected immediately
- **Observability**: Full tracing and monitoring via Aspire Dashboard
- **Isolation**: No external dependencies except for optional web search APIs

### Local Environment Variables

```bash
# Local Development (.env)
PORT=4000
NODE_ENV=development

# MCP Server URLs (local)
MCP_ECHO_PING_URL=http://localhost:5007
MCP_CUSTOMER_QUERY_URL=http://localhost:5001
MCP_WEB_SEARCH_URL=http://localhost:5006
MCP_ITINERARY_PLANNING_URL=http://localhost:5003
MCP_MODEL_INFERENCE_URL=http://localhost:5005
MCP_CODE_EVALUATION_URL=http://localhost:5004
MCP_DESTINATION_RECOMMENDATION_URL=http://localhost:5002

# Docker Model Runner
LLM_PROVIDER=docker
DOCKER_MODEL=ai/phi4:14b-q4_0

# Monitoring
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:18889
```

## Azure Cloud Architecture

### Azure Container Apps Deployment

```
┌─────────────────────────────────────────────────────────────────┐
│                      Azure Container Apps Environment           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Internet Gateway                         │ │
│  │              ┌─────────────────────────────┐                │ │
│  │              │    Load Balancer            │                │ │
│  │              └─────────────────────────────┘                │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                │                                │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                  Container Apps                             │ │
│  │                                                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │   UI App    │  │   API App   │  │     MCP Tool Apps   │ │ │
│  │  │ (Angular)   │  │ (Express)   │  │   (7 services)      │ │ │
│  │  │             │  │             │  │                     │ │ │
│  │  │ Auto-scale  │  │ Auto-scale  │  │    Auto-scale       │ │ │
│  │  │ 1-3 replicas│  │ 1-5 replicas│  │    1-2 replicas     │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Azure Services                           │ │
│  │                                                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │   Azure     │  │   Azure     │  │    Azure Monitor    │ │ │
│  │  │   OpenAI    │  │ Container   │  │   & App Insights    │ │ │
│  │  │             │  │  Registry   │  │                     │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  │                                                             │ │
│  │  ┌─────────────┐  ┌─────────────┐                          │ │
│  │  │   Azure     │  │   Bing      │                          │ │
│  │  │ Key Vault   │  │ Search API  │                          │ │
│  │  │             │  │             │                          │ │
│  │  └─────────────┘  └─────────────┘                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Key Characteristics of Azure Setup

- **Fully Managed**: Azure handles infrastructure, scaling, and maintenance
- **Production Ready**: Built-in load balancing, health checks, and monitoring
- **Auto-scaling**: Automatic scaling based on demand and resource usage
- **Secure**: Managed identity, Key Vault integration, and network isolation
- **Cost Optimized**: Pay-per-use pricing with automatic scaling to zero

### Azure Environment Configuration

```bash
# Azure Production Environment
# (Managed through Azure Container Apps configuration)

# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-openai.openai.azure.com/
AZURE_OPENAI_API_KEY=<managed-by-keyvault>
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini

# MCP Server URLs (Azure Container Apps internal)
MCP_ECHO_PING_URL=https://ca-echo-ping.internal.environment.azurecontainer.io
MCP_CUSTOMER_QUERY_URL=https://ca-customer-query.internal.environment.azurecontainer.io
# ... other MCP servers

# Azure Services
BING_SEARCH_API_KEY=<managed-by-keyvault>
AZURE_MONITOR_CONNECTION_STRING=<managed-by-keyvault>
```

## Component Interactions

### Request Flow Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐
│    User     │    │  Angular    │    │   Express API       │
│   Browser   │    │     UI      │    │    Gateway          │
└─────────────┘    └─────────────┘    └─────────────────────┘
       │                   │                       │
       │ 1. User Query     │                       │
       │ ──────────────────▶                       │
       │                   │ 2. API Request        │
       │                   │ ──────────────────────▶
       │                   │                       │
       │                   │                       │ 3. Setup Agents
       │                   │                       │ ┌─────────────────┐
       │                   │                       │ │  LlamaIndex.TS  │
       │                   │                       │ │  Orchestrator   │
       │                   │                       │ └─────────────────┘
       │                   │                       │          │
       │                   │                       │          │ 4. Triage
       │                   │                       │          │ Decision
       │                   │                       │          │
       │                   │                       │          ▼
       │                   │                       │ ┌─────────────────┐
       │                   │                       │ │ Specialized     │
       │                   │                       │ │ Agents          │
       │                   │                       │ └─────────────────┘
       │                   │                       │          │
       │                   │                       │          │ 5. Tool Calls
       │                   │                       │          │
       │                   │                       │          ▼
       │                   │                       │ ┌─────────────────┐
       │                   │                       │ │   MCP Servers   │
       │                   │                       │ │ (Multiple Lang) │
       │                   │                       │ └─────────────────┘
       │                   │                       │          │
       │                   │                       │          │ 6. Results
       │                   │                       │          │
       │                   │ 7. SSE Response       │ ◀────────┘
       │                   │ ◀──────────────────────
       │ 8. Stream Update  │                       │
       │ ◀─────────────────│                       │
```

### Agent Orchestration Flow

1. **User Input**: Travel query submitted through Angular UI
2. **API Processing**: Express.js API receives and validates request
3. **Agent Setup**: LlamaIndex.TS creates filtered agent configuration
4. **Triage Decision**: Root triage agent analyzes query and determines approach
5. **Agent Delegation**: Specialized agents are activated based on query needs
6. **Tool Execution**: MCP servers process specific tasks (search, planning, etc.)
7. **Response Aggregation**: Results are combined and formatted
8. **Streaming Response**: Real-time updates sent via Server-Sent Events

## Deployment Comparison

### Local Docker Model Runner vs Azure Deployment

| Aspect | Local Docker Model Runner | Azure Container Apps |
|--------|---------------------------|---------------------|
| **Cost** | Free (uses local resources) | Pay-per-use (Azure pricing) |
| **Setup Time** | ~10 minutes | ~15 minutes |
| **Scalability** | Limited to local machine | Auto-scaling (1-100 instances) |
| **Performance** | Depends on local hardware | Optimized cloud infrastructure |
| **Availability** | Dependent on local machine | 99.9% SLA |
| **Maintenance** | Manual updates required | Fully managed |
| **Development** | Ideal for development/testing | Production-ready |
| **External Access** | localhost only | Public internet access |

### When to Use Each Approach

**Local Docker Model Runner**:
- ✅ Development and testing
- ✅ Learning and experimentation
- ✅ Cost-sensitive scenarios
- ✅ Offline development
- ✅ Privacy-sensitive data

**Azure Container Apps**:
- ✅ Production deployments
- ✅ Team collaboration
- ✅ Public-facing applications
- ✅ High availability requirements
- ✅ Enterprise scenarios

### Migration Path

1. **Start Local**: Develop and test using Docker Model Runner
2. **Validate Features**: Ensure all functionality works correctly
3. **Azure Provision**: Use `azd provision` to create Azure resources
4. **Deploy**: Use `azd deploy` to move to Azure Container Apps
5. **Configure**: Set up production environment variables and secrets
6. **Monitor**: Use Azure Monitor and Application Insights for observability

This architecture provides flexibility to run the system in both local development and production cloud environments while maintaining consistency in functionality and behavior.