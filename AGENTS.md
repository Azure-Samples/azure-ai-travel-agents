# Azure AI Travel Agents - Developer Guide

This file provides comprehensive guidelines for OpenAI Codex and other AI coding assistants working with the Azure AI Travel Agents codebase. It documents project structure, coding conventions, testing protocols, and PR guidelines to ensure generated code integrates seamlessly with the existing architecture.

## Project Structure & Architecture

### High-Level Architecture

The Azure AI Travel Agents is a **modular AI multi-agent system** composed of multiple microservices ("tools") orchestrated by LlamaIndex.TS. Each component is containerized and communicates via HTTP APIs or Model Context Protocol (MCP).

```
azure-ai-travel-agents/
├── .github/                    # GitHub workflows, templates, and copilot instructions
├── docs/                       # Architecture and API documentation
├── infra/                      # Infrastructure as Code (Bicep templates)
├── src/                        # Source code
│   ├── api/                    # Express.js API server & orchestrator
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

The system implements specialized agents coordinated by a **Triage Agent**:

- **Triage Agent**: Routes user queries to appropriate specialized agents
- **Customer Query Agent**: Extracts preferences from customer inquiries (.NET)
- **Destination Recommendation Agent**: Suggests destinations based on preferences (Java)
- **Itinerary Planning Agent**: Creates detailed travel plans (Python)
- **Web Search Agent**: Fetches live travel data via Bing API (TypeScript)
- **Code Evaluation Agent**: Executes custom logic using Azure Container Apps code interpreter (Python)
- **Model Inference Agent**: Runs local LLMs with ONNX/vLLM on serverless GPU (Python)

### Service Communication

- **API Gateway**: `src/api/` orchestrates all requests using Express.js
- **MCP Protocol**: All tools implement Model Context Protocol for standardized communication
- **Frontend**: Angular SPA in `src/ui/` with Tailwind CSS and Angular Material
- **Infrastructure**: Azure Container Apps deployment via Bicep templates in `infra/`

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

**Location**: `src/tools/itinerary-planning/`, `src/tools/code-evaluation/`, `src/tools/model-inference/`

**Key Conventions**:
- Python 3.12+ with pyproject.toml configuration
- Use MCP SDK: `mcp[cli]>=1.10.1`
- Async/await patterns with FastAPI/Starlette
- Ruff for linting with line length 120
- Type hints required for all public APIs

**Project Structure**:
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

**Naming Conventions**:
```python
# Files: snake_case
mcp_server.py
customer_analysis.py

# Classes: PascalCase
class CustomerQueryTool:
class ItineraryPlanningServer:

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

**Backend API (Node.js)**:
- **Build Tests**: TypeScript compilation validation
- **Command**: `npm run build` in `src/api/`
- **Integration**: MCP server connectivity testing via health endpoints

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

# API build validation
cd src/api
npm run build

# MCP server health checks
curl http://localhost:5007/health  # echo-ping
curl http://localhost:5001/health  # customer-query
curl http://localhost:5002/health  # destination-recommendation

# Full system integration test
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Plan a 3-day trip to Tokyo","tools":[...]}'
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
   # API
   cd src/api && npm run build
   
   # UI  
   cd src/ui && npm run build
   
   # MCP Servers (as applicable)
   cd src/tools/echo-ping && npm run build
   cd src/tools/customer-query && dotnet build
   cd src/tools/destination-recommendation && mvn clean install
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
5. **Register in API**: Update `src/api/src/orchestrator/llamaindex/tools/index.ts`
6. **Create Agent Integration**: Add to `setupAgents()` function
7. **Update Documentation**: Add to tool overview in `src/tools/README.md`

This guide ensures AI-generated code follows project conventions and integrates seamlessly with the Azure AI Travel Agents multi-agent architecture.