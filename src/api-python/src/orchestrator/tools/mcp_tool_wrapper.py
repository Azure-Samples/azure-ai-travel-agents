"""MCP Tool wrapper for Microsoft Agent Framework.

This module provides MCP tool integration using the Microsoft Agent Framework's
built-in MCP support (MCPStreamableHTTPTool).

Reference: https://learn.microsoft.com/en-us/agent-framework/user-guide/model-context-protocol/using-mcp-tools
"""

import asyncio
import logging
from typing import Any, Dict, List, Optional

try:
    from agent_framework import MCPStreamableHTTPTool
except ImportError:
    raise ImportError(
        "Microsoft Agent Framework SDK is required. "
        "Install with: pip install agent-framework>=1.0.0b251001"
    )

from .tool_config import MCPServerConfig

logger = logging.getLogger(__name__)


class MCPToolLoader:
    """MCP Tool Loader for Microsoft Agent Framework.
    
    Uses the built-in MCPStreamableHTTPTool from Microsoft Agent Framework
    to load and manage MCP tools. The tool is used as an async context manager
    to ensure proper connection lifecycle.
    """

    def __init__(self, server_config: MCPServerConfig, server_name: str):
        """Initialize MCP tool loader.
        
        Args:
            server_config: MCP server configuration containing URL
            server_name: Human-readable name of the MCP server
        """
        self.server_config = server_config
        self.server_name = server_name
        self.base_url = server_config["url"].rstrip("/")
        self.access_token = server_config.get("accessToken")
        self._mcp_tool: Optional[MCPStreamableHTTPTool] = None
        self._tools: List[Any] = []
        
        # Store configuration for creating the tool
        self.headers = {}
        if self.access_token:
            self.headers["Authorization"] = f"Bearer {self.access_token}"
        
        logger.info(
            f"Initialized MCP tool loader for '{self.server_name}' at {self.base_url}"
        )

    async def get_tools(self) -> List[Any]:
        """Get tools from MCP server using MAF's built-in MCP support.
        
        Uses the MCPStreamableHTTPTool as an async context manager to ensure
        proper connection lifecycle management.
        
        If the remote server doesn't respond or is unavailable, logs a warning
        and returns an empty list instead of throwing an exception.
        
        Returns:
            List of AIFunction instances from the MCP tool, or empty list if server unavailable
        """
        try:
            # Use MCPStreamableHTTPTool as async context manager
            # Wrap the entire context manager in try/except to catch connection errors
            async with MCPStreamableHTTPTool(
                name=self.server_name,
                url=self.base_url,
                headers=self.headers if self.headers else None,
                load_tools=True,
                load_prompts=False,
                request_timeout=30,
            ) as mcp_tool:
                # The MCPStreamableHTTPTool automatically loads tools on connect
                self._tools = list(mcp_tool.functions)
                
                logger.info(
                    f"✓ Retrieved {len(self._tools)} tools from MCP server '{self.server_name}'"
                )
                
                return self._tools
            
        except asyncio.CancelledError:
            # CancelledError from connection timeout or cancellation
            logger.warning(
                f"⚠ MCP server '{self.server_name}' at {self.base_url} connection cancelled or timed out"
            )
            logger.warning(
                f"⚠ Continuing without tools from '{self.server_name}'"
            )
            return []
        except (ConnectionError, OSError, TimeoutError) as e:
            # Network/connection errors
            logger.warning(
                f"⚠ MCP server '{self.server_name}' at {self.base_url} is unavailable or not responding: {str(e)}"
            )
            logger.warning(
                f"⚠ Continuing without tools from '{self.server_name}'"
            )
            return []
        except Exception as e:
            # Any other errors - log warning and continue
            logger.warning(
                f"⚠ Error connecting to MCP server '{self.server_name}' at {self.base_url}: {type(e).__name__}: {str(e)}"
            )
            logger.warning(
                f"⚠ Continuing without tools from '{self.server_name}'"
            )
            return []

    async def close(self) -> None:
        """Clean up MCP tool resources.
        
        Note: When using async context manager, cleanup is automatic.
        This method is kept for API compatibility.
        """
        # When using async context manager, cleanup is automatic
        logger.debug(f"MCP tool for '{self.server_name}' cleanup handled by context manager")
