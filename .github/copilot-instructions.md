# Copilot Instructions for azure-ai-travel-agents

## Big Picture Architecture

- The platform is a modular AI travel agent system, composed of multiple microservices ("tools") for itinerary planning, destination recommendations, customer queries, and more.
- The main API gateway is in `src/api/`, orchestrating requests to backend services.
- Each tool is isolated in its own directory under `src/tools/` and communicates via HTTP APIs or message passing.
- The frontend UI is in `src/ui/` (Angular + Tailwind CSS), talking to the API gateway.
- Infrastructure is managed with Bicep templates in `infra/` and setup scripts in `infra/hooks/`.

## Developer Workflows

- **Build & Run All Services:**  
  Run `./run.sh` from the repo root to build and start all services locally via Docker Compose.
- **Service-Specific Development:**  
  Each tool under `src/tools/` can be built and run independently using its language's standard commands (e.g., `npm`, `mvnw`, `python`).
- **UI Development:**  
  Run `npm start` in `src/ui/` for local frontend development.
- **Infrastructure Deployment:**  
  Use Bicep files in `infra/` and scripts in `infra/hooks/` for Azure deployments.

## Project-Specific Conventions

- **Service Boundaries:**  
  Each tool is strictly separated; cross-service communication uses HTTP APIs or message passing, not direct imports.
- **Configuration:**  
  Shared config files are in the repo root (`azure.yaml`, `repomix.config.json`). Service-specific configs are in their respective directories.
- **Testing:**  
  Tests are colocated with source files or follow language-specific conventions (e.g., `.spec.ts` for TypeScript, `test/` for Python).
- **Documentation:**  
  Key architectural docs are in `docs/` (see `docs/technical-architecture.md`, `docs/deployment-architecture.md`).

## Integration Points & External Dependencies

- **Azure Services:**  
  Provisioned via Bicep templates; see `infra/main.bicep`.
- **LLMs:**  
  Model integration details are in `llms.txt` and `src/api/src/orchestrator/llamaindex/`.

## Patterns & Examples

- **Adding a New Tool:**  
  Scaffold under `src/tools/`, provide a `Dockerfile`, and register with the API gateway.
- **Extending the UI:**  
  Add Angular components in `src/ui/src/app/`, update routing as needed.
- **Service Communication:**  
  Use HTTP clients (see `src/api/src/mcp/mcp-http-client.ts`) for inter-service calls.

## Key Files & Directories

- `src/api/` - API gateway and orchestrator logic
- `src/tools/` - Microservices (each in its own subdirectory)
- `src/ui/` - Angular frontend
- `infra/` - Infrastructure as code (Bicep, setup scripts)
- `docs/` - Architecture and API documentation

---

For further details, consult the `README.md` and documentation in `docs/`. If any section is unclear or missing, please provide feedback to improve these instructions.