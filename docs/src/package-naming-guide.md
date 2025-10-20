---
title: Package Naming Convention
createTime: 2025/10/17 22:00:00
permalink: /guide/package-naming/
---

# Package Naming Convention Guide

## Overview

This repository uses a **generic naming convention** in documentation to maintain flexibility and clarity across different implementations.

## Naming Pattern

### Generic Format
```
packages/api-{orchestrator}-{language}/
packages/ui-{framework}/
```

### Actual Packages in Repository

| Generic Reference | Actual Package Name | Description |
|------------------|---------------------|-------------|
| `packages/api-{orchestrator}-{language}` | `packages/api-langchain-js` | LangChain.js orchestrator (TypeScript) |
| `packages/api-{orchestrator}-{language}` | `packages/api-llamaindex-ts` | LlamaIndex.TS orchestrator (TypeScript) |
| `packages/api-{orchestrator}-{language}` | `packages/api-maf-python` | Microsoft Agent Framework (Python) |
| `packages/ui-{framework}` | `packages/ui-angular` | Angular frontend application |
| `packages/mcp-servers/` | `packages/mcp-servers/` | MCP tool servers (various languages) |

## Why Generic References?

1. **Flexibility**: Easy to add new orchestrators or frameworks without updating all docs
2. **Clarity**: Readers understand the pattern and can substitute their chosen implementation
3. **Maintainability**: Documentation remains valid across different configurations
4. **Language Agnostic**: Supports multiple programming language implementations

## How to Use This Documentation

When you see a generic reference like:

```bash
# Generic reference in docs:
cd packages/api-{orchestrator}-{language}
npm start
```

Replace it with your actual package name:

```bash
# For LangChain.js:
cd packages/api-langchain-js
npm start

# For LlamaIndex.TS:
cd packages/api-llamaindex-ts
npm start

# For MAF Python:
cd packages/api-maf-python
python -m uvicorn main:app
```

## Package Structure

```
azure-ai-travel-agents/
├── packages/
│   ├── api-langchain-js/          # LangChain.js + TypeScript
│   │   ├── src/
│   │   │   ├── server.ts          # Express API server
│   │   │   ├── agents/            # Agent implementations
│   │   │   ├── graph/             # LangGraph workflow
│   │   │   └── providers/         # LLM providers
│   │   └── package.json
│   │
│   ├── api-llamaindex-ts/         # LlamaIndex.TS + TypeScript
│   │   ├── src/
│   │   │   ├── server.ts          # Express API server
│   │   │   ├── providers/         # LLM providers
│   │   │   └── tools/             # Tool configurations
│   │   └── package.json
│   │
│   ├── api-maf-python/            # Microsoft Agent Framework + Python
│   │   ├── src/
│   │   │   ├── main.py            # FastAPI server
│   │   │   └── orchestrator/      # MAF orchestrator
│   │   └── pyproject.toml
│   │
│   ├── ui-angular/                # Angular + TypeScript
│   │   ├── src/
│   │   │   └── app/               # Angular application
│   │   └── package.json
│   │
│   └── mcp-servers/               # MCP tool servers
│       ├── customer-query/        # C# implementation
│       ├── destination-recommendation/ # Java implementation
│       ├── itinerary-planning/    # Python implementation
│       └── echo-ping/             # TypeScript implementation
```

## Examples

### Starting Different API Services

**Using LangChain.js:**
```bash
cd packages/api-langchain-js
npm install
npm start
```

**Using LlamaIndex.TS:**
```bash
cd packages/api-llamaindex-ts
npm install
npm start
```

**Using MAF Python:**
```bash
cd packages/api-maf-python
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

### Environment Files

Each API service has its own environment configuration:

```bash
# Generic pattern
packages/api-{orchestrator}-{language}/.env

# Actual files
packages/api-langchain-js/.env
packages/api-llamaindex-ts/.env
packages/api-maf-python/.env
```

### Deployment Configuration

**Azure YAML:**
```yaml
# Choose your orchestrator
services:
  api-langchain:
    project: packages/api-langchain-js
  # OR
  api-llamaindex:
    project: packages/api-llamaindex-ts
  # OR
  api-maf:
    project: packages/api-maf-python
```

## Quick Reference

| You See | Examples | Current Implementations |
|---------|----------|------------------------|
| `{orchestrator}` | `langchain`, `llamaindex`, `maf` | LangChain, LlamaIndex, MAF |
| `{language}` | `js`, `ts`, `python` | JavaScript, TypeScript, Python |
| `{framework}` | `angular`, `react`, `vue` | Angular |

## Converting Documentation Examples

When following documentation:

1. **Identify** the generic placeholder (e.g., `{orchestrator}-{language}`)
2. **Choose** your implementation (e.g., `langchain-js`)
3. **Replace** the placeholder with your choice
4. **Execute** the command with the actual package name

## Adding New Implementations

When adding a new orchestrator or UI framework:

1. Follow the naming pattern: `api-{orchestrator}-{language}` or `ui-{framework}`
2. Place in the `packages/` directory
3. Update `azure.yaml` and `docker-compose.yml` with the specific name
4. Documentation will automatically apply using generic references

## Configuration Files

**Note**: Configuration files (azure.yaml, docker-compose.yml) use **specific names**, not generic placeholders. This is intentional as these files need concrete package paths to function.

Documentation uses generic references for explanation and examples, while configuration files use actual package names for execution.

## Summary

- **Documentation**: Uses `packages/api-{orchestrator}-{language}` (generic)
- **File System**: Uses `packages/api-langchain-js` (specific)
- **Configuration**: Uses specific names (azure.yaml, docker-compose.yml)

This approach provides clarity in documentation while maintaining specificity in implementation.
