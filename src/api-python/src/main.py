"""Main FastAPI application for Azure AI Travel Agents (Python)."""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """Process a chat request through the MAF workflow.

    Args:
        request: Chat request with message and optional context

    Returns:
        Chat response with agent output

    Raises:
        HTTPException: If processing fails
    """
    try:
        logger.info(f"Processing chat request: {request.message[:100]}...")
        
        # Process through MAF workflow
        response = await workflow_orchestrator.process_request(
            message=request.message,
            context=request.context
        )
        
        return ChatResponse(
            response=response,
            agent="TravelPlanningWorkflow"
        )
        
    except Exception as e:
        logger.error(f"Error processing chat request: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process request: {str(e)}"
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
