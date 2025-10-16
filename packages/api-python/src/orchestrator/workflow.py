"""MAF Workflow Orchestrator for travel planning agents with simplified MCP integration."""

import logging
from typing import Any, AsyncGenerator, Dict, List, Optional

from ..config import settings
from .providers import get_llm_client
from .agents.triage_agent import TriageAgent
from .agents.customer_query_agent import CustomerQueryAgent
from .agents.destination_recommendation_agent import DestinationRecommendationAgent
from .agents.itinerary_planning_agent import ItineraryPlanningAgent
from .agents.echo_agent import EchoAgent
from .tools import MCP_TOOLS_CONFIG, tool_registry

logger = logging.getLogger(__name__)


class TravelWorkflowOrchestrator:
    """Orchestrates multi-agent workflow for travel planning using MAF.

    This class manages the initialization and coordination of all agents
    in the travel planning system using Microsoft Agent Framework with
    simplified MCP integration using MAF's built-in MCP support.
    """

    def __init__(self):
        """Initialize the workflow orchestrator."""
        self.chat_client: Optional[Any] = None
        self.all_tools: List[Any] = []

        # Initialize agents (will be configured with tools during initialize())
        self.triage_agent: Optional[TriageAgent] = None
        self.customer_query_agent: Optional[CustomerQueryAgent] = None
        self.destination_agent: Optional[DestinationRecommendationAgent] = None
        self.itinerary_agent: Optional[ItineraryPlanningAgent] = None
        self.echo_agent: Optional[EchoAgent] = None

        logger.info("Workflow orchestrator initialized")

    async def initialize(self, enabled_tools: Optional[List[str]] = None) -> None:
        """Initialize the workflow with LLM client, MCP tools, and all agents.

        Uses Microsoft Agent Framework's built-in MCP support via MCPStreamableHTTPTool.

        Args:
            enabled_tools: List of enabled tool IDs. If None, all tools are enabled.
        """
        logger.info("Initializing MAF workflow with simplified MCP integration...")

        # Get the chat client from Microsoft Agent Framework
        self.chat_client = await get_llm_client()
        logger.info(f"Chat client initialized for provider: {settings.llm_provider}")

        # Determine which tools to enable (default: all except echo-ping for production)
        if enabled_tools is None:
            enabled_tools = [
                "customer-query",
                "itinerary-planning",
                "destination-recommendation",
                "echo-ping",
            ]

        # Load MCP tools using the tool registry (which uses MAF's built-in MCP support)
        # This will continue even if some servers are unavailable
        self.all_tools = await tool_registry.get_all_tools(servers=enabled_tools)

        if self.all_tools:
            logger.info(f"✓ Loaded {len(self.all_tools)} tools - agents will have MCP capabilities")
        else:
            logger.warning(f"⚠ No MCP tools loaded - agents will run without MCP capabilities")
            logger.warning(f"⚠ Check if MCP servers are running and accessible")

        # Initialize specialized agents with their specific tools
        # Each agent gets the full tool list - the agent's system prompt determines usage

        # Triage Agent (orchestrator)
        self.triage_agent = TriageAgent(tools=self.all_tools)
        await self.triage_agent.initialize(self.chat_client)
        logger.info("TriageAgent initialized")

        # Customer Query Agent
        self.customer_query_agent = CustomerQueryAgent(tools=self.all_tools)
        await self.customer_query_agent.initialize(self.chat_client)
        logger.info("CustomerQueryAgent initialized")

        # Destination Recommendation Agent
        self.destination_agent = DestinationRecommendationAgent(tools=self.all_tools)
        await self.destination_agent.initialize(self.chat_client)
        logger.info("DestinationRecommendationAgent initialized")

        # Itinerary Planning Agent
        self.itinerary_agent = ItineraryPlanningAgent(tools=self.all_tools)
        await self.itinerary_agent.initialize(self.chat_client)
        logger.info("ItineraryPlanningAgent initialized")

        # Echo Agent (for testing)
        self.echo_agent = EchoAgent(tools=self.all_tools)
        await self.echo_agent.initialize(self.chat_client)
        logger.info("EchoAgent initialized")

        logger.info(f"MAF workflow fully initialized with {len(self.all_tools)} total tools")

    @property
    def agents(self) -> List[Any]:
        """Get list of all initialized agents."""
        return [
            agent
            for agent in [
                self.triage_agent,
                self.customer_query_agent,
                self.destination_agent,
                self.itinerary_agent,
                self.echo_agent,
            ]
            if agent is not None
        ]

    async def process(self, message: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Process a message through the multi-agent workflow.

        Args:
            message: User message to process
            context: Optional context information

        Returns:
            Response from the triage agent
        """
        if not self.triage_agent:
            raise RuntimeError("Workflow not initialized. Call initialize() first.")

        logger.info(f"Processing message through MAF workflow: {message[:100]}...")

        # Use the triage agent to process the message
        # It will coordinate with other agents as needed through its tools
        response = await self.triage_agent.process(message, context)

        logger.info("Message processing complete")
        return response

    async def process_stream(
        self, message: str, context: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Process a message with streaming response.

        Args:
            message: User message to process
            context: Optional context information

        Yields:
            Streaming response chunks
        """
        if not self.triage_agent:
            raise RuntimeError("Workflow not initialized. Call initialize() first.")

        logger.info(f"Processing message with streaming: {message[:100]}...")

        # For now, use non-streaming and yield as single chunk
        # TODO: Implement true streaming with MAF's streaming capabilities
        response = await self.triage_agent.process(message, context)

        yield {"type": "response", "agent": self.triage_agent.name, "data": {"message": response}}

        logger.info("Streaming message processing complete")

    async def cleanup(self) -> None:
        """Clean up workflow resources."""
        logger.info("Cleaning up workflow resources...")

        try:
            # Close all MCP tool connections
            await tool_registry.close_all()
            logger.info("MCP tool connections closed")
        except Exception as e:
            logger.error(f"Error closing MCP connections: {e}")

        logger.info("Workflow cleanup complete")
        self.triage_agent = None
        self.customer_query_agent = None
        self.destination_agent = None
        self.itinerary_agent = None
        self.echo_agent = None

    @property
    def agents(self) -> List[Any]:
        """Get list of all initialized agents."""
        return [
            agent
            for agent in [
                self.triage_agent,
                self.customer_query_agent,
                self.destination_agent,
                self.itinerary_agent,
                self.echo_agent,
            ]
            if agent is not None
        ]

    async def process_request(self, message: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Process a travel planning request through the workflow.

        Args:
            message: User message/request
            context: Optional context information

        Returns:
            Workflow response

        Raises:
            RuntimeError: If workflow not initialized
        """
        if not self.chat_client or not self.triage_agent:
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
        self, message: str, context: Optional[Dict[str, Any]] = None
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
        if not self.chat_client or not self.triage_agent:
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
                    "timestamp": None,
                },
            }

            # Send agent tool call event
            yield {
                "agent": "TriageAgent",
                "event": "AgentToolCall",
                "data": {
                    "message": "Processing travel request with specialized agents",
                    "toolName": "triage_agent_process",
                    "timestamp": None,
                },
            }

            # Process through triage agent
            result = await self.triage_agent.process(message, context)

            # Send streaming chunks of the response
            # Split the response into chunks for streaming effect
            chunk_size = 50
            for i in range(0, len(result), chunk_size):
                chunk = result[i : i + chunk_size]
                yield {"agent": "TriageAgent", "event": "AgentStream", "data": {"delta": chunk, "timestamp": None}}

            # Send completion event
            yield {
                "agent": "TriageAgent",
                "event": "AgentComplete",
                "data": {"message": "Request processed successfully", "result": result, "timestamp": None},
            }

            logger.info("Streaming request processed successfully")

        except Exception as e:
            logger.error(f"Error processing streaming request: {e}", exc_info=True)
            yield {"agent": None, "event": "Error", "data": {"error": str(e), "timestamp": None}}
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

    async def handoff_to_agent(self, agent_name: str, message: str, context: Optional[Dict[str, Any]] = None) -> str:
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
        for loader in self.mcp_loaders.values():
            await wrapper.close()
        logger.info("Closed all MCP client connections")


# Global workflow orchestrator instance
workflow_orchestrator = TravelWorkflowOrchestrator()
