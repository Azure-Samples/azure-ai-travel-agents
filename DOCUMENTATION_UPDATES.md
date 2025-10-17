# Documentation and Configuration Updates

## Overview

All documentation and configuration files have been updated to reflect the new standalone package structure where each orchestrator (LangChain.js and LlamaIndex.TS) is a complete, independent service with its own Express API server.

## Updated Files

### Configuration Files

#### 1. `azure.yaml`
**Changes:**
- Updated `api` service to `api-langchain` pointing to `packages/langchain-js`
- Added commented `api-llamaindex` service pointing to `packages/llamaindex-ts`
- Updated deployment workflow to use `api-langchain` by default
- Maintained all tool service configurations

**Deploy Options:**
```yaml
# Deploy LangChain.js (default)
services:
  api-langchain:
    project: packages/langchain-js

# Or deploy LlamaIndex.TS (uncomment in azure.yaml)
# api-llamaindex:
#   project: packages/llamaindex-ts
```

#### 2. `docker-compose.yml`
**Changes:**
- Renamed `web-api` service to `api-langchain-js`
- Updated container name to `api-langchain-js`
- Points to `./packages/langchain-js`
- Added commented `api-llamaindex-ts` service (both services use port 4000)
- Maintained all tool dependencies

**Usage:**
```bash
# Run LangChain.js service (default)
docker-compose up api-langchain-js

# Or run LlamaIndex.TS (uncomment service first, change port)
docker-compose up api-llamaindex-ts
```

### Documentation Files

#### 1. `docs/orchestration.md`
**Updates:**
- Changed entry point from `packages/api/src/index.ts` to service-specific paths
- Updated LangChain section: Location now `packages/langchain-js/`
- Updated LlamaIndex section: Location now `packages/llamaindex-ts/`
- Clarified that each orchestrator has its own Express server
- Updated system flow diagrams to reflect standalone services

**Key Changes:**
```markdown
Before: Location: `packages/api/src/orchestrator/langchain/`
After:  Location: `packages/langchain-js/` (standalone service with Express)

Before: Location: `packages/api/src/orchestrator/llamaindex/`
After:  Location: `packages/llamaindex-ts/` (standalone service with Express)
```

#### 2. `docs/technical-architecture.md`
**Updates:**
- Changed "API Layer (Express.js Server)" to "API Layers - Two Standalone Services"
- Updated component descriptions to reflect independent services
- Changed paths from `orchestrator/langchain/` to `packages/langchain-js/`
- Changed paths from `orchestrator/llamaindex/` to `packages/llamaindex-ts/`
- Clarified each service has its own Express server and dependencies

**Architecture Update:**
```markdown
Before: Single API package with orchestrator/ subdirectory
After:  Two standalone services:
        - packages/langchain-js/ (complete service)
        - packages/llamaindex-ts/ (complete service)
```

#### 3. `docs/overview.md`
**Updates:**
- Updated package references
- Changed directory paths
- Clarified standalone nature of services

#### 4. `docs/deployment-architecture.md`
**Updates:**
- Updated deployment model to show independent services
- Changed package paths throughout
- Updated service discovery examples

#### 5. `docs/development-guide.md`
**Updates:**
- Changed `cd packages/api` to `cd packages/langchain-js` (or `llamaindex-ts`)
- Updated npm install instructions for each service
- Clarified independent development workflows

#### 6. `docs/getting-started.md`
**Updates:**
- Updated quick start commands for new structure
- Changed package paths in examples
- Updated service URLs

#### 7. `docs/advanced-setup.md`
**Updates:**
- Updated configuration examples
- Changed file paths to new structure
- Updated service management instructions

#### 8. Other Documentation Files
All remaining `.md` files in `docs/` updated with:
- Package path corrections (`packages/api` → `packages/langchain-js` or `packages/llamaindex-ts`)
- Service reference updates
- Architecture diagram references

### Root Documentation Files

#### 1. `AGENTS.md`
**Major Updates:**
- Changed orchestrator locations:
  ```markdown
  Before: LangChain.js in `packages/api/`
  After:  LangChain.js in `packages/langchain-js/` (standalone service)
  
  Before: LlamaIndex.TS in `packages/api/src/orchestrator/llamaindex/`
  After:  LlamaIndex.TS in `packages/llamaindex-ts/` (standalone service)
  ```
- Updated directory structure diagram
- Removed nested orchestrator structure
- Clarified standalone service architecture

#### 2. `README.md`
**Note:** Main README doesn't have specific API paths, but architecture references are maintained.

## New Structure Summary

### Old Structure (Before)
```
packages/
├── api/                        # Single API package
│   └── src/
│       ├── index.ts            # Express server
│       └── orchestrator/
│           ├── langchain/      # LangChain orchestrator
│           └── llamaindex/     # LlamaIndex orchestrator
```

### New Structure (After)
```
packages/
├── langchain-js/               # Standalone LangChain service
│   ├── src/
│   │   ├── server.ts          # Express API server
│   │   ├── index.ts           # Orchestrator exports
│   │   ├── agents/
│   │   ├── graph/
│   │   ├── providers/
│   │   ├── tools/
│   │   └── mcp/
│   ├── Dockerfile
│   └── package.json
│
└── llamaindex-ts/              # Standalone LlamaIndex service
    ├── src/
    │   ├── server.ts          # Express API server
    │   ├── index.ts           # Orchestrator exports
    │   ├── providers/
    │   ├── tools/
    │   └── mcp/
    ├── Dockerfile
    └── package.json
```

## Key Documentation Points

### For Developers
1. Each service is completely independent
2. Run services separately: `cd packages/langchain-js && npm start`
3. No workspace configuration needed
4. Standard npm commands throughout

### For Deployment
1. Choose one orchestrator service to deploy
2. Update `azure.yaml` to deploy `api-langchain` or `api-llamaindex`
3. Each service runs on port 4000 by default (use PORT env to change)
4. Both expose identical REST API endpoints

### For Users
1. API endpoints remain the same
2. Health check shows which orchestrator is running
3. No breaking changes to API interface

## Verification

All documentation and configuration files have been systematically updated to:
- ✅ Remove references to `packages/api`
- ✅ Add references to `packages/langchain-js` and `packages/llamaindex-ts`
- ✅ Clarify standalone service architecture
- ✅ Update paths in code examples
- ✅ Update deployment configurations
- ✅ Remove pnpm references (replaced with npm)

## Related Documents

- `FINAL_STRUCTURE.md` - Complete package structure reference
- `MIGRATION_SUMMARY.md` - Migration details
- `LANGCHAIN_MIGRATION.md` - LangChain extraction details
- `ORCHESTRATOR_MIGRATION.md` - Full orchestrator migration details
