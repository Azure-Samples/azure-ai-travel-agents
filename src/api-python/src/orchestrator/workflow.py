"""MAF Workflow Orchestrator for travel planning agents with MCP integration."""

import logging
from typing import Any, AsyncGenerator, Dict, List, Optional

from agent_framework import Tool

from ..config import settings
from .providers import get_llm_client
from .agents.triage_agent import TriageAgent
from .agents.specialized_agents import (
    CustomerQueryAgent,
    DestinationRecommendationAgent,
    ItineraryPlanningAgent,
    CodeEvaluationAgent,
    ModelInferenceAgent,
    WebSearchAgent,
    EchoAgent,
)
from .tools import MCP_TOOLS_CONFIG, MCPToolWrapper

logger = logging.getLogger(__name__)


class TravelWorkflowOrchestrator:
    """Orchestrates multi-agent workflow for travel planning using MAF.
    
    This class manages the initialization and coordination of all agents
    in the travel planning system using Microsoft Agent Framework.
    
    Integrates MCP tools following the TypeScript implementation pattern
    from src/api/src/orchestrator/llamaindex/index.ts
    """

    def __init__(self):
        """Initialize the workflow orchestrator."""
        self.llm_client: Optional[Any] = None
        self.mcp_wrappers: Dict[str, MCPToolWrapper] = {}
        self.all_tools: List[Tool] = []
        
        # Initialize agents (will be configured with tools during initialize())
        self.triage_agent: Optional[TriageAgent] = None
        self.customer_query_agent: Optional[CustomerQueryAgent] = None
        self.destination_agent: Optional[DestinationRecommendationAgent] = None
        self.itinerary_agent: Optional[ItineraryPlanningAgent] = None
        self.code_eval_agent: Optional[CodeEvaluationAgent] = None
        self.model_inference_agent: Optional[ModelInferenceAgent] = None
        self.web_search_agent: Optional[WebSearchAgent] = None
        self.echo_agent: Optional[EchoAgent] = None
        
        logger.info("Workflow orchestrator initialized")

    async def initialize(self, enabled_tools: Optional[List[str]] = None) -> None:
        """Initialize the workflow with LLM client, MCP tools, and all agents.
        
        Args:
            enabled_tools: List of enabled tool IDs. If None, all tools are enabled.
        """
        logger.info("Initializing MAF workflow with MCP tools...")
        
        # Get LLM client based on configured provider
        self.llm_client = await get_llm_client()
        logger.info(f"LLM client initialized for provider: {settings.llm_provider}")
        
        # Determine which tools to enable (default: all except echo-ping for production)
        if enabled_tools is None:
            enabled_tools = [
                "customer-query",
                "web-search",
                "itinerary-planning",
                "model-inference",
                "code-evaluation",
                "destination-recommendation",
            ]
        
        # Initialize MCP tool wrappers and collect tools
        # Following TypeScript pattern from setupAgents()
        tools_by_server: Dict[str, List[Tool]] = {}
        
        for tool_id in enabled_tools:
            if tool_id in MCP_TOOLS_CONFIG:
                try:
                    server_def = MCP_TOOLS_CONFIG[tool_id]
                    wrapper = MCPToolWrapper(
                        server_config=server_def["config"],
                        server_name=server_def["name"]
                    )
                    self.mcp_wrappers[tool_id] = wrapper
                    
                    # Get tools from this MCP server
                    tools = await wrapper.get_tools()
                    tools_by_server[tool_id] = tools
                    self.all_tools.extend(tools)
                    
                    logger.info(
                        f"Loaded {len(tools)} tools from {server_def['name']}"
                    )
                    
                except Exception as e:
                    logger.error(
                        f"Failed to initialize MCP tools for {tool_id}: {e}"
                    )
        
        # Initialize agents with their specific tools
        # Following TypeScript pattern: each agent gets tools from its MCP server
        
        # Echo Agent (for testing)
        if "echo-ping" in tools_by_server:
            self.echo_agent = EchoAgent(tools=tools_by_server.get("echo-ping", []))
            await self.echo_agent.initialize(self.llm_client)
            logger.info("EchoAgent initialized with tools")
        else:
            self.echo_agent = EchoAgent()
            await self.echo_agent.initialize(self.llm_client)
        
        # Customer Query Agent
        if "customer-query" in tools_by_server:
            self.customer_query_agent = CustomerQueryAgent(
                tools=tools_by_server.get("customer-query", [])
            )
            await self.customer_query_agent.initialize(self.llm_client)
            logger.info("CustomerQueryAgent initialized with tools")
        else:
            self.customer_query_agent = CustomerQueryAgent()
            await self.customer_query_agent.initialize(self.llm_client)
        
        # Web Search Agent
        if "web-search" in tools_by_server:
            self.web_search_agent = WebSearchAgent(
                tools=tools_by_server.get("web-search", [])
            )
            await self.web_search_agent.initialize(self.llm_client)
            logger.info("WebSearchAgent initialized with tools")
        else:
            self.web_search_agent = WebSearchAgent()
            await self.web_search_agent.initialize(self.llm_client)
        
        # Itinerary Planning Agent
        if "itinerary-planning" in tools_by_server:
            self.itinerary_agent = ItineraryPlanningAgent(
                tools=tools_by_server.get("itinerary-planning", [])
            )
            await self.itinerary_agent.initialize(self.llm_client)
            logger.info("ItineraryPlanningAgent initialized with tools")
        else:
            self.itinerary_agent = ItineraryPlanningAgent()
            await self.itinerary_agent.initialize(self.llm_client)
        
        # Model Inference Agent
        if "model-inference" in tools_by_server:
            self.model_inference_agent = ModelInferenceAgent(
                tools=tools_by_server.get("model-inference", [])
            )
            await self.model_inference_agent.initialize(self.llm_client)
            logger.info("ModelInferenceAgent initialized with tools")
        else:
            self.model_inference_agent = ModelInferenceAgent()
            await self.model_inference_agent.initialize(self.llm_client)
        
        # Code Evaluation Agent
        if "code-evaluation" in tools_by_server:
            self.code_eval_agent = CodeEvaluationAgent(
                tools=tools_by_server.get("code-evaluation", [])
            )
            await self.code_eval_agent.initialize(self.llm_client)
            logger.info("CodeEvaluationAgent initialized with tools")
        else:
            self.code_eval_agent = CodeEvaluationAgent()
            await self.code_eval_agent.initialize(self.llm_client)
        
        # Destination Recommendation Agent
        if "destination-recommendation" in tools_by_server:
            self.destination_agent = DestinationRecommendationAgent(
                tools=tools_by_server.get("destination-recommendation", [])
            )
            await self.destination_agent.initialize(self.llm_client)
            logger.info("DestinationRecommendationAgent initialized with tools")
        else:
            self.destination_agent = DestinationRecommendationAgent()
            await self.destination_agent.initialize(self.llm_client)
        
        # Triage Agent gets all tools (like TypeScript TravelAgent)
        self.triage_agent = TriageAgent(tools=self.all_tools)
        await self.triage_agent.initialize(self.llm_client)
        logger.info("TriageAgent initialized with all tools")
        
        logger.info(
            f"MAF workflow fully initialized with {len(self.all_tools)} total tools"
        )

    @property
    def agents(self) -> List[Any]:
        """Get list of all initialized agents."""
        return [
            agent for agent in [
                self.triage_agent,
                self.customer_query_agent,
                self.destination_agent,
                self.itinerary_agent,
                self.code_eval_agent,
                self.model_inference_agent,
                self.web_search_agent,
                self.echo_agent,
            ]
            if agent is not None
        ]

    async def process_request(
        self, 
        message: str, 
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Process a travel planning request through the workflow.

        Args:
            message: User message/request
            context: Optional context information

        Returns:
            Workflow response

        Raises:
            RuntimeError: If workflow not initialized
        """
        if not self.llm_client or not self.triage_agent:
            raise RuntimeError("Workflow not initialized. Call initialize() first.")

        logger.info(f"Processing request: {message[:100]}...")
        
        try:
            # Use the triage agent to process the request
            # The triage agent will coordinate with other agents as needed
            result = await self.triage_agent.process(message, context)
            
            logger.info("Request processed successfully")
            return result
            
        except Exception as e:
            logger.error(f"Error processing request: {e}", exc_info=True)
            raise

    async def process_request_stream(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Process a travel planning request through the workflow with streaming.

        Args:
            message: User message/request
            context: Optional context information

        Yields:
            Events in the format:
            {
                "agent": agent_name or None,
                "event": event_type,
                "data": event_data
            }

        Raises:
            RuntimeError: If workflow not initialized
        """
        if not self.llm_client or not self.triage_agent:
            raise RuntimeError("Workflow not initialized. Call initialize() first.")

        logger.info(f"Processing streaming request: {message[:100]}...")
        
        try:
            # Send agent setup event
            yield {
                "agent": "TriageAgent",
                "event": "AgentSetup",
                "data": {
                    "message": "Initializing travel planning workflow with MCP tools",
                    "tool_count": len(self.all_tools),
                    "timestamp": None
                }
            }
            
            # Send agent tool call event
            yield {
                "agent": "TriageAgent",
                "event": "AgentToolCall",
                "data": {
                    "message": "Processing travel request with specialized agents",
                    "toolName": "triage_agent_process",
                    "timestamp": None
                }
            }
            
            # Process through triage agent
            result = await self.triage_agent.process(message, context)
            
            # Send streaming chunks of the response
            # Split the response into chunks for streaming effect
            chunk_size = 50
            for i in range(0, len(result), chunk_size):
                chunk = result[i:i + chunk_size]
                yield {
                    "agent": "TriageAgent",
                    "event": "AgentStream",
                    "data": {
                        "delta": chunk,
                        "timestamp": None
                    }
                }
            
            # Send completion event
            yield {
                "agent": "TriageAgent",
                "event": "AgentComplete",
                "data": {
                    "message": "Request processed successfully",
                    "result": result,
                    "timestamp": None
                }
            }
            
            logger.info("Streaming request processed successfully")
            
        except Exception as e:
            logger.error(f"Error processing streaming request: {e}", exc_info=True)
            yield {
                "agent": None,
                "event": "Error",
                "data": {
                    "error": str(e),
                    "timestamp": None
                }
            }
            raise

    async def get_agent_by_name(self, name: str) -> Optional[Any]:
        """Get a specific agent by name.

        Args:
            name: Agent name

        Returns:
            Agent instance or None if not found
        """
        for agent in self.agents:
            if agent.name == name:
                return agent
        return None

    async def handoff_to_agent(
        self,
        agent_name: str,
        message: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Handoff request to a specific agent.

        Args:
            agent_name: Name of the agent to handoff to
            message: Message to send to the agent
            context: Optional context

        Returns:
            Agent response

        Raises:
            ValueError: If agent not found
        """
        agent = await self.get_agent_by_name(agent_name)
        if not agent:
            raise ValueError(f"Agent {agent_name} not found")

        logger.info(f"Handing off to {agent_name}")
        return await agent.process(message, context)
    
    async def close(self) -> None:
        """Clean up MCP client resources."""
        for wrapper in self.mcp_wrappers.values():
            await wrapper.close()
        logger.info("Closed all MCP client connections")


# Global workflow orchestrator instance
workflow_orchestrator = TravelWorkflowOrchestrator()
