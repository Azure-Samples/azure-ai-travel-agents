"""Main FastAPI application for Azure AI Travel Agents (Python)."""

import asyncio
import json
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from .config import settings
from .orchestrator.magentic_workflow import magentic_orchestrator
from .orchestrator.tools.tool_registry import tool_registry

from agent_framework.observability import setup_observability

setup_observability(enable_sensitive_data=True)

# Configure logging
logging.basicConfig(
    level=settings.log_level,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "message": "%(message)s"}',
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage application lifespan events."""
    # Startup
    logger.info("Starting Azure AI Travel Agents API (Python)")
    logger.info(f"Service: {settings.otel_service_name}")
    logger.info(f"Port: {settings.port}")
    logger.info(f"LLM Provider: {settings.llm_provider}")

    # Initialize Magentic workflow orchestrator
    logger.info("Initializing Magentic workflow orchestrator...")
    try:
        await magentic_orchestrator.initialize()
        logger.info("✓ Magentic workflow orchestrator ready")
    except Exception as e:
        logger.error(f"❌ Error initializing workflow: {e}", exc_info=True)
        logger.warning("⚠ Application will start with degraded functionality")

    yield

    # Shutdown
    logger.info("Shutting down Azure AI Travel Agents API (Python)")
    try:
        await tool_registry.close_all()
        logger.info("✓ Cleanup complete")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")


# Create FastAPI application
app = FastAPI(
    title="Azure AI Travel Agents API (Python)",
    description="Multi-agent travel planning system using Microsoft Agent Framework",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    """Request model for chat endpoint."""

    message: str
    context: dict = {}


class ChatResponse(BaseModel):
    """Response model for chat endpoint."""

    response: str
    agent: str = "TravelPlanningWorkflow"


@app.get("/api/health")
async def health() -> dict:
    """Health check endpoint.

    Returns:
        Health status including MCP server availability
    """
    # Get MCP server status
    mcp_status = {
        "total_servers": len(tool_registry._server_metadata),
        "configured_servers": list(tool_registry._server_metadata.keys()),
    }

    return {
        "status": "OK",
        "service": settings.otel_service_name,
        "version": "1.0.0",
        "llm_provider": settings.llm_provider,
        "mcp": mcp_status,
    }


@app.get("/api/tools")
async def list_tools() -> dict:
    """List all available MCP tools.

    Mirrors the TypeScript mcpToolsList implementation by:
    - Connecting to each configured MCP server
    - Listing the actual tools available on each server
    - Checking reachability status

    Returns:
        Dictionary with tools array matching frontend format:
        {
          "tools": [
            {
              "id": "customer-query",
              "name": "Customer Query",
              "url": "http://localhost:8001/mcp",
              "type": "http",
              "reachable": true,
              "selected": true,
              "tools": [...]  # Actual tool definitions from the server
            }, {...}
          ]
        }
    """
    try:
        tools_info = await tool_registry.list_tools()
        return tools_info
    except Exception as e:
        logger.error(f"Error listing tools: {e}", exc_info=True)
        return {"tools": [], "error": str(e)}


@app.post("/api/chat")
async def chat(request: ChatRequest) -> StreamingResponse:
    """Process a chat request through the Magentic workflow with SSE streaming.

    Args:
        request: Chat request with message and optional context

    Returns:
        StreamingResponse with Server-Sent Events

    Raises:
        HTTPException: If processing fails
    """

    async def event_generator() -> AsyncGenerator[str, None]:
        """Generate Server-Sent Events for the chat response.

        Format matches UI ChatStreamState:
        {
          type: 'START' | 'END' | 'ERROR' | 'MESSAGE',
          event: ChatEvent,
          error?: { type, message, statusCode }
        }
        """
        try:
            logger.info(f"Processing chat request with Magentic: {request.message[:100]}...")

            # Send START event
            start_event = {
                "type": "metadata",
                "event": "WorkflowStarted",
                "data": {"agent": "Orchestrator", "message": "Starting workflow"},
            }
            yield f"data: {json.dumps(start_event)}\n\n"

            # Process through Magentic workflow with streaming
            async for internal_event in magentic_orchestrator.process_request_stream(
                user_message=request.message, conversation_history=request.context
            ):
                # Wrap internal event in ChatStreamState format
                if internal_event.get("type") == "error":
                    # Error event - extract message and statusCode from the event
                    error_message = internal_event.get("message", "An error occurred")
                    error_status_code = internal_event.get("statusCode", 500)

                    stream_state = {
                        "type": "metadata",
                        "event": internal_event,
                        "error": {"message": error_message, "statusCode": error_status_code},
                    }
                else:
                    # Regular message/metadata event
                    stream_state = internal_event

                yield f"data: {json.dumps(stream_state)}\n\n"

            # Send END event
            end_event = {
                "type": "metadata",
                "agent": "TravelPlanningWorkflow",
                "event": "Complete",
                "data": {"message": "Request processed successfully"},
            }
            yield f"data: {json.dumps(end_event)}\n\n"
            logger.info("Request processed successfully")

        except Exception as e:
            logger.error(f"Error processing chat request: {e}", exc_info=True)
            error_stream_state = {
                "type": "metadata",
                "event": {
                    "type": "error",
                    "agent": None,
                    "event": "Error",
                    "data": {
                        "agent": None,
                        "error": str(e),
                        "message": f"An error occurred: {str(e)}",
                        "statusCode": 500,
                    },
                },
                "error": {"type": "general", "message": f"An error occurred: {str(e)}", "statusCode": 500},
            }
            yield f"data: {json.dumps(error_stream_state)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=True,
        log_level=settings.log_level.lower(),
    )
