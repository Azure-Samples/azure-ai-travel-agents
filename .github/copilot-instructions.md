# Copilot Instructions for azure-ai-travel-agents

## Big Picture Architecture

- The platform is a modular AI travel agent system, composed of multiple microservices ("tools") for itinerary planning, destination recommendations, customer queries, and more.
- The main API gateway is in `packages/api/`, with **three orchestration options**:
  - **LangChain.js** (current default) at `packages/api/src/orchestrator/langchain/`
  - **LlamaIndex.TS** (available alternative) at `packages/api/src/orchestrator/llamaindex/`
  - **Microsoft Agent Framework** (Python alternative) at `packages/api-python/`
- Each tool is isolated in its own directory under `packages/mcp-servers/` and communicates via HTTP APIs or Model Context Protocol (MCP).
- The frontend UI is in `packages/ui/` (Angular + Tailwind CSS), talking to the API gateway.
- Infrastructure is managed with Bicep templates in `infra/` and setup scripts in `infra/hooks/`.

## Developer Workflows

- **Build & Run All Services:**  
  Run `./run.sh` from the repo root to build and start all services locally via Docker Compose.
- **Service-Specific Development:**  
  Each tool under `packages/mcp-servers/` can be built and run independently using its language's standard commands (e.g., `npm`, `mvnw`, `python`).
- **UI Development:**  
  Run `npm start` in `packages/ui/` for local frontend development.
- **Infrastructure Deployment:**  
  Use Bicep files in `infra/` and scripts in `infra/hooks/` for Azure deployments.

## Project-Specific Conventions

- **Service Boundaries:**  
  Each tool is strictly separated; cross-service communication uses HTTP APIs or MCP protocol, not direct imports.
- **Orchestration Options:**  
  Three orchestrators available (all work with the same MCP tools):
  - **LangChain.js** (TypeScript) - Current default, uses LangGraph supervisor pattern with `@langchain/mcp-adapters`
  - **LlamaIndex.TS** (TypeScript) - Available alternative, good for RAG use cases
  - **Microsoft Agent Framework** (Python) - Alternative for Python-native teams
- **Configuration:**  
  Shared config files are in the repo root (`azure.yaml`, `repomix.config.json`). Service-specific configs are in their respective directories.
- **Testing:**  
  Tests are colocated with source files or follow language-specific conventions (e.g., `.spec.ts` for TypeScript, `test/` for Python).
- **Documentation:**  
  Key architectural docs are in `docs/` (see `docs/technical-architecture.md`, `docs/deployment-architecture.md`, `docs/orchestration.md`).

## Integration Points & External Dependencies

- **Azure Services:**  
  Provisioned via Bicep templates; see `infra/main.bicep`.
- **LLMs:**  
  Model integration details are in `llms.txt`.
  - **LangChain.js orchestrator**: `packages/api/src/orchestrator/langchain/providers/` (Azure OpenAI, Docker Models, GitHub Models, Ollama, Foundry Local)
  - **LlamaIndex.TS orchestrator**: `packages/api/src/orchestrator/llamaindex/`
  - **Microsoft Agent Framework**: `packages/api-python/src/orchestrator/`
- **MCP (Model Context Protocol):**  
  All tools implement MCP for standardized communication. MCP servers in `packages/mcp-servers/` (TypeScript, Python, C#, Java).

## Patterns & Examples

- **Adding a New Tool:**  
  Scaffold under `packages/mcp-servers/`, provide a `Dockerfile`, and register with the API gateway:
  - For **LangChain.js**: Update `packages/api/src/mcp/mcp-tools.ts` and `packages/api/src/orchestrator/langchain/tools/index.ts`
  - For **LlamaIndex.TS**: Update `packages/api/src/orchestrator/llamaindex/tools/index.ts`
  - For **Microsoft Agent Framework**: Update `packages/api-python/src/orchestrator/tools/tool_config.py`
- **Extending the UI:**  
  Add Angular components in `packages/ui/src/app/`, update routing as needed.
- **Service Communication:**  
  Use HTTP clients (see `packages/api/src/mcp/mcp-http-client.ts`) for inter-service calls via MCP protocol.
- **Switching Orchestrators:**  
  Change import in `packages/api/src/index.ts` from `./orchestrator/langchain/` to `./orchestrator/llamaindex/` or run `packages/api-python/` separately.

## Key Files & Directories

- `packages/api/` - API gateway and orchestrator logic
  - `src/orchestrator/langchain/` - **LangChain.js orchestrator (current default)**
  - `src/orchestrator/llamaindex/` - LlamaIndex.TS orchestrator (available alternative)
  - `src/mcp/` - MCP client implementation
- `packages/api-python/` - Python-based API with Microsoft Agent Framework orchestrator
- `packages/mcp-servers/` - MCP servers (microservices in TypeScript, Python, C#, Java)
- `packages/ui/` - Angular frontend
- `infra/` - Infrastructure as code (Bicep, setup scripts)
- `docs/` - Architecture and API documentation (see `docs/orchestration.md` for orchestrator comparison)

---

For further details, consult the `README.md` and documentation in `docs/`. If any section is unclear or missing, please provide feedback to improve these instructions.