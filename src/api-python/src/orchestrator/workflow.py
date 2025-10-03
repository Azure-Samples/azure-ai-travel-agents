"""MAF Workflow Orchestrator for travel planning agents."""

import logging
from typing import Any, AsyncGenerator, Dict, Optional

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

logger = logging.getLogger(__name__)


class TravelWorkflowOrchestrator:
    """Orchestrates multi-agent workflow for travel planning using MAF.
    
    This class manages the initialization and coordination of all agents
    in the travel planning system using Microsoft Agent Framework.
    
    Note: This is a simplified orchestrator that uses the triage agent
    as the primary agent for routing requests.
    """

    def __init__(self):
        """Initialize the workflow orchestrator."""
        self.llm_client: Optional[Any] = None
        
        # Initialize all agents
        self.triage_agent = TriageAgent()
        self.customer_query_agent = CustomerQueryAgent()
        self.destination_agent = DestinationRecommendationAgent()
        self.itinerary_agent = ItineraryPlanningAgent()
        self.code_eval_agent = CodeEvaluationAgent()
        self.model_inference_agent = ModelInferenceAgent()
        self.web_search_agent = WebSearchAgent()
        self.echo_agent = EchoAgent()
        
        self.agents = [
            self.triage_agent,
            self.customer_query_agent,
            self.destination_agent,
            self.itinerary_agent,
            self.code_eval_agent,
            self.model_inference_agent,
            self.web_search_agent,
            self.echo_agent,
        ]
        
        logger.info("Workflow orchestrator initialized with 8 agents")

    async def initialize(self) -> None:
        """Initialize the workflow with LLM client and all agents."""
        logger.info("Initializing MAF workflow...")
        
        # Get LLM client based on configured provider
        self.llm_client = await get_llm_client()
        logger.info(f"LLM client initialized for provider: {settings.llm_provider}")
        
        # Initialize all agents with LLM client
        for agent in self.agents:
            await agent.initialize(self.llm_client)
        
        logger.info("MAF workflow fully initialized and ready")

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
        if not self.llm_client:
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
        if not self.llm_client:
            raise RuntimeError("Workflow not initialized. Call initialize() first.")

        logger.info(f"Processing streaming request: {message[:100]}...")
        
        try:
            # Send agent setup event
            yield {
                "agent": "TriageAgent",
                "event": "AgentSetup",
                "data": {
                    "message": "Initializing travel planning workflow",
                    "timestamp": None
                }
            }
            
            # Send agent tool call event
            yield {
                "agent": "TriageAgent",
                "event": "AgentToolCall",
                "data": {
                    "message": "Processing travel request",
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


# Global workflow orchestrator instance
workflow_orchestrator = TravelWorkflowOrchestrator()
