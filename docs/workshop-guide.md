# Azure AI Travel Agents Workshop Guide

**Duration**: 4-6 hours (can be split into multiple sessions)  
**Level**: Intermediate to Advanced  
**Prerequisites**: Familiarity with JavaScript/TypeScript, basic Azure knowledge

## Workshop Overview

This comprehensive workshop provides hands-on experience building and deploying multi-agent AI systems using the Azure AI Travel Agents application. Participants will learn about AI agent orchestration, Model Context Protocol (MCP), and Azure cloud deployment strategies.

## Learning Objectives

By the end of this workshop, participants will be able to:

1. **Understand AI Agent Architecture**: Grasp multi-agent systems and orchestration patterns
2. **Master Model Context Protocol (MCP)**: Build and deploy MCP servers in multiple languages
3. **Implement LlamaIndex.TS Orchestration**: Create agent workflows and communication patterns
4. **Deploy to Azure**: Use Azure AI Foundry and Container Apps for production deployment
5. **Monitor and Debug**: Implement observability and troubleshooting strategies

## Workshop Agenda

### Phase 1: Foundation & Setup (60 minutes)

#### Module 1.1: Introduction to AI Agents (20 minutes)
- **Theory**: Multi-agent systems and their benefits
- **Demo**: Azure AI Travel Agents system overview
- **Discussion**: Use cases and design patterns

#### Module 1.2: Model Context Protocol Fundamentals (20 minutes)
- **Theory**: MCP concepts, servers, clients, and tools
- **Demo**: MCP communication patterns (HTTP vs SSE)
- **Hands-on**: Examine existing MCP servers

#### Module 1.3: Environment Setup (20 minutes)
- **Hands-on**: Clone repository and set up development environment
- **Verification**: Run the application locally
- **Troubleshooting**: Common setup issues

### Phase 2: Building MCP Servers (90 minutes)

#### Module 2.1: Simple MCP Server (TypeScript) (30 minutes)
- **Hands-on**: Extend the echo-ping server
- **Exercise**: Add a new tool to the echo server
- **Learning**: HTTP-based MCP implementation

#### Module 2.2: Advanced MCP Server (Python) (30 minutes)
- **Hands-on**: Create a custom weather MCP server
- **Exercise**: Implement SSE-based communication
- **Learning**: Error handling and validation

#### Module 2.3: Cross-Language Integration (30 minutes)
- **Hands-on**: Integrate the new server with the orchestrator
- **Exercise**: Add agent configuration and registration
- **Learning**: Multi-language service coordination

### Phase 3: Agent Orchestration (75 minutes)

#### Module 3.1: LlamaIndex.TS Fundamentals (25 minutes)
- **Theory**: Agent creation and tool binding
- **Demo**: Examine existing agent implementations
- **Discussion**: Agent specialization strategies

#### Module 3.2: Building Custom Agents (25 minutes)
- **Hands-on**: Create a specialized travel budget agent
- **Exercise**: Define system prompts and tool selection
- **Learning**: Agent behavior customization

#### Module 3.3: Multi-Agent Workflows (25 minutes)
- **Hands-on**: Implement agent handoff patterns
- **Exercise**: Create complex travel planning workflows
- **Learning**: Orchestration and coordination patterns

### Phase 4: Azure Deployment (90 minutes)

#### Module 4.1: Azure AI Foundry Integration (30 minutes)
- **Theory**: Azure AI services and capabilities
- **Hands-on**: Configure Azure OpenAI integration
- **Exercise**: Set up Azure AI project

#### Module 4.2: Container Apps Deployment (30 minutes)
- **Hands-on**: Deploy using Azure Developer CLI
- **Exercise**: Configure container environments
- **Learning**: Scaling and networking concepts

#### Module 4.3: Production Considerations (30 minutes)
- **Theory**: Security, monitoring, and cost optimization
- **Hands-on**: Set up OpenTelemetry monitoring
- **Exercise**: Configure alerts and dashboards

### Phase 5: Advanced Topics & Wrap-up (45 minutes)

#### Module 5.1: Observability and Debugging (20 minutes)
- **Hands-on**: Use Aspire Dashboard for monitoring
- **Exercise**: Trace agent interactions
- **Learning**: Performance optimization

#### Module 5.2: Best Practices & Q&A (25 minutes)
- **Discussion**: Production deployment strategies
- **Review**: Common pitfalls and solutions
- **Q&A**: Open discussion and troubleshooting

## Prerequisites

### Technical Requirements
- **Azure Subscription**: With appropriate permissions for resource creation
- **Development Tools**: 
  - Azure Developer CLI
  - Docker Desktop
  - Git
  - Node.js (v22+)
  - VS Code or preferred IDE

### Knowledge Prerequisites
- **Programming**: Intermediate JavaScript/TypeScript
- **Azure Basics**: Understanding of Azure services and portal
- **Container Concepts**: Basic Docker knowledge
- **API Development**: REST API and HTTP concepts

## Pre-Workshop Setup

### 1. Environment Preparation
```bash
# Clone the repository
git clone https://github.com/Azure-Samples/azure-ai-travel-agents.git
cd azure-ai-travel-agents

# Install dependencies
npm install --prefix=src/api
npm install --prefix=src/ui

# Verify Azure CLI
azd auth login
```

### 2. Azure Resource Provisioning
```bash
# Provision Azure resources (takes 10-15 minutes)
azd provision
```

### 3. Local Development Setup
```bash
# Start the application locally
npm start --prefix=src/api &
npm start --prefix=src/ui &
```

## Workshop Exercises

### Exercise 1: Extend Echo Server
**Objective**: Add a new tool to the existing echo-ping MCP server

**Steps**:
1. Navigate to `src/tools/echo-ping/src/index.ts`
2. Add a new tool called `reverse` that reverses input text
3. Test the tool integration with the agent
4. Verify through the UI

**Expected Outcome**: Understanding MCP tool creation and registration

### Exercise 2: Create Weather MCP Server
**Objective**: Build a new MCP server from scratch

**Steps**:
1. Create new directory `src/tools/weather-service`
2. Implement a Python-based MCP server with weather tools
3. Add Docker configuration
4. Register in docker-compose.yml
5. Integrate with the orchestrator

**Expected Outcome**: Complete MCP server development workflow

### Exercise 3: Custom Travel Budget Agent
**Objective**: Create a specialized agent for budget management

**Steps**:
1. Modify `src/api/src/orchestrator/llamaindex/index.ts`
2. Create a budget calculation agent
3. Define appropriate system prompts
4. Connect to relevant MCP tools
5. Test budget planning scenarios

**Expected Outcome**: Agent specialization and orchestration patterns

### Exercise 4: Production Deployment
**Objective**: Deploy the enhanced application to Azure

**Steps**:
1. Build and push container images
2. Deploy using `azd up`
3. Configure environment variables
4. Test production deployment
5. Monitor using Azure tools

**Expected Outcome**: Complete deployment and monitoring setup

## Troubleshooting Guide

### Common Issues

#### Setup Problems
- **Port conflicts**: Ensure ports 4200, 4000, 5001-5007 are available
- **Azure permissions**: Verify subscription access and resource creation rights
- **Docker issues**: Ensure Docker Desktop is running and configured properly

#### Development Issues
- **MCP server registration**: Check docker-compose.yml configuration
- **Agent integration**: Verify tool registration in orchestrator
- **Environment variables**: Ensure all required variables are set

#### Deployment Issues
- **Resource quotas**: Some regions may have limited GPU availability
- **Network configuration**: Verify container app networking settings
- **Authentication**: Ensure proper Azure credentials and permissions

### Debugging Techniques

#### Local Debugging
```bash
# View container logs
docker-compose logs [service-name]

# Debug specific MCP server
docker-compose up [service-name]

# Monitor API logs
npm run dev --prefix=src/api
```

#### Azure Debugging
```bash
# View container app logs
az containerapp logs show --name [app-name] --resource-group [rg-name]

# Check deployment status
azd show

# Monitor resource health
az resource list --resource-group [rg-name]
```

## Additional Resources

### Documentation
- [Technical Architecture](./technical-architecture.md)
- [Development Guide](./development-guide.md)
- [MCP Servers Guide](./mcp-servers.md)
- [Deployment Architecture](./deployment-architecture.md)

### External Resources
- [LlamaIndex.TS Documentation](https://ts.llamaindex.ai/)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Azure Container Apps Documentation](https://learn.microsoft.com/azure/container-apps/)
- [Azure AI Foundry Documentation](https://learn.microsoft.com/azure/ai-studio/)

### Community
- [Azure AI Foundry Discord](https://aka.ms/foundry/discord)
- [Azure AI Foundry Forum](https://aka.ms/foundry/forum)

## Workshop Materials

### Presenter Notes
- **Timing**: Allow extra time for setup and troubleshooting
- **Demonstrations**: Have backup environments ready
- **Interactivity**: Encourage questions and hands-on participation
- **Adaptability**: Be ready to adjust based on audience skill level

### Participant Materials
- **Code Examples**: Pre-built code snippets for common tasks
- **Reference Cards**: Quick reference for MCP and agent patterns
- **Troubleshooting**: Common issues and solutions checklist

## Post-Workshop Follow-up

### Recommended Next Steps
1. **Extend the Application**: Add new MCP servers and agents
2. **Production Deployment**: Deploy personal projects using learned patterns
3. **Community Engagement**: Share experiences and ask questions in forums
4. **Advanced Topics**: Explore security, scalability, and monitoring

### Continuous Learning
- **Documentation**: Keep up with Azure AI service updates
- **Community**: Participate in Azure AI Foundry community discussions
- **Practice**: Build additional multi-agent applications
- **Certification**: Consider Azure AI certification paths

---

*This workshop guide is designed to be flexible and can be adapted based on audience needs, time constraints, and specific learning objectives.*