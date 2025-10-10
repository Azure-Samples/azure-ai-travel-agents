# Azure AI Travel Agents - Developer Guide

This file provides comprehensive guidelines for OpenAI Codex and other AI coding assistants working with the Azure AI Travel Agents codebase. It documents project structure, coding conventions, testing protocols, and PR guidelines to ensure generated code integrates seamlessly with the existing architecture.

## Project Structure & Architecture

### High-Level Architecture

The Azure AI Travel Agents is a **modular AI multi-agent system** composed of multiple microservices ("tools") with **two orchestration implementations**:

1. **LlamaIndex.TS Orchestration** (TypeScript/Node.js) - Production default in `src/api/`
2. **Microsoft Agent Framework Orchestration** (Python) - Alternative implementation in `src/api-python/`

Both orchestrators communicate with the same MCP tool servers. Each component is containerized and communicates via HTTP APIs or Model Context Protocol (MCP).

```
azure-ai-travel-agents/
├── .github/                    # GitHub workflows, templates, and copilot instructions
├── docs/                       # Architecture and API documentation
├── infra/                      # Infrastructure as Code (Bicep templates)
├── src/                        # Source code
│   ├── api/                    # Express.js API + LlamaIndex.TS orchestrator (TypeScript)
│   ├── api-python/             # FastAPI + Microsoft Agent Framework orchestrator (Python)
│   ├── ui/                     # Angular frontend application
│   ├── tools/                  # MCP servers (microservices)
│   │   ├── echo-ping/          # TypeScript/Node.js (testing tool)
│   │   ├── customer-query/     # C#/.NET (customer inquiry processing)
│   │   ├── destination-recommendation/  # Java (travel destination suggestions)
│   │   ├── itinerary-planning/ # Python (detailed itinerary creation)
│   │   ├── code-evaluation/    # Python (code interpreter integration)
│   │   ├── model-inference/    # Python (local LLM with GPU support)
│   │   └── web-search/         # TypeScript (Bing API integration)
│   ├── shared/                 # Common utilities and types
│   └── docker-compose.yml      # Local development environment
├── azure.yaml                  # Azure Developer CLI configuration
└── repomix.config.json         # Repository documentation config
```

### AI Agent Specialization

The system implements specialized agents coordinated by orchestration layers. Both orchestration implementations (LlamaIndex.TS and Microsoft Agent Framework) use the same MCP tool servers.

#### Orchestration Options

**Option 1: LlamaIndex.TS Orchestration** (Default - `src/api/`)
- **Language**: TypeScript with Node.js 22+
- **Framework**: Express.js + LlamaIndex.TS
- **Status**: Production-ready
- **Agents**: Dynamically created based on available MCP tools
  - **Triage Agent**: Routes user queries to appropriate specialized agents
  - **Customer Query Agent**: Extracts preferences from customer inquiries (via customer-query MCP)
  - **Destination Recommendation Agent**: Suggests destinations (via destination-recommendation MCP)
  - **Itinerary Planning Agent**: Creates detailed travel plans (via itinerary-planning MCP)
  - **Web Search Agent**: Fetches live travel data via Bing API (via web-search MCP)
  - **Code Evaluation Agent**: Executes custom logic (via code-evaluation MCP)
  - **Model Inference Agent**: Runs local LLMs with ONNX/vLLM (via model-inference MCP)
  - **Echo Agent**: Testing and validation (via echo-ping MCP)

**Option 2: Microsoft Agent Framework Orchestration** (`src/api-python/`)
- **Language**: Python 3.11+ with asyncio
- **Framework**: FastAPI + Microsoft Agent Framework (`agent-framework` SDK)
- **Status**: Fully implemented, production-ready alternative
- **Orchestration Pattern**: Magentic multi-agent coordination
- **Agents**: Explicitly defined in `src/api-python/src/orchestrator/agents/`
  - **TriageAgent**: Coordinates and routes requests to specialized agents
  - **CustomerQueryAgent**: Processes customer inquiries with MCP tools
  - **DestinationRecommendationAgent**: Provides destination suggestions
  - **ItineraryPlanningAgent**: Creates detailed itineraries with MCP tools
  - **CodeEvaluationAgent**: Executes code via code-evaluation MCP server
  - **ModelInferenceAgent**: Performs local model inference via MCP
  - **WebSearchAgent**: Searches web using Bing API via MCP
  - **EchoAgent**: Testing and validation via echo-ping MCP

#### MCP Tool Servers (Shared by Both Orchestrations)

Both orchestration implementations communicate with these MCP servers:

- **customer-query** (.NET/C#) - Port 5001 - Customer inquiry processing
- **destination-recommendation** (Java) - Port 5002 - Travel destination suggestions
- **itinerary-planning** (Python) - Port 5003 - Detailed itinerary creation
- **code-evaluation** (Python) - Port 5004 - Code interpreter integration
- **model-inference** (Python) - Port 5005 - Local LLM with GPU support
- **web-search** (TypeScript) - Port 5006 - Bing API integration
- **echo-ping** (TypeScript) - Port 5007 - Testing and validation

### Service Communication

- **Orchestration Layer**: 
  - **Option 1**: `src/api/` (Express.js + LlamaIndex.TS) - TypeScript orchestration
  - **Option 2**: `src/api-python/` (FastAPI + Microsoft Agent Framework) - Python orchestration
- **MCP Protocol**: All tools implement Model Context Protocol for standardized communication
- **Frontend**: Angular SPA in `src/ui/` with Tailwind CSS and Angular Material (works with either orchestration)
- **Infrastructure**: Azure Container Apps deployment via Bicep templates in `infra/`

Both orchestration options:
- Communicate with the same MCP tool servers
- Support the same frontend (no UI changes needed)
- Deploy to the same infrastructure
- Provide equivalent functionality with different implementation languages

## Choosing an Orchestration Implementation

### When to Use LlamaIndex.TS (`src/api/`)

**Choose this if:**
- ✅ Your team has strong TypeScript/Node.js expertise
- ✅ You prefer Express.js and the Node.js ecosystem
- ✅ You want the current production-tested implementation
- ✅ You need minimal setup (default configuration)
- ✅ Your infrastructure is Node.js-based

**Key Features:**
- TypeScript type safety
- Express.js middleware ecosystem
- LlamaIndex.TS agent framework
- Proven in production
- Active development

### When to Use Microsoft Agent Framework (`src/api-python/`)

**Choose this if:**
- ✅ Your team has strong Python expertise
- ✅ You want native Microsoft Agent Framework SDK
- ✅ You prefer FastAPI and async Python patterns
- ✅ You need access to Python's AI/ML ecosystem
- ✅ You want built-in MCP tool support via `MCPStreamableHTTPTool`

**Key Features:**
- Python 3.11+ with asyncio
- FastAPI high-performance API
- Magentic orchestration pattern
- Multiple LLM provider support (Azure OpenAI, GitHub Models, Ollama, Docker Models)
- Graceful degradation when MCP servers unavailable
- Comprehensive test coverage with pytest

### Running Both in Parallel

You can run both orchestration implementations simultaneously:

```bash
# Terminal 1: Run LlamaIndex.TS API
cd src/api
npm start  # Runs on port 4000

# Terminal 2: Run Microsoft Agent Framework API
cd src/api-python
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

**Location**: `src/api/`, `src/ui/`, `src/tools/echo-ping/`, `src/tools/web-search/`

**Key Conventions**:
- Use ES modules (`"type": "module"` in package.json)
- Node.js 22.16+ with Volta version pinning
- TypeScript 5.3+ with strict type checking
- Express.js 5.x for API servers
- Angular 20+ for UI with standalone components

**Naming Conventions**:
```typescript
// Files: kebab-case
my-component.service.ts
chat-conversation.component.ts

// Classes: PascalCase
export class ChatConversationComponent {}
export class McpHttpClient {}

// Functions/variables: camelCase
const setupAgents = async () => {}
const mcpServerConfig = getMcpConfig()

// Constants: SCREAMING_SNAKE_CASE
const MCP_API_HTTP_PATH = '/api/mcp'
```

**File Structure**:
```typescript
// MCP Server structure
src/
├── index.ts              # Main server entry point
├── types.ts             # Type definitions
└── tools/               # Tool implementations
    └── my-tool.ts

// API structure
src/
├── index.ts             # Express server setup
├── mcp/                 # MCP client implementations
├── orchestrator/        # Agent orchestration logic
└── utils/               # Shared utilities
```

### Python Standards

**Location**: 
- **MCP Servers**: `src/tools/itinerary-planning/`, `src/tools/code-evaluation/`, `src/tools/model-inference/`
- **MAF Orchestration**: `src/api-python/` (Microsoft Agent Framework implementation)

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
name = "tool-name-mcp-server"
requires-python = ">=3.12"
dependencies = ["mcp[cli]>=1.10.1", "starlette>=0.46.1"]

[tool.ruff]
line-length = 120
target-version = "py313"
```

**Project Structure (MAF Orchestration)**:
```python
# pyproject.toml in src/api-python/
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

**Location**: `src/tools/customer-query/`

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

**Location**: `src/tools/destination-recommendation/`

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
- **Location**: `src/ui/src/app/**/*.spec.ts`
- **Command**: `npm test` in `src/ui/`
- **Coverage**: Components, services, and pipes

**Backend API (Node.js - LlamaIndex.TS)**:
- **Build Tests**: TypeScript compilation validation
- **Location**: `src/api/`
- **Command**: `npm run build` in `src/api/`
- **Integration**: MCP server connectivity testing via health endpoints

**Backend API (Python - Microsoft Agent Framework)**:
- **Unit Tests**: pytest for agent and workflow testing
- **Location**: `src/api-python/src/tests/`
- **Command**: `pytest` in `src/api-python/`
- **Coverage**: Agents, workflows, MCP integration, providers

**MCP Servers**:
- **TypeScript**: Build validation with `npm run build`
- **Python**: Installation verification with `pip install .`
- **C#**: Build with `dotnet build --configuration Release`
- **Java**: Build with `mvn clean install -DskipTests`

### Running Tests

```bash
# Frontend unit tests
cd src/ui
npm test

# API build validation (LlamaIndex.TS)
cd src/api
npm run build

# API tests (Microsoft Agent Framework)
cd src/api-python
pip install -e ".[dev]"
pytest

# MCP server health checks
curl http://localhost:5007/health  # echo-ping
curl http://localhost:5001/health  # customer-query
curl http://localhost:5002/health  # destination-recommendation

# Full system integration test (LlamaIndex.TS)
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Plan a 3-day trip to Tokyo","tools":[...]}'

# Full system integration test (MAF)
curl -X POST http://localhost:8000/api/chat \
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
   # API (LlamaIndex.TS)
   cd src/api && npm run build
   
   # API (Microsoft Agent Framework)
   cd src/api-python && pip install -e . && pytest
   
   # UI  
   cd src/ui && npm run build
   
   # MCP Servers (as applicable)
   cd src/tools/echo-ping && npm run build
   cd src/tools/customer-query && dotnet build
   cd src/tools/destination-recommendation && mvn clean install
   cd src/tools/itinerary-planning && pip install .
   cd src/tools/code-evaluation && pip install .
   cd src/tools/model-inference && pip install .
   cd src/tools/web-search && npm run build
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

1. **Create Tool Structure**: `src/tools/my-new-tool/`
2. **Implement MCP Server**: Use appropriate language SDK
3. **Add Docker Configuration**: `Dockerfile` and health endpoint
4. **Register in Docker Compose**: Add service definition

**For LlamaIndex.TS Orchestration**:
5. **Register in API**: Update `src/api/src/orchestrator/llamaindex/tools/index.ts`
6. **Create Agent Integration**: Add to `setupAgents()` function in `src/api/src/orchestrator/llamaindex/index.ts`
7. **Update Documentation**: Add to tool overview in `src/tools/README.md`

**For Microsoft Agent Framework Orchestration**:
5. **Add Tool Metadata**: Update `src/api-python/src/orchestrator/tools/tool_config.py`
6. **Create Agent Class**: Add new agent in `src/api-python/src/orchestrator/agents/specialized_agents.py`
7. **Register Agent**: Export in `src/api-python/src/orchestrator/agents/__init__.py`
8. **Integrate in Workflow**: Add to workflow in `src/api-python/src/orchestrator/magentic_workflow.py` or `workflow.py`
9. **Update Documentation**: Add to `src/api-python/README.md`

**Common Steps for Both**:
- Implement health endpoint at `/health`
- Add OpenTelemetry tracing
- Document in `src/tools/README.md`
- Add environment variables to `.env.sample`
- Update architecture diagrams in `docs/`

This guide ensures AI-generated code follows project conventions and integrates seamlessly with both Azure AI Travel Agents orchestration architectures.