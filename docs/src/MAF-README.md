# Microsoft Agent Framework Orchestration Documentation

## Overview

This directory contains comprehensive documentation for reimplementing the orchestration layer of the Azure AI Travel Agents application using the Microsoft Agent Framework (MAF) Python SDK.

## Documentation Index

### 📋 Planning Documents

1. **[MAF Orchestration Design](./maf-orchestration-design.md)** ⭐ Start Here
   - Complete architecture design for MAF-based orchestration
   - High-level system architecture
   - Component design and integration approach
   - Directory structure and technology stack
   - Workflow patterns (sequential, parallel, conditional)
   - Best practices and security considerations

2. **[MAF Migration Plan](./maf-migration-plan.md)**
   - 20-week phased migration strategy
   - Detailed implementation phases
   - Risk management and mitigation strategies
   - Success metrics and rollback procedures
   - Resource requirements and dependencies
   - Parallel deployment approach

3. **[MAF Comparison: LlamaIndex.TS vs MAF](./maf-comparison.md)**
   - Side-by-side comparison of current and proposed solutions
   - Feature comparison matrix
   - Performance characteristics
   - Pros and cons analysis
   - Decision factors and recommendations

### 🛠️ Implementation Guides

4. **[MAF Implementation Guide](./maf-implementation-guide.md)** ⭐ Technical Reference
   - Step-by-step implementation instructions
   - Code examples for agents, tools, and workflows
   - MCP client implementation details
   - FastAPI integration patterns
   - Testing strategies and deployment guidelines
   - Best practices for production

5. **[MAF Quick Reference](./maf-quick-reference.md)** 📖 Cheat Sheet
   - Common code patterns and snippets
   - Agent creation examples
   - Tool definition patterns
   - Workflow orchestration examples
   - Error handling patterns
   - Observability setup
   - Testing examples

## Quick Start

### For Decision Makers

1. Read the **[MAF Comparison](./maf-comparison.md)** to understand the differences between current and proposed solutions
2. Review the **[MAF Migration Plan](./maf-migration-plan.md)** to understand timeline, resources, and risks
3. Decide on approach: Continue with LlamaIndex.TS, migrate to MAF, or parallel deployment

### For Architects

1. Start with **[MAF Orchestration Design](./maf-orchestration-design.md)** to understand the architecture
2. Review workflow patterns and integration approach
3. Validate the design meets your requirements
4. Provide feedback or adjustments

### For Developers

1. Review **[MAF Implementation Guide](./maf-implementation-guide.md)** for implementation details
2. Keep **[MAF Quick Reference](./maf-quick-reference.md)** handy during development
3. Follow the step-by-step instructions
4. Refer to code examples for common patterns

### For Project Managers

1. Review **[MAF Migration Plan](./maf-migration-plan.md)** for timeline and phases
2. Understand resource requirements
3. Plan team allocation and training
4. Set up project tracking

## Key Concepts

### What is Microsoft Agent Framework?

Microsoft Agent Framework (MAF) is a Python SDK for building AI agent applications. It provides:

- **Multi-agent orchestration** - Coordinate multiple specialized agents
- **Workflow management** - Define complex agent workflows
- **Tool integration** - Connect agents to external tools and services
- **LLM integration** - Native support for Azure OpenAI and other LLMs
- **State management** - Built-in conversation and workflow state
- **Observability** - OpenTelemetry integration

### Why Consider MAF?

**Advantages**:
- ✅ Native Azure AI integration
- ✅ Microsoft backing and support
- ✅ Python AI/ML ecosystem access
- ✅ Modern agent architecture patterns
- ✅ Strong type safety with Pydantic
- ✅ FastAPI for high performance

**Considerations**:
- ⚠️ Requires migration from TypeScript to Python
- ⚠️ New framework (less mature than alternatives)
- ⚠️ Custom MCP integration needed
- ⚠️ Team needs Python expertise

### Migration Approach

We recommend a **parallel deployment** strategy:

1. **Build** new Python API alongside existing TypeScript API
2. **Deploy** both versions simultaneously
3. **Test** thoroughly with subset of traffic
4. **Migrate** gradually using feature flags or routing
5. **Validate** functionality and performance
6. **Complete** migration and deprecate old API

This approach minimizes risk while allowing thorough validation.

## Architecture Overview

### Current Architecture (LlamaIndex.TS)

```
┌─────────────┐
│  Angular UI │
└──────┬──────┘
       │ HTTP/SSE
┌──────▼──────────────────┐
│  TypeScript API         │
│  (Express.js)           │
│  ┌──────────────────┐   │
│  │ LlamaIndex.TS    │   │
│  │ Orchestration    │   │
│  └──────────────────┘   │
└──────┬──────────────────┘
       │ MCP Protocol
┌──────▼──────────────────┐
│  MCP Tool Servers       │
│  (Python, Java, C#, TS) │
└─────────────────────────┘
```

### Proposed Architecture (MAF)

```
┌─────────────┐
│  Angular UI │
└──────┬──────┘
       │ HTTP/SSE
┌──────▼──────────────────┐
│  Python API             │
│  (FastAPI)              │
│  ┌──────────────────┐   │
│  │ MAF              │   │
│  │ Orchestration    │   │
│  └──────────────────┘   │
└──────┬──────────────────┘
       │ MCP Protocol
┌──────▼──────────────────┐
│  MCP Tool Servers       │
│  (Python, Java, C#, TS) │
└─────────────────────────┘
```

**Key Change**: Replace LlamaIndex.TS/TypeScript API with MAF/Python API while maintaining same MCP tool servers.

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- Set up Python project structure
- Implement MCP client integration
- Create configuration management

### Phase 2: Agent Implementation (Week 3-4)
- Implement all agents using MAF
- Create tool integration layer
- Implement agent handoff logic

### Phase 3: Workflow Orchestration (Week 5-6)
- Implement MAF workflow engine
- Add multi-agent coordination
- Implement state management

### Phase 4: API Layer (Week 7-8)
- Create FastAPI server
- Implement all endpoints
- Add SSE streaming support

### Phase 5-12: Testing, Deployment, Migration
- See [Migration Plan](./maf-migration-plan.md) for details

## Technology Stack

### Core Dependencies
- `agent-framework` - Microsoft Agent Framework Python SDK
- `fastapi` - Modern web framework
- `uvicorn` - ASGI server
- `httpx` - Async HTTP client
- `pydantic` - Data validation
- `sse-starlette` - SSE streaming

### Azure Integration
- `azure-ai-inference` - Azure OpenAI client
- `azure-identity` - Authentication
- `azure-ai-projects` - Azure AI integration

### Observability
- `opentelemetry-api` - Telemetry API
- `opentelemetry-sdk` - Telemetry SDK
- OpenTelemetry exporters for OTLP

## Getting Help

### Documentation Resources

- **MAF GitHub**: https://github.com/microsoft/agent-framework
- **MAF Docs**: https://learn.microsoft.com/en-us/agent-framework/
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **Pydantic Docs**: https://docs.pydantic.dev/

### Project-Specific

- Review existing documentation in this directory
- Check code examples in the implementation guide
- Refer to quick reference for common patterns

### Issues and Questions

- Open GitHub issues for bugs or feature requests
- Use discussions for questions
- Check existing issues for similar problems

## Contributing

When contributing to the MAF implementation:

1. **Follow the design** - Adhere to the architecture in the design document
2. **Use best practices** - Follow patterns in the implementation guide
3. **Test thoroughly** - Unit, integration, and E2E tests
4. **Document changes** - Update relevant documentation
5. **Code review** - Get review before merging

### Code Style

- **Python**: Follow PEP 8, use Ruff for linting
- **Type hints**: Use for all public APIs
- **Async/await**: Use consistently for I/O operations
- **Error handling**: Implement proper exception handling
- **Logging**: Use structured logging

### Testing Requirements

- Unit tests for all agents and tools
- Integration tests for workflows
- E2E tests for API endpoints
- Performance tests for critical paths
- Minimum 80% code coverage

## Timeline and Status

### Current Status
- ✅ Design documentation complete
- ✅ Implementation guide complete
- ✅ Migration plan complete
- ✅ Comparison analysis complete
- ✅ Quick reference complete
- ⏸️ Implementation pending approval

### Estimated Timeline
- **Total Duration**: 20 weeks (5 months)
- **Team Size**: 2-3 engineers
- **Effort**: 40-60 person-weeks

### Next Steps
1. Get stakeholder approval
2. Allocate resources
3. Begin Phase 1: Foundation
4. Set up project tracking

## Success Criteria

### Technical
- ✅ API response time < 2s (95th percentile)
- ✅ Error rate < 0.1%
- ✅ Uptime > 99.9%
- ✅ Test coverage > 80%

### Functional
- ✅ 100% feature parity with current implementation
- ✅ All agents working correctly
- ✅ MCP tool integration functional
- ✅ Streaming responses working

### Business
- ✅ No degradation in user experience
- ✅ Equal or better performance
- ✅ Smooth migration with no downtime
- ✅ Maintainable and well-documented code

## Risks and Mitigations

### High Risks
1. **API Breaking Changes** → Extensive testing, feature flags
2. **Performance Issues** → Early benchmarking, optimization
3. **MAF Limitations** → Fallback mechanisms, stay updated

### Medium Risks
1. **State Management** → Use MAF built-in, thorough testing
2. **Streaming Issues** → Test early, use proven libraries
3. **Deployment Complexity** → Clear documentation, automation

See [Migration Plan](./maf-migration-plan.md) for detailed risk management.

## Feedback and Iteration

This is a living set of documentation that will evolve based on:
- Implementation experience
- Team feedback
- MAF framework updates
- Best practice discoveries

**How to provide feedback**:
1. Open a GitHub issue
2. Submit a pull request with improvements
3. Discuss in team meetings
4. Update documentation as you learn

## License

Same as the main Azure AI Travel Agents project.

## Maintainers

- Project Team
- Azure AI Samples Team
- Microsoft Agent Framework Team

---

**Last Updated**: 2025-01-02

**Document Version**: 1.0

**Status**: Planning Phase ✅

For questions or clarification, please open an issue or contact the project team.
