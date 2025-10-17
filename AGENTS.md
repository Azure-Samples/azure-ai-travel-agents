# Azure AI Travel Agents - Developer Guide

This file provides comprehensive guidelines for OpenAI Codex and other AI coding assistants working with the Azure AI Travel Agents codebase. It documents project structure, coding conventions, testing protocols, and PR guidelines to ensure generated code integrates seamlessly with the existing architecture.

## Project Structure & Architecture

### High-Level Architecture

The Azure AI Travel Agents is a **modular AI multi-agent system** composed of multiple microservices ("tools") with **three orchestration implementations**:

1. **LangChain.js Orchestration** (TypeScript/Node.js) - **Current production default** in `packages/api-langchain-js/` (standalone service)
2. **LlamaIndex.TS Orchestration** (TypeScript/Node.js) - in `packages/api-llamaindex-ts/` (standalone service)
3. **Microsoft Agent Framework Orchestration** (Python) - Alternative implementation in `packages/api-maf-python/`

All orchestrators communicate with the same MCP tool servers. Each component is containerized and communicates via HTTP APIs or Model Context Protocol (MCP).

```
├── .github/                    # GitHub workflows, templates, and copilot instructions
├── docs/                       # Architecture and API documentation
├── infra/                      # Infrastructure as Code (Bicep templates)
├── packages/                   # Source code
│   ├── api-langchain-js/           # LangChain.js service with Express API
│   ├── api-llamaindex-ts/          # LlamaIndex.TS service with Express API
│   ├── api-maf-python/             # FastAPI + Microsoft Agent Framework orchestrator (Python)
│   ├── ui-angular/                     # Angular frontend application
│   └── mcp-servers/                  # MCP servers (microservices)
│      ├── echo-ping/          # TypeScript/Node.js (testing tool)
│      ├── customer-query/     # C#/.NET (customer inquiry processing)
│      ├── destination-recommendation/  # Java (travel destination suggestions)
│      └── itinerary-planning/ # Python (detailed itinerary creation)
│
│
├── azure.yaml                  # Azure Developer CLI configuration
├── repomix.config.json         # Repository documentation config
└── docker-compose.yml      # Local development environment
```

### AI Agent Specialization

The system implements specialized agents coordinated by orchestration layers. All three orchestration implementations (LangChain.js, LlamaIndex.TS, and Microsoft Agent Framework) use the same MCP tool servers.

#### Orchestration Options

**Option 1: LangChain.js Orchestration**

- **Language**: TypeScript with Node.js 22+
- **Framework**: Express.js + LangChain.js + LangGraph
- **Status**: Production-ready (active implementation as of Oct 2025)
- **Orchestration Pattern**: LangGraph supervisor pattern with streaming
- **Key Features**:
  - Official `@langchain/mcp-adapters` for MCP integration
  - `streamEvents` pattern for real-time response streaming
  - Multiple LLM provider support (Azure OpenAI, Docker Models, GitHub Models, Ollama, Foundry Local)
  - Supervisor-based agent coordination via `@langchain/langgraph-supervisor`
- **Agents**: Dynamically created based on available MCP tools
  - **Triage Agent**: Routes user queries to appropriate specialized agents
  - **Customer Query Agent**: Extracts preferences from customer inquiries (via customer-query MCP)
  - **Destination Recommendation Agent**: Suggests destinations (via destination-recommendation MCP)
  - **Itinerary Planning Agent**: Creates detailed travel plans (via itinerary-planning MCP)
  - **Echo Agent**: Testing and validation (via echo-ping MCP)

**Option 2: LlamaIndex.TS Orchestration** (`packages/api-llamaindex-ts/`)

- **Language**: TypeScript with Node.js 22+
- **Framework**: Express.js + LlamaIndex.TS
- **Status**: Available as alternative (previously production default)
- **Agents**: Dynamically created based on available MCP tools
  - **Triage Agent**: Routes user queries to appropriate specialized agents
  - **Customer Query Agent**: Extracts preferences from customer inquiries (via customer-query MCP)
  - **Destination Recommendation Agent**: Suggests destinations (via destination-recommendation MCP)
  - **Itinerary Planning Agent**: Creates detailed travel plans (via itinerary-planning MCP)
  - **Echo Agent**: Testing and validation (via echo-ping MCP)

**Option 3: Microsoft Agent Framework Orchestration** (`packages/api-maf-python/`)

- **Language**: Python 3.11+ with asyncio
- **Framework**: FastAPI + Microsoft Agent Framework (`agent-framework` SDK)
- **Status**: Fully implemented, production-ready alternative
- **Orchestration Pattern**: Magentic multi-agent coordination
- **Agents**: Explicitly defined in `packages/api-maf-python/src/orchestrator/agents/`
  - **TriageAgent**: Coordinates and routes requests to specialized agents
  - **CustomerQueryAgent**: Processes customer inquiries with MCP tools
  - **DestinationRecommendationAgent**: Provides destination suggestions
  - **ItineraryPlanningAgent**: Creates detailed itineraries with MCP tools
  - **EchoAgent**: Testing and validation via echo-ping MCP

#### MCP Tool Servers (Shared by All Orchestrations)

All three orchestration implementations communicate with these MCP servers:

- **customer-query** (.NET/C#) - Port 5001 - Customer inquiry processing
- **destination-recommendation** (Java) - Port 5002 - Travel destination suggestions
- **itinerary-planning** (Python) - Port 5003 - Detailed itinerary creation
- **echo-ping** (TypeScript) - Port 5004 - Testing and validation

### Service Communication

- **Orchestration Layer**:
  - **Option 1**: `packages/api-langchain-js/` (Express.js + LangChain.js)
  - **Option 2**: `packages/api-langchain-js/` (Express.js + LlamaIndex.TS)
  - **Option 3**: `packages/api-maf-python/` (FastAPI + Microsoft Agent Framework) - Python orchestration
- **MCP Protocol**: All tools implement Model Context Protocol for standardized communication
- **Frontend**: SPA in `packages/ui-angular/` with Tailwind CSS and Angular Material (works with any orchestration)
- **Infrastructure**: Azure Container Apps deployment via Bicep templates in `infra/`

All orchestration options:

- Communicate with the same MCP tool servers
- Support the same frontend (no UI changes needed)
- Deploy to the same infrastructure
- Provide equivalent functionality with different implementation languages and frameworks

## Choosing an Orchestration Implementation

The system now offers **three orchestration options**, each with distinct advantages:

### Quick Comparison

| Feature             | LangChain.js                       | LlamaIndex.TS                 | Microsoft Agent Framework  |
| ------------------- | ---------------------------------- | ----------------------------- | -------------------------- |
| **Language**        | TypeScript                         | TypeScript                    | Python                     |
| **Framework**       | LangChain.js + LangGraph           | LlamaIndex.TS                 | agent-framework SDK        |
| **Status**          | **Production**                     | **Production**                | **Experimental**           |
| **Location**        | `packages/api-langchain-js/`       | `packages/api-llamaindex-ts/` | `packages/api-maf-python/` |
| **Best For**        | Proven LLM workflows, streaming    | RAG & indexing scenarios      | Python ML teams            |
| **MCP Integration** | Official `@langchain/mcp-adapters` | Custom HTTP client            | Custom HTTP client         |
| **Streaming**       | `streamEvents` pattern             | Native support                | FastAPI SSE                |

### LangChain.js

**Why Choose LangChain.js:**

- ✅ **Current production implementation** - actively maintained and tested
- ✅ Official MCP adapter support via `@langchain/mcp-adapters`
- ✅ Advanced streaming with `streamEvents` pattern
- ✅ LangGraph supervisor pattern for complex workflows
- ✅ Rich ecosystem of integrations and tools
- ✅ Multiple LLM provider support (Azure OpenAI, Docker Models, GitHub Models, Ollama, Foundry Local)
- ✅ Active community and extensive documentation

**When to Use:**

- Building complex LLM workflows with branching logic
- Need for proven, battle-tested agent orchestration
- Teams familiar with LangChain ecosystem
- Projects requiring extensive tool and integration support

### LlamaIndex.TS

**Why Choose LlamaIndex.TS:**

- ✅ TypeScript type safety and Node.js ecosystem
- ✅ Simple and intuitive agent API
- ✅ Excellent for RAG (Retrieval-Augmented Generation) use cases
- ✅ Strong data indexing and retrieval capabilities
- ✅ Good documentation and examples

**When to Use:**

- Projects heavily focused on document indexing and retrieval
- Teams preferring LlamaIndex's simplified agent model
- RAG-centric applications
- Existing LlamaIndex infrastructure

### Microsoft Agent Framework

**Why Choose Microsoft Agent Framework:**

- ✅ Python-native implementation with asyncio
- ✅ Magentic multi-agent coordination pattern (more patterns are available)
- ✅ FastAPI for high-performance async APIs
- ✅ Native Python ML/AI library integration (scikit-learn, transformers, etc.)
- ✅ Type hints and modern Python features

**When to Use:**

- Team expertise in Python ecosystem
- Integration with Python-based ML pipelines
- Preference for async/await patterns
- Existing Python infrastructure

### Switching Between Orchestrations

You can switch between the TypeScript orchestrations by changing the import in `packages/api-langchain-js/ or packages/api-llamaindex-ts/src/index.ts`:

```typescript
// For LangChain.js (current default)
import { setupAgents } from "./orchestrator/langchain/index.js";

// For LlamaIndex.TS
import { setupAgents } from "./orchestrator/llamaindex/index.js";
```

For the Python implementation, run `packages/api-maf-python/` as a separate service on a different port.

### Running Multiple Orchestrations

You can run different orchestration implementations simultaneously for comparison or gradual migration:

```bash
# Terminal 1: Run LangChain.js/LlamaIndex.TS API
cd packages/api
npm start  # Runs on port 4000

# Terminal 2: Run Microsoft Agent Framework API
cd packages/api-maf-python
uvicorn main:app --reload --port 8000  # Runs on port 8000

# Both can communicate with the same MCP servers
```

This allows you to:

- Compare implementations side-by-side
- Gradually migrate from one to another
- Serve different use cases with different implementations
- Evaluate performance and functionality

For detailed comparison, see `docs/orchestration.md`.

## Coding Conventions & Standards

### General Principles

1. **Service Boundaries**: Each tool is strictly isolated; use HTTP APIs or MCP for communication, never direct imports
2. **Configuration**: Environment-specific configs in service directories, shared configs at repository root
3. **Error Handling**: Implement consistent error handling with proper HTTP status codes and OpenTelemetry tracing
4. **Documentation**: Colocate documentation with code; maintain architectural docs in `docs/`

### TypeScript/Node.js Standards

**Location**: `packages/api-langchain-js/ or packages/api-llamaindex-ts/`, `packages/ui/`, `packages/mcp-servers/echo-ping/`

**Key Conventions**:

- Use ES modules (`"type": "module"` in package.json)
- Node.js 22.16+ with Volta version pinning
- TypeScript 5.3+ with strict type checking
- Express.js 5.x for API servers
- Angular 20+ for UI with standalone components

**Naming Conventions**:

```typescript
// Files: kebab-case
my - component.service.ts;
chat - conversation.component.ts;

// Classes: PascalCase
export class ChatConversationComponent {}
export class McpHttpClient {}

// Functions/variables: camelCase
const setupAgents = async () => {};
const mcpServerConfig = getMcpConfig();

// Constants: SCREAMING_SNAKE_CASE
const MCP_API_HTTP_PATH = "/api/mcp";
```

**File Structure**:

```typescript
// API structure (packages/api-langchain-js/ or packages/api-llamaindex-ts/)
packages/api-langchain-js/ or packages/api-llamaindex-ts/
├── src/
│   ├── index.ts                      # Express server setup
│   ├── mcp/                          # MCP client implementations
│   │   ├── mcp-http-client.ts        # HTTP client for MCP servers
│   │   └── mcp-tools.ts              # MCP tool definitions
│   ├── orchestrator/                 # Agent orchestration
│   │   ├── langchain/                # LangChain.js implementation (current)
│   │   │   ├── index.ts              # Setup and initialization
│   │   │   ├── agents/               # Agent definitions
│   │   │   ├── graph/                # LangGraph workflow
│   │   │   ├── providers/            # LLM providers (Azure, Docker, etc.)
│   │   │   └── tools/                # Tool configurations
│   │   └── llamaindex/               # LlamaIndex.TS implementation (available)
│   │       ├── index.ts              # Setup and initialization
│   │       ├── agents/               # Agent definitions
│   │       └── tools/                # Tool implementations
│   └── utils/                        # Shared utilities

// MCP Server structure (packages/mcp-servers/*/
packages/mcp-servers/echo-ping/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── types.ts              # Type definitions
│   └── tools/                # Tool implementations
│       └── my-tool.ts
├── Dockerfile                # Container configuration
└── package.json              # Dependencies
```

### Python Standards

**Location**:

- **MCP Servers**: `packages/mcp-servers/itinerary-planning/`, `packages/mcp-servers/code-evaluation/`, `packages/mcp-servers/model-inference/`
- **MAF Orchestration**: `packages/api-maf-python/` (Microsoft Agent Framework implementation)

**Key Conventions**:

- Python 3.11+ (3.12+ for MCP servers) with pyproject.toml configuration
- **MCP Servers**: Use MCP SDK: `mcp[cli]>=1.10.1`
- **MAF Orchestration**: Use Microsoft Agent Framework SDK: `agent-framework>=1.0.0b251001`
- Async/await patterns with FastAPI/Starlette
- Ruff for linting with line length 120
- Type hints required for all public APIs

**Project Structure (MCP Servers)**:

```python
# pyproject.toml required with:
[project]
name = "mcp-name-mcp-server"
requires-python = ">=3.12"
dependencies = ["mcp[cli]>=1.10.1", "starlette>=0.46.1"]

[tool.ruff]
line-length = 120
target-version = "py313"
```

**Project Structure (MAF Orchestration)**:

```python
# pyproject.toml in packages/api-maf-python/
[project]
name = "azure-ai-travel-agents-api-python"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.115.0",
    "agent-framework>=1.0.0b251001",
    "pydantic>=2.10.6",
    "opentelemetry-api>=1.30.0",
    # ... more dependencies
]
```

**Naming Conventions**:

```python
# Files: snake_case
mcp_server.py
customer_analysis.py
magentic_workflow.py

# Classes: PascalCase
class CustomerQueryTool:
class ItineraryPlanningServer:
class MagenticTravelOrchestrator:

# Functions/variables: snake_case
async def analyze_customer_query():
server_config = get_config()

# Constants: SCREAMING_SNAKE_CASE
MAX_RETRY_ATTEMPTS = 3
DEFAULT_PORT = 3000
```

### C#/.NET Standards

**Location**: `packages/mcp-servers/customer-query/`

**Key Conventions**:

- .NET 9.x with C# 13
- ASP.NET Core for web APIs
- Dependency injection with built-in container
- OpenTelemetry integration for monitoring

**Naming Conventions**:

```csharp
// Files: PascalCase
CustomerQueryTool.cs
Program.cs

// Classes/Methods: PascalCase
public class CustomerQueryTool
public async Task<CustomerQueryResult> AnalyzeQueryAsync()

// Private fields: camelCase with underscore
private readonly ILogger _logger;
private readonly HttpClient _httpClient;

// Constants: PascalCase
public const string DefaultEndpoint = "/api/analyze";
```

### Java Standards

**Location**: `packages/mcp-servers/destination-recommendation/`

**Key Conventions**:

- Java 24 with Temurin JDK
- Maven for dependency management
- Spring Boot for web framework
- OpenTelemetry integration

**Naming Conventions**:

```java
// Files: PascalCase matching class name
DestinationRecommendationTool.java
Application.java

// Classes/Methods: PascalCase
public class DestinationRecommendationTool
public CompletableFuture<RecommendationResult> getRecommendations()

// Variables: camelCase
private final Logger logger;
private String apiEndpoint;

// Constants: SCREAMING_SNAKE_CASE
public static final String DEFAULT_API_PATH = "/api/recommend";
```

## Testing Protocols

### Testing Framework Overview

**Frontend (Angular)**:

- **Unit Tests**: Jasmine + Karma for component testing
- **Location**: `packages/ui/src/app/**/*.spec.ts`
- **Command**: `npm test` in `packages/ui/`
- **Coverage**: Components, services, and pipes

**Backend API (Node.js - LangChain.js/LlamaIndex.TS)**:

- **Build Tests**: TypeScript compilation validation
- **Location**: `packages/api-langchain-js/ or packages/api-llamaindex-ts/`
- **Command**: `npm run build` in `packages/api-langchain-js/` (standalone service)
- **Integration**: MCP server connectivity testing via health endpoints

**Backend API (Python - Microsoft Agent Framework)**:

- **Unit Tests**: pytest for agent and workflow testing
- **Location**: `packages/api-maf-python/src/tests/`
- **Command**: `pytest` in `packages/api-maf-python/`
- **Coverage**: Agents, workflows, MCP integration, providers

**MCP Servers**:

- **TypeScript**: Build validation with `npm run build`
- **Python**: Installation verification with `pip install .`
- **C#**: Build with `dotnet build --configuration Release`
- **Java**: Build with `mvn clean install -DskipTests`

### Running Tests

```bash
# Frontend unit tests
cd packages/ui
npm test

# API build validation (LangChain.js or LlamaIndex.TS)
cd packages/api
npm run build

# API tests (Microsoft Agent Framework)
cd packages/api-maf-python
pip install -e ".[dev]"
pytest

# MCP server health checks
curl http://localhost:5004/health  # echo-ping
curl http://localhost:5001/health  # customer-query
curl http://localhost:5002/health  # destination-recommendation
curl http://localhost:5003/health  # itinerary-planning

# Full system integration test (LlamaIndex.TS)
curl -X POST http://localhost:4001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Plan a 3-day trip to Tokyo","tools":[...]}'

# Full system integration test (MAF)
curl -X POST http://localhost:4010/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Plan a 3-day trip to Tokyo"}'
```

### Test File Patterns

- **Angular**: `*.component.spec.ts`, `*.service.spec.ts`
- **TypeScript**: Tests colocated with source files
- **Python**: Tests in project root or `tests/` directory
- **C#**: Tests in separate test projects
- **Java**: Tests in `src/test/java/` following Maven conventions

## Pull Request Guidelines

### Branch Strategy

```
main                    # Production-ready code
├── develop             # Integration branch
├── feature/*           # Feature development
├── bugfix/*            # Bug fixes
├── hotfix/*            # Production hotfixes
└── release/*           # Release preparation
```

### Commit Message Format

Follow conventional commits pattern:

```bash
# Format: type(scope): description
feat(api): add new MCP server integration
fix(ui): resolve chat streaming issue
docs(mcp): update server implementation guide
refactor(api): improve error handling
test(ui): add component unit tests
chore(deps): update dependencies
```

### PR Requirements

**Before Creating PR**:

1. **Run All Builds**: Ensure all affected services build successfully

   ```bash
   # API (LangChain.js or LlamaIndex.TS)
   cd packages/api && npm run build

   # API (Microsoft Agent Framework)
   cd packages/api-maf-python && pip install -e . && pytest

   # UI
   cd packages/ui && npm run build

   # MCP Servers (as applicable)
   cd packages/mcp-servers/echo-ping && npm run build
   cd packages/mcp-servers/customer-query && dotnet build
   cd packages/mcp-servers/destination-recommendation && mvn clean install
   cd packages/mcp-servers/itinerary-planning && pip install .
   cd packages/mcp-servers/code-evaluation && pip install .
   cd packages/mcp-servers/model-inference && pip install .
   ```

2. **Test Coverage**: Run existing tests and add new tests for new functionality
3. **Documentation**: Update relevant docs in `docs/` and inline documentation
4. **Environment Variables**: Update `.env.sample` files if new config is required

**PR Description Template**:

```markdown
## Purpose

Brief description of changes and problem solved

## Does this introduce a breaking change?

[ ] Yes
[ ] No

## Pull Request Type

[ ] Bugfix
[ ] Feature  
[ ] Code style update
[ ] Refactoring
[ ] Documentation content changes
[ ] Other

## How to Test

- Get the code: `git checkout [branch-name]`
- Install dependencies: `npm install` (for applicable services)
- Test locally: [specific test steps]

## What to Check

- [ ] All builds pass
- [ ] Tests pass
- [ ] No breaking changes
- [ ] Documentation updated
```

### Code Review Standards

**For Reviewers**:

- Focus on correctness, performance, and maintainability
- Verify MCP protocol compliance for new tools
- Check OpenTelemetry integration for observability
- Ensure proper error handling and logging
- Validate Docker configurations for new services

**For Authors**:

- Keep PRs focused and reasonably sized
- Respond to all review comments with changes or justification
- Ensure CI/CD builds pass before requesting review
- Test locally with Docker Compose before submitting

### Adding New MCP Servers

When creating new agents/tools, follow this pattern:

1. **Create Tool Structure**: `packages/mcp-servers/my-new-tool/`
2. **Implement MCP Server**: Use appropriate language SDK
3. **Add Docker Configuration**: `Dockerfile` and health endpoint
4. **Register in Docker Compose**: Add service definition

**For LangChain.js Orchestration** (Current Default): 5. **Register MCP Tool**: Update `packages/api-langchain-js/ or packages/api-llamaindex-ts/src/mcp/mcp-tools.ts` to include the new tool 6. **Tool Configuration**: Add tool metadata in `packages/api-langchain-js/ or packages/api-llamaindex-ts/src/orchestrator/langchain/tools/index.ts` 7. **Agent Definition** (optional): If needed, add specialized agent in `packages/api-langchain-js/ or packages/api-llamaindex-ts/src/orchestrator/langchain/agents/index.ts` 8. **Update Workflow**: Tools are automatically discovered; update `packages/api-langchain-js/ or packages/api-llamaindex-ts/src/orchestrator/langchain/graph/index.ts` if custom workflow logic is needed

**For LlamaIndex.TS Orchestration** (Available Alternative): 5. **Register in API**: Update `packages/api-langchain-js/ or packages/api-llamaindex-ts/src/orchestrator/llamaindex/tools/index.ts` 6. **Create Agent Integration**: Add to `setupAgents()` function in `packages/api-langchain-js/ or packages/api-llamaindex-ts/src/orchestrator/llamaindex/index.ts` 7. **Update Documentation**: Add to tool overview in `packages/mcp-servers/README.md`

**For Microsoft Agent Framework Orchestration**: 5. **Add Tool Metadata**: Update `packages/api-maf-python/src/orchestrator/tools/tool_config.py` 6. **Create Agent Class**: Add new agent in `packages/api-maf-python/src/orchestrator/agents/specialized_agents.py` 7. **Register Agent**: Export in `packages/api-maf-python/src/orchestrator/agents/__init__.py` 8. **Integrate in Workflow**: Add to workflow in `packages/api-maf-python/src/orchestrator/magentic_workflow.py` or `workflow.py` 9. **Update Documentation**: Add to `packages/api-maf-python/README.md`

**Common Steps for All Orchestrations**:

- Implement health endpoint at `/health`
- Add OpenTelemetry tracing
- Document in `packages/mcp-servers/README.md`
- Add environment variables to `.env.sample`
- Update architecture diagrams in `docs/`

This guide ensures AI-generated code follows project conventions and integrates seamlessly with all three Azure AI Travel Agents orchestration architectures.
