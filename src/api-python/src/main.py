"""Main FastAPI application for Azure AI Travel Agents (Python)."""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
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


# Note: /api/chat endpoint will be implemented in Phase 4
# after agents and workflow are implemented

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=True,
        log_level=settings.log_level.lower(),
    )
