"""Main FastAPI application for Azure AI Travel Agents (Python)."""

import asyncio
import json
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from .config import settings
from .orchestrator import workflow_orchestrator
from .orchestrator.tools.tool_registry import tool_registry

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
    
    # Initialize MAF workflow orchestrator with timeout
    # This prevents the startup from hanging if MCP servers are slow/unavailable
    logger.info("Initializing MAF workflow orchestrator...")
    try:
        # Set a reasonable timeout for initialization (60 seconds)
        await asyncio.wait_for(
            workflow_orchestrator.initialize(),
            timeout=60.0
        )
        logger.info("✓ MAF workflow orchestrator ready")
    except asyncio.TimeoutError:
        logger.warning("⚠ Workflow initialization timed out (MCP servers may be slow/unavailable)")
        logger.warning("⚠ Application will start with degraded functionality")
    except asyncio.CancelledError:
        logger.warning("⚠ Workflow initialization cancelled")
        logger.warning("⚠ Application startup interrupted")
        # Re-raise to let FastAPI handle it properly
        raise
    except Exception as e:
        logger.error(f"❌ Error initializing workflow: {e}", exc_info=True)
        logger.warning("⚠ Application will start with degraded functionality")

    yield

    # Shutdown
    logger.info("Shutting down Azure AI Travel Agents API (Python)")
    try:
        await asyncio.wait_for(
            tool_registry.close_all(),
            timeout=10.0
        )
        logger.info("✓ Cleanup complete")
    except asyncio.TimeoutError:
        logger.warning("⚠ Shutdown cleanup timed out")
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
        "total_servers": len(tool_registry.loaders),
        "configured_servers": list(tool_registry.loaders.keys()),
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

    Returns:
        Dictionary of available tools from all MCP servers with status information
    """
    try:
        tools_info = await tool_registry.list_tools()
        return tools_info
    except Exception as e:
        logger.error(f"Error listing tools: {e}", exc_info=True)
        return {
            "error": str(e),
            "servers": {},
            "total_tools": 0,
            "total_servers": 0,
            "available_servers": 0,
        }


@app.post("/api/chat")
async def chat(request: ChatRequest) -> StreamingResponse:
    """Process a chat request through the MAF workflow with SSE streaming.

    Args:
        request: Chat request with message and optional context

    Returns:
        StreamingResponse with Server-Sent Events

    Raises:
        HTTPException: If processing fails
    """
    async def event_generator() -> AsyncGenerator[str, None]:
        """Generate Server-Sent Events for the chat response."""
        try:
            logger.info(f"Processing chat request: {request.message[:100]}...")
            
            # Process through MAF workflow with streaming
            async for event in workflow_orchestrator.process_request_stream(
                message=request.message,
                context=request.context
            ):
                # Format event according to schema:
                # {
                #   type: "metadata",
                #   agent: current Agent Name || null,
                #   event: event type,
                #   data: stringified object containing the agent data
                # }
                event_data = {
                    "type": "metadata",
                    "agent": event.get("agent"),
                    "event": event.get("event"),
                    "data": event.get("data")
                }
                
                # Send as SSE format
                yield json.dumps(event_data) + "\n\n"
            
            logger.info("Request processed successfully")
            
        except Exception as e:
            logger.error(f"Error processing chat request: {e}", exc_info=True)
            error_event = {
                "type": "metadata",
                "agent": None,
                "event": "error",
                "data": {"error": str(e)}
            }
            yield json.dumps(error_event) + "\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=True,
        log_level=settings.log_level.lower(),
    )
