"""Magentic Orchestration for Travel Planning using Microsoft Agent Framework.

This module implements the Magentic orchestration pattern from Microsoft Agent Framework
for coordinating multiple specialized travel planning agents. Agents work with MCP tools
following the exact patterns from Microsoft Agent Framework samples.

Reference: https://learn.microsoft.com/en-us/agent-framework/user-guide/workflows/orchestrations/magentic
Sample: https://github.com/microsoft/agent-framework/blob/main/python/samples/getting_started/workflows/orchestration/magentic.py
"""

import asyncio
import logging
from typing import Any, AsyncGenerator, Dict, List, Optional

from agent_framework import (
    ChatAgent,
    MCPStreamableHTTPTool,
    MagenticAgentDeltaEvent,
    MagenticAgentMessageEvent,
    MagenticBuilder,
    MagenticCallbackEvent,
    MagenticCallbackMode,
    MagenticFinalResultEvent,
    MagenticOrchestratorMessageEvent,
    WorkflowOutputEvent,
)
from agent_framework.exceptions import ServiceResponseException

from config import settings
from orchestrator.providers import get_llm_client
from orchestrator.tools import tool_registry

logger = logging.getLogger(__name__)


class MagenticTravelOrchestrator:
    """Magentic-based travel planning orchestrator using Microsoft Agent Framework.
    
    Completely simplified implementation strictly following MAF best practices.
    Each workflow run creates fresh agents with their own MCP tool instances,
    properly managed using async context managers exactly as shown in MAF samples.
    
    Architecture:
    - CustomerQueryAgent: Handles customer inquiries with customer-query MCP tools
    - ItineraryAgent: Plans itineraries with itinerary-planning MCP tools
    - DestinationAgent: Recommends destinations (no MCP tools, uses LLM knowledge)
    
    Reference:
    - Magentic: https://github.com/microsoft/agent-framework/blob/main/python/samples/getting_started/workflows/orchestration/magentic.py
    - MCP tools: https://github.com/microsoft/agent-framework/blob/main/python/samples/getting_started/agents/openai/openai_responses_client_with_hosted_mcp.py
    """

    def __init__(self):
        """Initialize the Magentic travel orchestrator."""
        self.chat_client: Optional[Any] = None
        logger.info("Magentic Travel Orchestrator initialized")

    async def initialize(self) -> None:
        """Initialize the chat client for the workflow."""
        logger.info("Initializing Magentic travel planning workflow...")
        
        # Get the chat client from Microsoft Agent Framework
        self.chat_client = await get_llm_client()
        logger.info(f"✓ Chat client initialized for provider: {settings.llm_provider}")
        logger.info("✓ Magentic workflow ready")

    async def process_request_stream(
        self,
        user_message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Process a user request using the Magentic workflow with true streaming.
        
        Creates a fresh workflow for each request following MAF best practices.
        MCP tools are created once and passed to agents at creation time - MAF handles
        the connection lifecycle automatically through the workflow's async context manager.
        
        Args:
            user_message: The user's message/request
            conversation_history: Optional conversation history (not used in current implementation)
            
        Yields:
            Event dictionaries with type, agent, event, and data for UI consumption
        """
        if not self.chat_client:
            raise RuntimeError("Chat client not initialized. Call initialize() first.")
        
        logger.info(f"Processing request with Magentic workflow: {user_message[:100]}...")
        
        # Get MCP server metadata
        customer_query_metadata = tool_registry.get_server_metadata("customer-query")
        itinerary_metadata = tool_registry.get_server_metadata("itinerary-planning")
        
        # Helper function to safely create MCP tool
        def create_mcp_tool(metadata: Optional[Dict[str, Any]]) -> Optional[MCPStreamableHTTPTool]:
            """Create MCP tool from metadata with error handling."""
            if not metadata:
                return None
            
            try:
                headers = {}
                if metadata.get('access_token'):
                    headers["Authorization"] = f"Bearer {metadata['access_token']}"
                
                # Create tool exactly as shown in MAF samples
                return MCPStreamableHTTPTool(
                    name=metadata["name"],
                    url=metadata["url"],
                    headers=headers if headers else None,
                    load_tools=True,
                    load_prompts=False,
                    request_timeout=30,
                    approval_mode="never_require",  # Auto-approve for seamless experience
                )
            except Exception as e:
                logger.warning(f"⚠ Could not create MCP tool for {metadata.get('name')}: {e}")
                return None
        
        # Create MCP tool instances - will be passed to agents at creation
        customer_query_tool = create_mcp_tool(customer_query_metadata)
        itinerary_tool = create_mcp_tool(itinerary_metadata)
        
        # Log MCP tool availability
        if customer_query_tool:
            logger.info("✓ Customer Query MCP tool configured")
        else:
            logger.warning("⚠ Customer Query agent will run without MCP tools")
            
        if itinerary_tool:
            logger.info("✓ Itinerary MCP tool configured")
        else:
            logger.warning("⚠ Itinerary agent will run without MCP tools")
        
        try:
            # Create event queue for streaming
            event_queue: asyncio.Queue[Dict[str, Any]] = asyncio.Queue()
            workflow_done = False
            workflow_error: Optional[Exception] = None
            
            # Define streaming callback
            async def on_event(event: MagenticCallbackEvent) -> None:
                """Stream workflow events to UI in real-time."""
                event_data = self._convert_workflow_event(event)
                if event_data:
                    await event_queue.put(event_data)
                    logger.debug(f"→ Event: {event_data.get('event')} from {event_data.get('agent')}")
            
            # Build workflow with agents and tools
            # Following exact pattern from MAF sample - tools passed at agent creation
            workflow = (
                MagenticBuilder()
                .participants(
                    CustomerQueryAgent=ChatAgent(
                        name="CustomerQueryAgent",
                        description="Handles customer questions and travel information",
                        instructions=(
                            "You are a Customer Query Agent for a travel planning system. "
                            "Answer customer questions about destinations, hotels, and travel logistics. "
                            + ("Use the MCP tools to retrieve accurate information. " if customer_query_tool else "Use your knowledge. ") +
                            "Be helpful and customer-focused."
                        ),
                        chat_client=self.chat_client,
                        tools=customer_query_tool,  # Tool passed - MAF manages lifecycle
                    ),
                    ItineraryAgent=ChatAgent(
                        name="ItineraryAgent",
                        description="Creates detailed travel itineraries and schedules",
                        instructions=(
                            "You are an Itinerary Planning Agent for a travel planning system. "
                            "Create detailed day-by-day travel itineraries. "
                            + ("Use the MCP tools to plan itineraries. " if itinerary_tool else "Use your knowledge. ") +
                            "Be thorough and organized."
                        ),
                        chat_client=self.chat_client,
                        tools=itinerary_tool,  # Tool passed - MAF manages lifecycle
                    ),
                    DestinationAgent=ChatAgent(
                        name="DestinationAgent",
                        description="Recommends travel destinations based on preferences",
                        instructions=(
                            "You are a Destination Recommendation Agent. "
                            "Recommend destinations based on customer preferences. "
                            "Be creative and match recommendations to customer needs."
                        ),
                        chat_client=self.chat_client,
                        # No MCP tools - uses LLM knowledge
                    ),
                )
                .on_event(on_event, mode=MagenticCallbackMode.STREAMING)
                .with_standard_manager(
                    chat_client=self.chat_client,
                    max_round_count=8,
                    max_stall_count=2,
                    max_reset_count=1,
                )
                .build()
            )
            
            # Run workflow in background task
            async def run_workflow():
                """Execute workflow and mark completion."""
                nonlocal workflow_done, workflow_error
                try:
                    # workflow.run_stream() properly manages all async contexts including MCP tools
                    async for event in workflow.run_stream(user_message):
                        event_data = self._convert_workflow_event(event)
                        if event_data:
                            await event_queue.put(event_data)
                except ServiceResponseException as e:
                    # Handle timeout and service errors specially
                    logger.error(f"Service error in workflow: {e}", exc_info=True)
                    workflow_error = e
                    error_event = {
                        "type": "error",  # This is the ChatEvent.type
                        "event": "ServiceError",
                        "error": {
                            "message": "Request timed out or service unavailable. Please try again.",
                            "statusCode": 504,
                            "reason": {
                                "message": str(e),
                            }
                        }
                    }
                    await event_queue.put(error_event)
                except Exception as e:
                    logger.error(f"Error in workflow execution: {e}", exc_info=True)
                    workflow_error = e
                    error_event = {
                        "type": "error",  # This is the ChatEvent.type
                        "agent": None,
                        "event": "Error",
                        "message": f"Workflow error: {str(e)}",
                        "statusCode": 500,
                        "data": {
                            "agent": None,
                            "error": str(e),
                        }
                    }
                    await event_queue.put(error_event)
                finally:
                    workflow_done = True
                    await event_queue.put(None)  # Signal completion
            
            # Start workflow
            workflow_task = asyncio.create_task(run_workflow())
            
            # Stream events as they arrive
            try:
                while True:
                    try:
                        event_data = await asyncio.wait_for(event_queue.get(), timeout=0.1)
                        
                        if event_data is None:
                            # Completion signal
                            break
                            
                        yield event_data
                        
                    except asyncio.TimeoutError:
                        if workflow_done:
                            # Drain remaining events
                            while not event_queue.empty():
                                event_data = await event_queue.get()
                                if event_data:
                                    yield event_data
                            break
                        continue
                
                # Wait for workflow task
                await workflow_task
                
                # If there was an error, it's already been sent
                if workflow_error:
                    logger.error(f"✗ Workflow completed with error: {workflow_error}")
                else:
                    logger.info("✓ Workflow completed successfully")
                
            except Exception as e:
                logger.error(f"Error streaming workflow events: {e}", exc_info=True)
                workflow_task.cancel()
                try:
                    await workflow_task
                except asyncio.CancelledError:
                    pass
                raise
                    
        except ServiceResponseException as e:
            # Handle timeout and service errors specially
            logger.error(f"Service error in Magentic workflow: {e}", exc_info=True)
            yield {
                "type": "error",  # ChatEvent.type
                "agent": None,
                "event": "ServiceError",
                "message": "Request timed out or service unavailable. Please try again.",
                "statusCode": 504,
                "data": {
                    "agent": None,
                    "error": str(e),
                }
            }
        except Exception as e:
            logger.error(f"Error in Magentic workflow: {e}", exc_info=True)
            yield {
                "type": "error",  # ChatEvent.type
                "agent": None,
                "event": "Error",
                "message": f"Workflow error: {str(e)}",
                "statusCode": 500,
                "data": {
                    "agent": None,
                    "error": str(e),
                }
            }

    def _convert_workflow_event(self, event: Any) -> Optional[Dict[str, Any]]:
        """Convert a Magentic workflow event to our API event format.
        
        Expected UI format:
        {
          type: "metadata",
          agent: agent || null,
          event: event display name,
          data: { agent, ...event data }
        }
        
        Args:
            event: Workflow event from Magentic
            
        Returns:
            Event dictionary in our API format, or None if not relevant for UI
        """
        # Handle different event types from Microsoft Agent Framework
        if isinstance(event, MagenticOrchestratorMessageEvent):
            # Orchestrator planning messages
            message_text = getattr(event.message, 'text', '') if event.message else ""
            
            return {
                "type": "metadata",
                "agent": "Orchestrator",
                "event": f"Orchestrator{event.kind.title().replace('_', '')}",
                "data": {
                    "agent": "Orchestrator",
                    "message": message_text,
                    "kind": event.kind,
                }
            }
        
        elif isinstance(event, MagenticAgentDeltaEvent):
            # Token-by-token streaming from agents
            agent_id = event.agent_id or "UnknownAgent"
            
            return {
                "type": "metadata",
                "agent": agent_id,
                "event": "AgentDelta",
                "data": {
                    "agent": agent_id,
                    "delta": event.text,
                }
            }
        
        elif isinstance(event, MagenticAgentMessageEvent):
            # Complete agent messages
            agent_id = event.agent_id or "UnknownAgent"
            message_text = getattr(event.message, 'text', '') if event.message else ""
            
            return {
                "type": "metadata",
                "agent": agent_id,
                "event": "AgentMessage",
                "data": {
                    "agent": agent_id,
                    "message": message_text,
                    "role": getattr(event.message, 'role', None) if event.message else None,
                }
            }
        
        elif isinstance(event, MagenticFinalResultEvent):
            # Final result from workflow
            result_text = getattr(event.message, 'text', '') if event.message else "Task completed"
            
            return {
                "type": "metadata",
                "agent": None,
                "event": "FinalResult",
                "data": {
                    "agent": None,
                    "message": result_text,
                    "completed": True,
                }
            }
        
        elif isinstance(event, WorkflowOutputEvent):
            # Final workflow output
            output_data = str(event.data) if event.data else "Workflow completed"
            
            return {
                "type": "metadata",
                "agent": None,
                "event": "WorkflowComplete",
                "data": {
                    "agent": None,
                    "output": output_data,
                    "completed": True,
                }
            }
        
        # Return None for events we don't need to surface to UI
        return None


# Global orchestrator instance
magentic_orchestrator = MagenticTravelOrchestrator()
