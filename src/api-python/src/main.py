"""Main FastAPI application for Azure AI Travel Agents (Python)."""

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
    
    # Initialize MAF workflow orchestrator
    logger.info("Initializing MAF workflow orchestrator...")
    await workflow_orchestrator.initialize()
    logger.info("MAF workflow orchestrator ready")

    yield

    # Shutdown
    logger.info("Shutting down Azure AI Travel Agents API (Python)")
    await tool_registry.close_all()


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
        Health status
    """
    return {
        "status": "OK",
        "service": settings.otel_service_name,
        "version": "1.0.0",
        "llm_provider": settings.llm_provider,
    }


@app.get("/api/tools")
async def list_tools() -> dict:
    """List all available MCP tools.

    Returns:
        Dictionary of available tools from all MCP servers
    """
    try:
        tools = await tool_registry.list_tools()
        return {"tools": tools}
    except Exception as e:
        logger.error(f"Error listing tools: {e}")
        return {"error": str(e)}


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
