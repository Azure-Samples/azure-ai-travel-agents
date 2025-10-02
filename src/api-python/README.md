# Azure AI Travel Agents API (Python)

Python-based API server using Microsoft Agent Framework for multi-agent orchestration.

## Overview

This is the Python implementation of the orchestration layer using Microsoft Agent Framework (MAF). It provides the same API endpoints as the TypeScript version but uses Python and MAF for agent orchestration.

**Current Status: Phase 1 - Foundation Complete**

The foundation layer is implemented with configuration management, MCP client integration, and basic API endpoints. Microsoft Agent Framework integration will be added in Phase 2.

## Setup

### Prerequisites

- Python 3.12 or later
- pip or poetry for package management

### Installation

1. Install dependencies:

```bash
cd src/api-python
pip install -e .
```

For development:

```bash
pip install -e ".[dev]"
```

2. Copy and configure environment variables:

```bash
cp .env.sample .env
# Edit .env with your configuration
```

### Configuration

Edit `.env` file with your settings:

- **LLM Provider Selection**: Choose between different LLM providers:
  - `azure-openai` - Azure OpenAI (default)
  - `github-models` - GitHub Models
  - `docker-models` - Docker Models (local model runner)
  - `ollama-models` - Ollama Models
  - `foundry-local` - Azure Foundry Local (not yet implemented in Python)

- **Azure OpenAI**: Configure your Azure OpenAI endpoint and API key (for `azure-openai` provider)
- **GitHub Models**: Configure GitHub token and model (for `github-models` provider)
- **Docker Models**: Configure Docker endpoint and model (for `docker-models` provider)
- **Ollama Models**: Configure Ollama endpoint and model (for `ollama-models` provider)
- **MCP Server URLs**: Update URLs to match your environment (local/production)
- **Server Settings**: Configure port and logging level
- **OpenTelemetry**: Configure observability endpoints

**Example `.env` configuration**:

```env
# Choose your LLM provider
LLM_PROVIDER=azure-openai

# Azure OpenAI Configuration (for LLM_PROVIDER=azure-openai)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT=gpt-4o

# Or use GitHub Models (for LLM_PROVIDER=github-models)
# GITHUB_TOKEN=your-github-token
# GITHUB_MODEL=openai/gpt-4o

# Or use Docker Models (for LLM_PROVIDER=docker-models)
# DOCKER_MODEL_ENDPOINT=http://localhost:12434/engines/llama.cpp/v1
# DOCKER_MODEL=ai/phi4:14B-Q4_0

# ... (other configurations)
```

## Running the Server

### Development Mode

```bash
cd src/api-python
uvicorn src.main:app --reload --port 4000
```

Or:

```bash
python -m src.main
```

### Production Mode

```bash
uvicorn src.main:app --host 0.0.0.0 --port 4000
```

## API Endpoints

### Health Check

```bash
GET /api/health
```

Returns server health status.

### List Available Tools

```bash
GET /api/tools
```

Returns all available MCP tools from all servers.

### Chat Endpoint (Coming in Phase 4)

```bash
POST /api/chat
```

Multi-agent chat endpoint with streaming responses (to be implemented).

## Development

### Code Quality

Run linter:

```bash
ruff check src/
```

Auto-fix issues:

```bash
ruff check --fix src/
```

Format code:

```bash
ruff format src/
```

### Type Checking

```bash
mypy src/
```

### Testing

Run tests:

```bash
pytest
```

With coverage:

```bash
pytest --cov=src --cov-report=html
```

## Project Structure

```
src/api-python/
├── src/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration management
│   ├── orchestrator/        # MAF orchestration layer
│   │   ├── agents/          # Agent implementations
│   │   ├── tools/           # MCP client integration
│   │   └── workflow.py      # Workflow engine (Phase 3)
│   ├── api/                 # API routes (Phase 4)
│   ├── utils/               # Utility modules
│   └── tests/               # Test files
├── pyproject.toml           # Project configuration
├── .env.sample              # Environment template
└── README.md                # This file
```

## Implementation Status

- ✅ **Phase 1: Foundation** (Current)
  - Project structure
  - Configuration management
  - MCP client implementation
  - Tool registry
  - Basic API endpoints

- ⏸️ **Phase 2: Agent Implementation** (Next)
  - Agent base classes
  - Specialized agents
  - Tool integration

- ⏸️ **Phase 3: Workflow Orchestration**
  - MAF workflow engine
  - Agent coordination
  - State management

- ⏸️ **Phase 4: API Layer**
  - Chat endpoint
  - SSE streaming
  - Full API compatibility

## Documentation

See the comprehensive documentation in `docs/`:

- [MAF Documentation Hub](../../docs/MAF-README.md)
- [MAF Implementation Guide](../../docs/maf-implementation-guide.md)
- [MAF Migration Plan](../../docs/maf-migration-plan.md)

## Troubleshooting

### Import Errors

Make sure you've installed the package:

```bash
pip install -e .
```

### MCP Connection Errors

Check that MCP server URLs in `.env` are correct and servers are running.

### Environment Variable Errors

Ensure all required environment variables are set in `.env` file.

## License

Same as the main Azure AI Travel Agents project.
