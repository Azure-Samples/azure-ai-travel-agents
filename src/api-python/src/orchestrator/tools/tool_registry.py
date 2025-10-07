"""Tool registry for managing MCP server connections.

This module provides a centralized registry for MCP tool servers,
using Microsoft Agent Framework's built-in MCPStreamableHTTPTool.

Reference: https://learn.microsoft.com/en-us/agent-framework/user-guide/model-context-protocol/using-mcp-tools
"""

import asyncio
import logging
from typing import Optional, Any, Dict

try:
    from agent_framework import MCPStreamableHTTPTool
except ImportError:
    raise ImportError(
        "Microsoft Agent Framework SDK is required. "
        "Install with: pip install agent-framework>=1.0.0b251001"
    )

from .tool_config import MCP_TOOLS_CONFIG, McpServerName

logger = logging.getLogger(__name__)


class ToolRegistry:
    """Registry for managing MCP tool server metadata.
    
    Simplified implementation that only stores metadata about MCP servers.
    Each agent creates its own MCPStreamableHTTPTool instances and manages
    their lifecycle using async context managers, following Microsoft Agent
    Framework best practices.
    
    This avoids issues with:
    - Shared async context managers across different tasks
    - Cancel scope violations
    - Persistent connection management
    
    Reference: https://github.com/microsoft/agent-framework/blob/main/python/samples/getting_started/agents/openai/openai_chat_client_with_local_mcp.py
    """

    def __init__(self) -> None:
        """Initialize the tool registry with server metadata."""
        self._server_metadata: Dict[str, Dict[str, Any]] = {}
        self._initialize_metadata()
        logger.info("MCP tool registry initialized (metadata only)")

    def _initialize_metadata(self) -> None:
        """Initialize server metadata from configuration."""
        for server_id, server_def in MCP_TOOLS_CONFIG.items():
            config = server_def["config"]
            name = server_def["name"]
            
            # Store only metadata - no actual connections
            self._server_metadata[server_id] = {
                "id": server_id,
                "name": name,
                "url": config["url"],
                "type": config.get("type", "http"),
                "selected": server_id != "echo-ping",
                "access_token": config.get("accessToken"),
            }
            
            logger.info(f"Registered MCP server '{name}' ({server_id}) at {config['url']}")

        logger.info(f"Tool registry ready with {len(self._server_metadata)} MCP servers")

    def create_mcp_tool(self, server_id: McpServerName) -> Optional[MCPStreamableHTTPTool]:
        """Create a new MCP tool instance for a server.
        
        Each call creates a fresh MCPStreamableHTTPTool instance that should be
        used within an async context manager. This follows the pattern from
        Microsoft Agent Framework samples.
        
        Args:
            server_id: The ID of the MCP server
            
        Returns:
            New MCPStreamableHTTPTool instance or None if server not found
            
        Example:
            ```python
            tool = registry.create_mcp_tool("customer-query")
            if tool:
                async with tool:
                    # Use tool with agent
                    result = await agent.run(query, tools=tool)
            ```
        """
        metadata = self._server_metadata.get(server_id)
        if not metadata:
            logger.warning(f"MCP server '{server_id}' not found in registry")
            return None
        
        # Build headers if access token provided
        headers = None
        access_token = metadata.get("access_token")
        if access_token:
            headers = {"Authorization": f"Bearer {access_token}"}
        
        # Create a new MCPStreamableHTTPTool instance
        # The caller is responsible for using it in an async context manager
        return MCPStreamableHTTPTool(
            name=metadata["name"],
            url=metadata["url"],
            headers=headers,
            load_tools=True,
            load_prompts=False,
            request_timeout=30,
        )

    def get_server_metadata(self, server_id: McpServerName) -> Optional[Dict[str, Any]]:
        """Get metadata for a server without creating a connection.
        
        Args:
            server_id: The ID of the MCP server
            
        Returns:
            Server metadata dictionary or None if not found
        """
        return self._server_metadata.get(server_id)

    async def list_tools(self) -> Dict[str, Any]:
        """List all available MCP tools with reachability checks.
        
        Ports the TypeScript mcpToolsList implementation to:
        1. Connect to each MCP server
        2. List the actual tools available on each server
        3. Return detailed information including tool definitions
        
        Returns response in the format expected by the frontend:
        {
          "tools": [
            {
              "id": "customer-query",
              "name": "Customer Query",
              "url": "http://localhost:5001/mcp",
              "type": "http",
              "reachable": true,
              "selected": true,
              "tools": [...]  # Actual tool definitions from the server
            }
          ]
        }
        """
        async def check_server_and_list_tools(server_id: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
            """Connect to MCP server and list its tools, mirroring TS mcpToolsList behavior."""
            server_info = {
                "id": server_id,
                "name": metadata["name"],
                "url": metadata["url"],
                "type": metadata["type"],
                "reachable": False,
                "selected": metadata["selected"],
                "tools": []
            }
            
            # Create MCP tool instance to connect and list tools
            try:
                logger.info(f"Connecting to MCP server {metadata['name']} at {metadata['url']}")
                mcp_tool = self.create_mcp_tool(server_id)
                
                if not mcp_tool:
                    logger.warning(f"Could not create MCP tool for server '{server_id}'")
                    return server_info
                
                # Use the tool in async context manager to connect
                async with mcp_tool:
                    logger.info(f"MCP server {metadata['name']} is reachable")
                    server_info["reachable"] = True
                    
                    # List tools from the server
                    # The MCPStreamableHTTPTool loads tools on connection
                    # Access them via the tool's internal state
                    if hasattr(mcp_tool, '_tools') and mcp_tool._tools:
                        tools_list = []
                        for tool in mcp_tool._tools:
                            # Convert tool to dict format
                            tool_info = {
                                "name": tool.metadata.name if hasattr(tool, 'metadata') else str(tool),
                                "description": tool.metadata.description if hasattr(tool, 'metadata') else ""
                            }
                            tools_list.append(tool_info)
                        
                        server_info["tools"] = tools_list
                        logger.info(f"MCP server {metadata['name']} has {len(tools_list)} tools")
                    else:
                        logger.info(f"MCP server {metadata['name']} has 0 tools")
                        
            except Exception as error:
                logger.error(f"MCP server {metadata['name']} is not reachable: {str(error)}")
                server_info["error"] = str(error)
            
            return server_info
        
        # Check all servers concurrently, matching TS Promise.all pattern
        tasks = []
        for server_id, metadata in self._server_metadata.items():
            task = asyncio.create_task(check_server_and_list_tools(server_id, metadata))
            tasks.append(task)
        
        # Wait for all checks with overall timeout
        try:
            results = await asyncio.wait_for(
                asyncio.gather(*tasks, return_exceptions=True),
                timeout=10.0  # Increased timeout for actual MCP connections
            )
        except asyncio.TimeoutError:
            logger.warning("Tool list overall timeout - returning partial results")
            results = []
            for task in tasks:
                if task.done():
                    try:
                        results.append(task.result())
                    except Exception as e:
                        logger.debug(f"Error getting task result: {e}")
                else:
                    task.cancel()
        
        # Build tools list from results
        tools_list = []
        for result in results:
            if isinstance(result, dict):
                tools_list.append(result)
            elif isinstance(result, Exception):
                logger.debug(f"Error checking server: {result}")
        
        return {"tools": tools_list}

    async def close_all(self) -> None:
        """Cleanup resources.
        
        Since we don't maintain persistent connections, this just clears metadata.
        """
        logger.info("Cleaning up tool registry...")
        self._server_metadata.clear()
        logger.info("Tool registry cleaned up")


# Global tool registry instance
# Import and use this singleton throughout the application
tool_registry = ToolRegistry()
