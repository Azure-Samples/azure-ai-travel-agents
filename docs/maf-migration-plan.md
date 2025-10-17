# Migration Plan: LlamaIndex.TS to Microsoft Agent Framework

## Executive Summary

This document outlines the migration strategy from the current LlamaIndex.TS orchestration layer (TypeScript) to the new Microsoft Agent Framework (MAF) implementation in Python.

## Current State Analysis

### Existing Architecture

**Location**: `packages/api/`

**Technology Stack**:
- Node.js 22.16+ with TypeScript
- Express.js 5.0
- LlamaIndex.TS 0.10.3
- @llamaindex/tools 0.1.2

**Components**:
- Main API server: `packages/api/src/index.ts`
- Orchestrator: `packages/llamaindex-ts/src/`
  - Agent setup: `index.ts`
  - Provider configuration: `providers/`
  - Tool configuration: `tools/index.ts`
- MCP clients: `packages/api/src/mcp/`
  - HTTP client: `mcp-http-client.ts`
  - SSE client: `mcp-sse-client.ts`
  - Tool list: `mcp-tools.ts`

**Agents**:
1. TravelAgent (Triage/Root)
2. CustomerQueryAgent
3. DestinationRecommendationAgent
4. ItineraryPlanningAgent
5. EchoAgent

**Endpoints**:
- `GET /api/health` - Health check
- `GET /api/tools` - List available MCP tools
- `POST /api/chat` - Chat with streaming responses (SSE)

### Target Architecture

**Location**: `packages/api-python/`

**Technology Stack**:
- Python 3.12+
- FastAPI + Uvicorn
- Microsoft Agent Framework (agent-framework)
- httpx for async HTTP

**Key Changes**:
- Replace LlamaIndex.TS with MAF
- Replace TypeScript with Python
- Maintain same API contract
- Keep MCP tool integration
- Preserve OpenTelemetry instrumentation

## Migration Strategy

### Approach: Parallel Deployment

We will use a parallel deployment strategy to minimize risk:

1. **Build new Python API alongside existing TypeScript API**
2. **Deploy both versions simultaneously**
3. **Gradually shift traffic using feature flags or routing**
4. **Validate functionality and performance**
5. **Complete migration and deprecate old API**

### Phase 1: Foundation (Week 1-2)

#### Objectives
- Set up Python project structure
- Implement core MCP client integration
- Create configuration management

#### Tasks
- [x] Create design documentation
- [x] Create implementation guide
- [ ] Create `packages/api-python/` directory structure
- [ ] Set up `pyproject.toml` with dependencies
- [ ] Implement configuration management (`config.py`)
- [ ] Create `.env.sample` for Python API
- [ ] Implement HTTP MCP client
- [ ] Implement SSE MCP client (if needed for MAF)
- [ ] Create tool registry

#### Deliverables
- Working Python project structure
- MCP client implementations
- Configuration system

#### Success Criteria
- Can connect to all MCP servers
- Can list tools from MCP servers
- Configuration loads correctly

### Phase 2: Agent Implementation (Week 3-4)

#### Objectives
- Implement all agents using MAF
- Create agent base classes
- Implement tool integration

#### Tasks
- [ ] Install and configure Microsoft Agent Framework
- [ ] Create base agent class
- [ ] Implement TriageAgent
- [ ] Implement CustomerQueryAgent
- [ ] Implement DestinationRecommendationAgent
- [ ] Implement ItineraryPlanningAgent
- [ ] Implement EchoAgent
- [ ] Create tool wrappers for MCP calls

#### Deliverables
- All agents implemented with MAF
- Tool integration working
- Agent handoff logic implemented

#### Success Criteria
- Each agent can process requests
- Tools can be called successfully
- Agent handoff works correctly

### Phase 3: Workflow Orchestration (Week 5-6)

#### Objectives
- Implement MAF workflow engine
- Create multi-agent coordination
- Implement state management

#### Tasks
- [ ] Create workflow orchestrator
- [ ] Implement agent coordination logic
- [ ] Add parallel execution support
- [ ] Add sequential execution support
- [ ] Implement conversation state management
- [ ] Add error handling and retry logic
- [ ] Implement circuit breaker for external calls

#### Deliverables
- Working workflow orchestration
- Multi-agent coordination
- Robust error handling

#### Success Criteria
- Workflows execute correctly
- Agents coordinate properly
- Errors are handled gracefully
- State is maintained across requests

### Phase 4: API Layer (Week 7-8)

#### Objectives
- Implement FastAPI server
- Create API endpoints
- Implement SSE streaming

#### Tasks
- [ ] Create FastAPI application
- [ ] Implement `/api/health` endpoint
- [ ] Implement `/api/tools` endpoint
- [ ] Implement `/api/chat` endpoint with streaming
- [ ] Add CORS support
- [ ] Add request validation
- [ ] Implement SSE response streaming
- [ ] Add request/response logging

#### Deliverables
- FastAPI server with all endpoints
- SSE streaming support
- API compatibility with existing UI

#### Success Criteria
- All endpoints respond correctly
- SSE streaming works
- API contract matches existing API
- UI can communicate with new API

### Phase 5: Observability (Week 9)

#### Objectives
- Add OpenTelemetry instrumentation
- Implement logging
- Add metrics collection

#### Tasks
- [ ] Configure OpenTelemetry SDK
- [ ] Add tracing to agents
- [ ] Add tracing to workflow
- [ ] Add tracing to API endpoints
- [ ] Implement structured logging
- [ ] Add performance metrics
- [ ] Configure OTLP exporter
- [ ] Test with Aspire Dashboard

#### Deliverables
- Full OpenTelemetry instrumentation
- Structured logging
- Metrics collection

#### Success Criteria
- Traces appear in Aspire Dashboard
- Logs are structured and useful
- Metrics are collected
- Performance is monitored

### Phase 6: Testing (Week 10-11)

#### Objectives
- Create comprehensive test suite
- Validate all functionality
- Performance testing

#### Tasks
- [ ] Write unit tests for agents
- [ ] Write unit tests for workflow
- [ ] Write unit tests for API endpoints
- [ ] Write integration tests for agent coordination
- [ ] Write integration tests for MCP integration
- [ ] Write end-to-end tests
- [ ] Perform load testing
- [ ] Perform stress testing
- [ ] Validate error scenarios
- [ ] Test concurrent requests

#### Deliverables
- Complete test suite
- Performance benchmarks
- Test coverage report

#### Success Criteria
- >80% code coverage
- All tests passing
- Performance acceptable
- No critical bugs

### Phase 7: Containerization (Week 12)

#### Objectives
- Create Docker configuration
- Update docker-compose
- Test containerized deployment

#### Tasks
- [ ] Create Dockerfile for Python API
- [ ] Optimize Docker image size
- [ ] Update `docker-compose.yml`
- [ ] Add health check to container
- [ ] Test container locally
- [ ] Test with all services
- [ ] Update environment variable documentation
- [ ] Create container startup scripts

#### Deliverables
- Working Docker container
- Updated docker-compose configuration
- Container documentation

#### Success Criteria
- Container builds successfully
- Container runs in Docker Compose
- All services can communicate
- Health checks work

### Phase 8: Documentation (Week 13)

#### Objectives
- Update all documentation
- Create migration guide
- Document new architecture

#### Tasks
- [ ] Update technical architecture docs
- [ ] Update API documentation
- [ ] Create developer guide for MAF
- [ ] Document workflow patterns
- [ ] Create troubleshooting guide
- [ ] Update deployment documentation
- [ ] Create video tutorials (optional)
- [ ] Update README files

#### Deliverables
- Updated documentation
- Migration guide
- Developer resources

#### Success Criteria
- Documentation is accurate
- Developers can understand new architecture
- Migration path is clear

### Phase 9: Integration Testing (Week 14-15)

#### Objectives
- Test with UI
- Validate all user scenarios
- Fix integration issues

#### Tasks
- [ ] Connect UI to new Python API
- [ ] Test all user workflows
- [ ] Test tool selection
- [ ] Test streaming responses
- [ ] Test error scenarios
- [ ] Compare behavior with TypeScript API
- [ ] Fix any discrepancies
- [ ] Performance comparison

#### Deliverables
- Validated UI integration
- Fixed integration issues
- Performance comparison

#### Success Criteria
- UI works correctly with Python API
- All features function properly
- Performance is acceptable or better
- No regression in functionality

### Phase 10: Deployment Preparation (Week 16)

#### Objectives
- Prepare for production deployment
- Update infrastructure
- Create rollback plan

#### Tasks
- [ ] Update Azure deployment configuration
- [ ] Update Bicep templates
- [ ] Update environment variables
- [ ] Create deployment scripts
- [ ] Test deployment to staging
- [ ] Create rollback procedures
- [ ] Update monitoring alerts
- [ ] Create runbook

#### Deliverables
- Deployment configuration
- Staging deployment
- Rollback plan

#### Success Criteria
- Can deploy to staging
- Rollback plan is tested
- Monitoring is configured

### Phase 11: Gradual Rollout (Week 17-18)

#### Objectives
- Deploy to production
- Monitor closely
- Gradually increase traffic

#### Tasks
- [ ] Deploy Python API to production (disabled)
- [ ] Enable for internal testing
- [ ] Enable for 10% of traffic
- [ ] Monitor metrics and errors
- [ ] Enable for 50% of traffic
- [ ] Monitor and adjust
- [ ] Enable for 100% of traffic
- [ ] Monitor for issues

#### Deliverables
- Production deployment
- Traffic migration
- Monitoring data

#### Success Criteria
- No increase in errors
- Performance is acceptable
- User experience is maintained
- All features working

### Phase 12: Deprecation (Week 19-20)

#### Objectives
- Deprecate TypeScript API
- Clean up old code
- Final documentation

#### Tasks
- [ ] Mark TypeScript API as deprecated
- [ ] Set deprecation timeline
- [ ] Notify stakeholders
- [ ] Remove TypeScript API from deployment
- [ ] Archive TypeScript code
- [ ] Update all documentation
- [ ] Clean up dependencies
- [ ] Final review

#### Deliverables
- Deprecated TypeScript API
- Cleaned repository
- Updated documentation

#### Success Criteria
- TypeScript API removed from production
- Documentation reflects new architecture
- No dependencies on old code

## Risk Management

### High Risks

#### 1. API Contract Breaking Changes
**Risk**: New API doesn't match existing contract, breaking UI
**Mitigation**: 
- Extensive integration testing
- API contract validation
- Feature flags for gradual rollout

#### 2. Performance Degradation
**Risk**: Python implementation is slower than TypeScript
**Mitigation**:
- Performance benchmarking early
- Optimization of critical paths
- Async/await properly used
- Connection pooling

#### 3. MAF Immaturity
**Risk**: MAF is new and may have bugs or limitations
**Mitigation**:
- Thorough testing
- Fallback mechanisms
- Stay updated with MAF releases
- Report issues to Microsoft

#### 4. MCP Integration Issues
**Risk**: MCP clients don't work correctly in Python
**Mitigation**:
- Test MCP integration early
- Implement robust error handling
- Use existing MCP protocol knowledge

### Medium Risks

#### 1. State Management Complexity
**Risk**: Workflow state is difficult to manage in MAF
**Mitigation**:
- Use MAF's built-in state management
- Implement proper session handling
- Test state persistence

#### 2. Streaming Response Issues
**Risk**: SSE streaming doesn't work correctly
**Mitigation**:
- Test streaming early
- Use proven libraries (sse-starlette)
- Validate with UI team

#### 3. Deployment Complexity
**Risk**: Deploying Python API alongside TypeScript is complex
**Mitigation**:
- Clear deployment documentation
- Automated deployment scripts
- Staging environment testing

### Low Risks

#### 1. Documentation Gaps
**Risk**: Documentation is incomplete
**Mitigation**:
- Documentation as part of each phase
- Review process
- Community feedback

## Success Metrics

### Technical Metrics
- **API Response Time**: < 2s for 95th percentile
- **Error Rate**: < 0.1%
- **Uptime**: > 99.9%
- **Test Coverage**: > 80%
- **Build Time**: < 5 minutes

### Business Metrics
- **User Satisfaction**: No decrease
- **Feature Completeness**: 100% parity
- **Performance**: Equal or better
- **Maintenance Cost**: Equal or lower

## Rollback Plan

### Triggers for Rollback
- Error rate > 1%
- Performance degradation > 50%
- Critical feature broken
- Security vulnerability discovered

### Rollback Procedure
1. Switch traffic back to TypeScript API
2. Disable Python API
3. Investigate issues
4. Fix and redeploy
5. Gradually re-enable

### Time to Rollback
- Target: < 5 minutes
- Maximum acceptable: 15 minutes

## Communication Plan

### Stakeholders
- Engineering team
- Product management
- UI/UX team
- DevOps team
- End users (if applicable)

### Communication Frequency
- Weekly status updates
- Immediate notification of blockers
- Bi-weekly demos
- Post-deployment review

### Communication Channels
- Team meetings
- Slack/Teams
- Email updates
- Documentation

## Conclusion

This migration plan provides a comprehensive roadmap for transitioning from LlamaIndex.TS to Microsoft Agent Framework. The parallel deployment strategy minimizes risk while allowing thorough testing and validation.

**Estimated Timeline**: 20 weeks (5 months)
**Team Size**: 2-3 engineers
**Total Effort**: ~40-60 person-weeks

## Next Steps

1. ✅ Create design and implementation documentation
2. [ ] Get approval from stakeholders
3. [ ] Allocate resources and team
4. [ ] Begin Phase 1: Foundation
5. [ ] Set up project tracking (Jira, GitHub Projects, etc.)
6. [ ] Schedule regular check-ins

## Appendix

### A. Technology Comparison

| Aspect | LlamaIndex.TS | Microsoft Agent Framework |
|--------|---------------|---------------------------|
| Language | TypeScript | Python |
| Runtime | Node.js | Python |
| Agent Model | Multi-agent | Multi-agent |
| LLM Support | Multiple providers | Azure OpenAI, OpenAI, etc. |
| Tool Calling | Yes | Yes |
| Workflow | Yes | Yes |
| State Management | Yes | Yes |
| Community | Growing | New, Microsoft-backed |

### B. Resource Requirements

**Development**:
- 2-3 Senior Python developers
- 1 DevOps engineer (part-time)
- 1 QA engineer (part-time)

**Infrastructure**:
- Staging environment
- Additional container resources during migration
- Monitoring and observability tools

**Budget**:
- Development time: 40-60 person-weeks
- Infrastructure: Minimal additional cost
- Training: MAF documentation review

### C. Dependencies

**External**:
- Microsoft Agent Framework releases
- Azure OpenAI availability
- MCP tool server stability

**Internal**:
- UI team coordination
- DevOps team support
- Stakeholder approval

### D. References

- [Microsoft Agent Framework](https://github.com/microsoft/agent-framework)
- [MAF Documentation](https://learn.microsoft.com/en-us/agent-framework/)
- [Current Technical Architecture](./technical-architecture.md)
- [MAF Design Document](./maf-orchestration-design.md)
- [MAF Implementation Guide](./maf-implementation-guide.md)
