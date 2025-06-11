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

**Learning Goals:**
- Understand the benefits of multi-agent systems vs. single agents
- Recognize when to use agent-based architectures
- Identify the components of the Azure AI Travel Agents system

**Content:**
- **Theory (10 minutes)**: Multi-agent systems and their benefits
  - What are AI agents and how do they differ from simple AI applications?
  - Benefits of decomposing complex tasks into specialized agents
  - Communication patterns between agents
  - Real-world examples: customer service, travel planning, data analysis

- **Demo (5 minutes)**: Azure AI Travel Agents system overview
  - Live demonstration of the complete system
  - Show how different agents handle different aspects of travel planning
  - Highlight the user experience and agent coordination

- **Discussion (5 minutes)**: Use cases and design patterns
  - When would you choose agents over a single AI system?
  - What makes a good agent boundary?
  - Common pitfalls in agent design

#### Module 1.2: Model Context Protocol Fundamentals (20 minutes)

**Learning Goals:**
- Understand MCP architecture and components
- Differentiate between HTTP and SSE communication patterns
- Identify the role of MCP in agent systems

**Content:**
- **Theory (10 minutes)**: MCP concepts, servers, clients, and tools
  - What is the Model Context Protocol and why does it exist?
  - MCP Server architecture: tools, resources, and prompts
  - MCP Client integration patterns
  - Tool discovery and invocation mechanisms

- **Demo (5 minutes)**: MCP communication patterns (HTTP vs SSE)
  - Show HTTP-based MCP server communication
  - Demonstrate Server-Sent Events (SSE) for real-time updates
  - Compare the trade-offs between communication methods

- **Hands-on (5 minutes)**: Examine existing MCP servers
  - Navigate the echo-ping server code structure
  - Identify tool definitions and handlers
  - Review the server initialization and routing

#### Module 1.3: Environment Setup (20 minutes)

**Learning Goals:**
- Successfully set up the complete development environment
- Verify all services are running correctly
- Understand the service architecture and dependencies

**Content:**
- **Hands-on (15 minutes)**: Clone repository and set up development environment
  - Clone the Azure AI Travel Agents repository
  - Install required dependencies (Node.js, Docker, Azure CLI)
  - Configure environment variables and Azure credentials
  - Run `azd provision` to set up Azure resources
  - Start all services using npm scripts

- **Verification (3 minutes)**: Run the application locally
  - Access the UI at http://localhost:4200
  - Test a simple travel query to verify end-to-end functionality
  - Check the Aspire Dashboard at http://localhost:18888 for service status

- **Troubleshooting (2 minutes)**: Common setup issues
  - Port conflicts and resolution strategies
  - Azure authentication problems
  - Docker service startup failures
  - Environment variable configuration errors

### Phase 2: Building MCP Servers (90 minutes)

#### Module 2.1: Simple MCP Server (TypeScript) (30 minutes)

**Learning Goals:**
- Understand MCP server structure and tool creation
- Implement a new tool in an existing TypeScript MCP server
- Test MCP tool functionality in isolation

**Content:**
- **Hands-on (20 minutes)**: Extend the echo-ping server
  - Examine the existing echo-ping server architecture
  - Understand tool schema definition and validation
  - Add a new "reverse" tool that reverses input text
  - Implement the tool handler function

- **Exercise (5 minutes)**: Add a new tool to the echo server
  - Complete Exercise 1 from the exercises document
  - Test the new tool using direct HTTP requests
  - Verify tool schema validation works correctly

- **Learning (5 minutes)**: HTTP-based MCP implementation
  - Review HTTP request/response patterns for MCP
  - Understand tool invocation flow
  - Discuss error handling best practices

#### Module 2.2: Advanced MCP Server (Python) (30 minutes)

**Learning Goals:**
- Create a complete MCP server from scratch in Python
- Implement multiple tools with different data types
- Understand Server-Sent Events (SSE) communication

**Content:**
- **Hands-on (20 minutes)**: Create a custom weather MCP server
  - Set up a new Python MCP server project
  - Implement weather tools: current conditions, forecast, alerts
  - Add proper input validation and error handling
  - Configure SSE-based communication

- **Exercise (5 minutes)**: Implement SSE-based communication
  - Complete Exercise 2 from the exercises document
  - Test real-time weather updates
  - Compare SSE performance with HTTP polling

- **Learning (5 minutes)**: Error handling and validation
  - Best practices for input validation in MCP servers
  - Error response formats and codes
  - Logging and debugging strategies

#### Module 2.3: Cross-Language Integration (30 minutes)

**Learning Goals:**
- Integrate multiple MCP servers with the orchestration layer
- Configure service discovery and registration
- Understand polyglot architecture benefits

**Content:**
- **Hands-on (20 minutes)**: Integrate the new server with the orchestrator
  - Register the new Python weather server
  - Update Docker Compose configuration
  - Configure service networking and discovery
  - Test integration through the main API

- **Exercise (5 minutes)**: Add agent configuration and registration
  - Update agent configuration to use new tools
  - Test the complete workflow from UI to new MCP server
  - Verify error handling across service boundaries

- **Learning (5 minutes)**: Multi-language service coordination
  - Benefits of polyglot MCP server architecture
  - Service discovery patterns and best practices
  - Monitoring and debugging distributed systems

### Phase 3: Agent Orchestration (75 minutes)

### Phase 3: Agent Orchestration (75 minutes)

#### Module 3.1: LlamaIndex.TS Fundamentals (25 minutes)

**Learning Goals:**
- Understand LlamaIndex.TS architecture and agent framework
- Learn how to bind tools to agents
- Recognize different agent specialization patterns

**Content:**
- **Theory (10 minutes)**: Agent creation and tool binding
  - LlamaIndex.TS agent architecture overview
  - Tool registration and binding patterns
  - System prompts and agent behavior configuration
  - Agent memory and state management

- **Demo (10 minutes)**: Examine existing agent implementations
  - Walk through the travel planning agent code
  - Show how tools are discovered and invoked
  - Demonstrate agent conversation flow
  - Review logging and debugging output

- **Discussion (5 minutes)**: Agent specialization strategies
  - When to create specialized vs. generalist agents
  - Tool selection and agent boundary design
  - Performance considerations for agent design

#### Module 3.2: Building Custom Agents (25 minutes)

**Learning Goals:**
- Create a specialized agent from scratch
- Write effective system prompts for agent behavior
- Configure tool access and limitations

**Content:**
- **Hands-on (15 minutes)**: Create a specialized travel budget agent
  - Define agent purpose and capabilities
  - Write system prompts for budget analysis
  - Configure tool access (calculator, currency, etc.)
  - Implement agent initialization and configuration

- **Exercise (5 minutes)**: Define system prompts and tool selection
  - Complete Exercise 3 from the exercises document
  - Test agent responses to budget-related queries
  - Refine prompts based on agent behavior

- **Learning (5 minutes)**: Agent behavior customization
  - Best practices for system prompt engineering
  - Tool selection strategies for specialized agents
  - Agent personality and interaction patterns

#### Module 3.3: Multi-Agent Workflows (25 minutes)

**Learning Goals:**
- Implement agent handoff and coordination patterns
- Create complex multi-step workflows
- Understand orchestration vs. choreography patterns

**Content:**
- **Hands-on (15 minutes)**: Implement agent handoff patterns
  - Create agent-to-agent communication patterns
  - Implement context passing between agents
  - Configure workflow routing and decision logic
  - Test multi-agent conversation flows

- **Exercise (5 minutes)**: Create complex travel planning workflows
  - Design a multi-agent travel planning scenario
  - Test agent coordination and handoffs
  - Verify context preservation across agents

- **Learning (5 minutes)**: Orchestration and coordination patterns
  - Centralized vs. decentralized agent coordination
  - State management in multi-agent systems
  - Error handling and recovery strategies

### Phase 4: Azure Deployment (90 minutes)

### Phase 4: Azure Deployment (90 minutes)

#### Module 4.1: Azure AI Foundry Integration (30 minutes)

**Learning Goals:**
- Understand Azure AI Foundry services and integration points
- Configure Azure OpenAI for production use
- Set up Azure AI project structure and permissions

**Content:**
- **Theory (10 minutes)**: Azure AI services and capabilities
  - Azure AI Foundry overview and service portfolio
  - OpenAI integration patterns and best practices
  - Model selection and capacity planning
  - Security and compliance considerations

- **Hands-on (15 minutes)**: Configure Azure OpenAI integration
  - Create Azure OpenAI resource and deployment
  - Configure model deployments (GPT-4, embeddings)
  - Set up authentication and access controls
  - Update application configuration for Azure integration

- **Exercise (5 minutes)**: Set up Azure AI project
  - Create Azure AI Hub and project resources
  - Configure role-based access control (RBAC)
  - Test Azure OpenAI connectivity from the application

#### Module 4.2: Container Apps Deployment (30 minutes)

**Learning Goals:**
- Deploy multi-container applications to Azure Container Apps
- Configure container networking and scaling
- Understand Azure Developer CLI deployment patterns

**Content:**
- **Hands-on (20 minutes)**: Deploy using Azure Developer CLI
  - Review azd configuration and templates
  - Execute `azd up` for complete deployment
  - Monitor deployment progress and troubleshoot issues
  - Verify all services are running in Azure

- **Exercise (5 minutes)**: Configure container environments
  - Complete Exercise 4 from the exercises document
  - Test the deployed application end-to-end
  - Configure custom domain and SSL certificates

- **Learning (5 minutes)**: Scaling and networking concepts
  - Container Apps scaling strategies (CPU, memory, HTTP)
  - Virtual network integration and private endpoints
  - Load balancing and traffic distribution

#### Module 4.3: Production Considerations (30 minutes)

**Learning Goals:**
- Implement production-ready monitoring and alerting
- Understand security best practices for AI applications
- Configure cost optimization and resource management

**Content:**
- **Theory (10 minutes)**: Security, monitoring, and cost optimization
  - Security best practices for AI applications
  - Data privacy and compliance requirements
  - Cost optimization strategies for Azure AI services
  - Performance monitoring and optimization

- **Hands-on (15 minutes)**: Set up OpenTelemetry monitoring
  - Configure Application Insights integration
  - Set up distributed tracing across services
  - Implement custom metrics and logging
  - Create monitoring dashboards

- **Exercise (5 minutes)**: Configure alerts and dashboards
  - Create alerts for system health and performance
  - Set up cost monitoring and budget alerts
  - Configure automated scaling policies

### Phase 5: Advanced Topics & Wrap-up (45 minutes)

### Phase 5: Advanced Topics & Wrap-up (45 minutes)

#### Module 5.1: Observability and Debugging (20 minutes)

**Learning Goals:**
- Master distributed system debugging techniques
- Use observability tools for performance optimization
- Understand tracing patterns for multi-agent systems

**Content:**
- **Hands-on (12 minutes)**: Use Aspire Dashboard for monitoring
  - Navigate the Aspire Dashboard interface
  - Monitor service health and performance metrics
  - Analyze distributed traces across services
  - Identify performance bottlenecks and errors

- **Exercise (5 minutes)**: Trace agent interactions
  - Generate sample agent conversations
  - Follow traces through the complete request flow
  - Identify optimization opportunities
  - Debug common interaction patterns

- **Learning (3 minutes)**: Performance optimization
  - Best practices for monitoring multi-agent systems
  - Key metrics to track for AI applications
  - Alerting strategies for production systems

#### Module 5.2: Best Practices & Q&A (25 minutes)

**Learning Goals:**
- Consolidate learning from the workshop
- Address specific participant questions and challenges
- Plan next steps for continued learning

**Content:**
- **Discussion (10 minutes)**: Production deployment strategies
  - Review enterprise deployment patterns
  - Discuss CI/CD integration strategies
  - Security and compliance considerations
  - Scaling strategies for different workloads

- **Review (10 minutes)**: Common pitfalls and solutions
  - Agent design anti-patterns to avoid
  - MCP server development gotchas
  - Azure deployment troubleshooting
  - Performance optimization tips

- **Q&A (5 minutes)**: Open discussion and troubleshooting
  - Address specific participant questions
  - Discuss use case applications
  - Plan follow-up learning activities
  - Share additional resources and community links

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
- [Technical Architecture](../technical-architecture.md)
- [Development Guide](../development-guide.md)
- [MCP Servers Guide](../mcp-servers.md)
- [Deployment Architecture](../deployment-architecture.md)

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