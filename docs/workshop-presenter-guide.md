# Workshop Presenter Guide

This guide provides detailed instructions for trainers conducting the Azure AI Travel Agents workshop, including timing, preparation, and delivery tips.

## Pre-Workshop Preparation

### 1 Week Before
- [ ] **Test Environment**: Set up and test the complete workshop environment
- [ ] **Azure Resources**: Pre-provision Azure resources if needed
- [ ] **Backup Plans**: Prepare alternative demonstrations in case of technical issues
- [ ] **Materials Review**: Review all workshop materials and exercises
- [ ] **Participant Communication**: Send setup instructions to participants

### 1 Day Before
- [ ] **Final Environment Check**: Verify all services are working
- [ ] **Presentation Setup**: Load slides and demonstration environments
- [ ] **Backup Environment**: Prepare secondary environment for demonstrations
- [ ] **Participant List**: Confirm attendance and technical requirements

### Day of Workshop
- [ ] **Early Arrival**: Arrive 30 minutes early for setup
- [ ] **Technology Check**: Test all audio/visual equipment
- [ ] **Network Verification**: Ensure stable internet connectivity
- [ ] **Backup Materials**: Have offline versions of key materials ready

## Detailed Session Guide

### Phase 1: Foundation & Setup (60 minutes)

#### Module 1.1: Introduction to AI Agents (20 minutes)

**Learning Objectives:**
- Understand multi-agent system concepts
- Recognize benefits of agent orchestration
- Identify real-world use cases

**Presentation Outline:**

**Minutes 0-5: Welcome & Introductions**
- Welcome participants
- Brief self-introduction
- Overview of agenda and expectations
- Icebreaker: "What's your experience with AI agents?"

**Minutes 5-12: Multi-Agent Systems Theory**
- Definition of AI agents vs. single AI models
- Benefits of specialization and orchestration
- Real-world examples (customer service, content creation, etc.)
- **Demo**: Show the Azure AI Travel Agents in action (5-minute walkthrough)

**Minutes 12-18: Azure AI Travel Agents Overview**
- System architecture overview
- Agent specializations and roles
- Communication patterns
- **Interactive**: Ask participants to identify potential agents for their use cases

**Minutes 18-20: Q&A and Transition**
- Address immediate questions
- Transition to MCP concepts

**Presenter Tips:**
- Keep theory concise - focus on practical benefits
- Use the live demo early to engage participants
- Encourage questions throughout
- Have backup screenshots in case demo fails

**Potential Issues:**
- Demo environment not responding: Use pre-recorded video
- Participants with no AI background: Spend extra time on basics
- Advanced participants: Prepare deeper technical questions

---

#### Module 1.2: Model Context Protocol Fundamentals (20 minutes)

**Learning Objectives:**
- Understand MCP architecture and benefits
- Distinguish between HTTP and SSE communication patterns
- Recognize MCP use cases

**Presentation Outline:**

**Minutes 0-8: MCP Concepts**
- What is Model Context Protocol?
- Problems MCP solves (tool integration, security, standardization)
- MCP vs. other integration patterns
- **Analogy**: MCP as "USB for AI tools"

**Minutes 8-15: Communication Patterns**
- HTTP-based MCP (request/response)
- SSE-based MCP (streaming)
- When to use each pattern
- **Demo**: Show both patterns in the codebase

**Minutes 15-18: MCP in Practice**
- Tool discovery and registration
- Error handling patterns
- Security considerations
- **Code Review**: Examine echo-ping server structure

**Minutes 18-20: Q&A and Setup Transition**

**Presenter Tips:**
- Use visual diagrams to explain MCP flow
- Show actual code early - participants learn by seeing
- Emphasize standardization benefits
- Connect to participants' integration challenges

**Common Questions:**
- "How does MCP compare to REST APIs?" - Emphasize standardization and tool discovery
- "Is MCP only for AI?" - Explain broader tool integration use cases
- "What about security?" - Discuss authentication and validation patterns

---

#### Module 1.3: Environment Setup (20 minutes)

**Learning Objectives:**
- Successfully set up local development environment
- Verify all services are running
- Troubleshoot common setup issues

**Presentation Outline:**

**Minutes 0-5: Setup Overview**
- Prerequisites review
- Common setup issues preview
- Support strategy for the session

**Minutes 5-15: Guided Setup**
- **Live Coding**: Walk through setup step-by-step
- Repository cloning
- Dependency installation
- Azure authentication
- Local service startup
- **Checkpoint**: Verify UI accessibility

**Minutes 15-18: Troubleshooting**
- Common port conflicts
- Docker issues
- Azure authentication problems
- Network connectivity issues

**Minutes 18-20: Environment Verification**
- Test basic functionality
- Verify Aspire Dashboard access
- Confirm all participants are ready

**Presenter Tips:**
- Go slowly - setup is critical for success
- Have helpers circulate to assist participants
- Use screen sharing for demonstrations
- Prepare solutions for common issues
- Consider breaking into smaller groups if needed

**Backup Plans:**
- Pre-built environments for participants with issues
- Pair programming for struggling participants
- Cloud-based development environments if local setup fails

---

### Phase 2: Building MCP Servers (90 minutes)

#### Module 2.1: Simple MCP Server (TypeScript) (30 minutes)

**Learning Objectives:**
- Understand MCP server structure
- Implement tool registration and handling
- Test tool integration with agents

**Presentation Outline:**

**Minutes 0-8: Echo Server Analysis**
- **Code Review**: Walk through existing echo-ping server
- Tool definition structure
- Request/response handling
- Error management patterns

**Minutes 8-20: Hands-on Exercise**
- **Live Coding**: Implement reverse tool together
- Tool schema definition
- Handler implementation
- Testing and verification
- **Guided Practice**: Participants implement alongside

**Minutes 20-25: Integration Testing**
- Restart services
- Test through UI
- Verify agent integration
- Troubleshoot issues

**Minutes 25-30: Reflection and Q&A**
- Discuss implementation patterns
- Common pitfalls
- Best practices

**Presenter Tips:**
- Code together with participants
- Explain each line's purpose
- Test frequently during development
- Show debugging techniques
- Encourage experimentation

**Common Issues:**
- Syntax errors: Have correct code ready to share
- Port conflicts: Show restart procedures
- Agent not recognizing tool: Demonstrate registration process

---

#### Module 2.2: Advanced MCP Server (Python) (30 minutes)

**Learning Objectives:**
- Build complete MCP server from scratch
- Implement multiple tools
- Understand SSE communication patterns

**Presentation Outline:**

**Minutes 0-5: Project Structure**
- Create weather service directory
- File organization best practices
- Dependencies and requirements

**Minutes 5-20: Implementation**
- **Live Coding**: Build weather server step-by-step
- Server initialization
- Tool definitions
- Business logic implementation
- Error handling patterns

**Minutes 20-25: Docker Integration**
- Dockerfile creation
- Docker-compose configuration
- Service registration

**Minutes 25-30: Testing and Verification**
- Build and start service
- Integration testing
- Log analysis
- Troubleshooting

**Presenter Tips:**
- Move at moderate pace - complex exercise
- Explain design decisions
- Show testing strategies
- Have completed code available for reference
- Encourage questions during implementation

**Backup Strategies:**
- Pre-built server for time constraints
- Focus on key concepts if running behind
- Provide complete code for self-study

---

#### Module 2.3: Cross-Language Integration (30 minutes)

**Learning Objectives:**
- Integrate new server with orchestrator
- Understand multi-language coordination
- Configure agent behaviors

**Presentation Outline:**

**Minutes 0-10: Orchestrator Integration**
- **Code Review**: MCP tools configuration
- Service registration patterns
- Environment variable management

**Minutes 10-20: Agent Configuration**
- **Live Coding**: Add weather agent to orchestrator
- System prompt design
- Tool binding
- Agent specialization strategies

**Minutes 20-25: End-to-End Testing**
- Full system restart
- Integration testing
- Multi-agent coordination verification

**Minutes 25-30: Troubleshooting and Q&A**
- Common integration issues
- Debugging techniques
- Performance considerations

**Presenter Tips:**
- Emphasize configuration consistency
- Show service discovery patterns
- Demonstrate debugging techniques
- Prepare for integration challenges

---

### Phase 3: Agent Orchestration (75 minutes)

#### Module 3.1: LlamaIndex.TS Fundamentals (25 minutes)

**Learning Objectives:**
- Understand agent creation patterns
- Learn tool binding mechanisms
- Recognize orchestration strategies

**Presentation Outline:**

**Minutes 0-10: Agent Architecture**
- LlamaIndex.TS agent concepts
- Agent vs. tool distinction
- Orchestration patterns
- **Code Review**: Examine existing agents

**Minutes 10-18: Agent Creation Patterns**
- System prompt design
- Tool selection strategies
- LLM integration
- **Demo**: Create simple agent interactively

**Minutes 18-23: Multi-Agent Coordination**
- Handoff mechanisms
- Context sharing
- Workflow patterns

**Minutes 23-25: Q&A and Transition**

**Presenter Tips:**
- Focus on practical patterns
- Show real code examples
- Explain design decisions
- Connect to business use cases

---

#### Module 3.2: Building Custom Agents (25 minutes)

**Learning Objectives:**
- Create specialized business logic agents
- Design effective system prompts
- Implement tool selection strategies

**Presentation Outline:**

**Minutes 0-15: Budget Agent Development**
- **Live Coding**: Create budget planning agent
- Business logic analysis
- System prompt crafting
- Tool integration

**Minutes 15-22: Testing and Refinement**
- Agent behavior testing
- Prompt optimization
- Error handling improvement

**Minutes 22-25: Best Practices Discussion**
- Agent specialization strategies
- Prompt engineering tips
- Performance optimization

**Presenter Tips:**
- Encourage creative thinking
- Show iterative development
- Discuss real-world applications
- Share prompt engineering techniques

---

#### Module 3.3: Multi-Agent Workflows (25 minutes)

**Learning Objectives:**
- Implement complex agent coordination
- Design handoff patterns
- Create travel planning workflows

**Presentation Outline:**

**Minutes 0-12: Workflow Design**
- Travel planning use case analysis
- Agent coordination patterns
- Handoff trigger identification
- **Interactive**: Design workflow together

**Minutes 12-20: Implementation**
- **Live Coding**: Implement complex workflow
- Agent handoff configuration
- Context preservation
- Error recovery

**Minutes 20-23: Testing Complex Scenarios**
- End-to-end workflow testing
- Edge case handling
- Performance evaluation

**Minutes 23-25: Discussion and Wrap-up**

**Presenter Tips:**
- Use real-world scenarios
- Show debugging complex workflows
- Discuss scalability considerations
- Prepare complex test cases

---

### Phase 4: Azure Deployment (90 minutes)

#### Module 4.1: Azure AI Foundry Integration (30 minutes)

**Learning Objectives:**
- Configure Azure AI services
- Integrate with Azure OpenAI
- Set up proper authentication

**Presentation Outline:**

**Minutes 0-10: Azure AI Services Overview**
- Azure AI Foundry capabilities
- Service integration patterns
- Authentication strategies

**Minutes 10-20: Configuration Setup**
- **Live Demo**: Azure portal configuration
- API key management
- Environment variable setup
- Security best practices

**Minutes 20-25: Integration Testing**
- Verify Azure service connectivity
- Test API responses
- Monitor usage and billing

**Minutes 25-30: Q&A and Troubleshooting**

**Presenter Tips:**
- Have Azure resources pre-configured
- Show security best practices
- Discuss cost implications
- Prepare for authentication issues

---

#### Module 4.2: Container Apps Deployment (30 minutes)

**Learning Objectives:**
- Deploy using Azure Developer CLI
- Configure container environments
- Understand scaling concepts

**Presentation Outline:**

**Minutes 0-8: Deployment Overview**
- Azure Container Apps benefits
- Deployment architecture
- Scaling considerations

**Minutes 8-20: Deployment Process**
- **Live Demo**: azd up deployment
- Infrastructure provisioning
- Container image building
- Service configuration

**Minutes 20-25: Post-Deployment Verification**
- Service health checks
- Log analysis
- Performance testing

**Minutes 25-30: Troubleshooting**
- Common deployment issues
- Resource quota problems
- Network configuration issues

**Presenter Tips:**
- Have backup deployment ready
- Show monitoring during deployment
- Discuss cost implications
- Prepare for region-specific issues

---

#### Module 4.3: Production Considerations (30 minutes)

**Learning Objectives:**
- Implement monitoring and alerting
- Configure security settings
- Optimize for cost and performance

**Presentation Outline:**

**Minutes 0-12: Monitoring Setup**
- **Live Demo**: Configure OpenTelemetry
- Azure Monitor integration
- Alert configuration
- Dashboard creation

**Minutes 12-20: Security Configuration**
- Authentication and authorization
- Network security
- Secret management
- Compliance considerations

**Minutes 20-25: Cost Optimization**
- Resource right-sizing
- Scaling configuration
- Cost monitoring setup

**Minutes 25-30: Production Checklist**
- Deployment best practices
- Monitoring requirements
- Backup and recovery
- Documentation needs

**Presenter Tips:**
- Emphasize production readiness
- Show real monitoring data
- Discuss security implications
- Provide practical checklists

---

### Phase 5: Advanced Topics & Wrap-up (45 minutes)

#### Module 5.1: Observability and Debugging (20 minutes)

**Learning Objectives:**
- Use monitoring tools effectively
- Debug complex multi-agent issues
- Optimize system performance

**Presentation Outline:**

**Minutes 0-8: Monitoring Deep Dive**
- **Live Demo**: Aspire Dashboard exploration
- Trace analysis techniques
- Performance bottleneck identification

**Minutes 8-15: Debugging Strategies**
- Multi-service debugging
- Log correlation techniques
- Common issue patterns

**Minutes 15-18: Performance Optimization**
- Scaling strategies
- Caching approaches
- Resource optimization

**Minutes 18-20: Tools and Techniques Summary**

**Presenter Tips:**
- Show real debugging scenarios
- Use actual application data
- Demonstrate tools hands-on
- Share war stories and lessons learned

---

#### Module 5.2: Best Practices & Q&A (25 minutes)

**Learning Objectives:**
- Consolidate learning
- Address specific participant questions
- Plan next steps

**Presentation Outline:**

**Minutes 0-10: Best Practices Review**
- Development workflow recommendations
- Production deployment strategies
- Common pitfalls and solutions
- **Interactive**: Participant experiences sharing

**Minutes 10-20: Open Q&A**
- Address specific technical questions
- Discuss real-world implementation challenges
- Share additional resources
- **Group Discussion**: Use cases and applications

**Minutes 20-25: Next Steps and Resources**
- Recommended learning paths
- Community resources
- Additional documentation
- Workshop feedback collection

**Presenter Tips:**
- Encourage open discussion
- Share practical experiences
- Provide actionable next steps
- Collect valuable feedback

---

## Timing Management

### Staying on Schedule
- **Buffer Time**: Build 5-10 minutes of buffer into each module
- **Priority Content**: Identify must-cover vs. nice-to-have content
- **Checkpoint System**: Regular time checks and adjustments
- **Flexible Breaks**: Adjust break timing based on progress

### Dealing with Delays
- **Module Prioritization**: Focus on core concepts if running behind
- **Extended Sessions**: Option to extend if participants agree
- **Homework Assignments**: Move non-critical content to self-study
- **Follow-up Sessions**: Offer additional sessions for advanced topics

### Managing Questions
- **Parking Lot**: Note complex questions for later discussion
- **Time Boxing**: Limit individual questions to maintain flow
- **Peer Learning**: Encourage participants to help each other
- **Office Hours**: Offer additional Q&A time after workshop

## Troubleshooting Guide

### Technical Issues

#### Environment Setup Problems
- **Docker Issues**: Have Docker troubleshooting guide ready
- **Port Conflicts**: Prepare alternative port configurations
- **Network Problems**: Have offline alternatives ready
- **Azure Authentication**: Prepare backup authentication methods

#### Development Issues
- **Code Errors**: Have working code examples ready
- **Integration Problems**: Prepare step-by-step debugging guides
- **Performance Issues**: Know common optimization techniques
- **Version Conflicts**: Have environment reset procedures ready

### Participant Management

#### Skill Level Variations
- **Beginner Support**: Pair with advanced participants
- **Advanced Participants**: Provide extra challenges
- **Mixed Groups**: Use differentiated instruction
- **Individual Attention**: Plan for one-on-one support time

#### Engagement Issues
- **Passive Participants**: Use direct engagement techniques
- **Overwhelmed Participants**: Provide additional support
- **Disruptive Questions**: Manage timing and scope
- **Technical Difficulties**: Have alternative participation methods

## Materials Checklist

### Required Technology
- [ ] Presentation system with screen sharing
- [ ] Stable internet connection
- [ ] Backup internet connection
- [ ] Audio/visual equipment
- [ ] Power outlets for participants
- [ ] Extension cords and adapters

### Digital Materials
- [ ] Presentation slides
- [ ] Workshop guides and exercises
- [ ] Code examples and solutions
- [ ] Troubleshooting documentation
- [ ] Additional resources and references

### Backup Plans
- [ ] Offline presentation materials
- [ ] Pre-built development environments
- [ ] Alternative demonstration methods
- [ ] Contact information for technical support
- [ ] Workshop evaluation forms

## Post-Workshop Activities

### Immediate Follow-up
- [ ] Share presentation materials with participants
- [ ] Provide complete code examples and solutions
- [ ] Send troubleshooting resources
- [ ] Create communication channel for ongoing support

### Ongoing Support
- [ ] Schedule optional follow-up sessions
- [ ] Monitor community forums for questions
- [ ] Update materials based on feedback
- [ ] Plan advanced workshops based on interest

### Continuous Improvement
- [ ] Collect detailed feedback from participants
- [ ] Analyze which sections worked well
- [ ] Identify areas for improvement
- [ ] Update workshop materials for next iteration
- [ ] Share experiences with other trainers

---

## Success Metrics

### Participant Engagement
- Active participation in exercises
- Quality of questions asked
- Completion rate of hands-on activities
- Peer collaboration and knowledge sharing

### Learning Outcomes
- Successful completion of exercises
- Understanding demonstrated through Q&A
- Application of concepts to participant use cases
- Confidence in using the technology

### Workshop Effectiveness
- Positive feedback scores
- Requests for follow-up sessions
- Implementation of learned concepts
- Community engagement after workshop

---

*This presenter guide should be customized based on specific audience needs, available time, and technical constraints. Regular updates and improvements based on workshop experience will enhance effectiveness.*