"""Tool registry for managing MCP server connections.

This module provides a centralized registry for MCP tool servers,
loading tools using Microsoft Agent Framework's built-in MCP support.

Reference: https://learn.microsoft.com/en-us/agent-framework/user-guide/model-context-protocol/using-mcp-tools
"""

import logging
from typing import List, Optional, Any

from .mcp_tool_wrapper import MCPToolLoader
from .tool_config import MCP_TOOLS_CONFIG, McpServerName

logger = logging.getLogger(__name__)


class ToolRegistry:
    """Registry for managing MCP tool server connections.
    
    Uses Microsoft Agent Framework's built-in MCP support to load and manage tools.
    """

    def __init__(self) -> None:
        """Initialize the tool registry."""
        self.loaders: dict[str, MCPToolLoader] = {}
        self._initialize_loaders()
        logger.info("MCP tool registry initialized")

    def _initialize_loaders(self) -> None:
        """Initialize MCP tool loaders for all configured servers."""
        for server_id, server_def in MCP_TOOLS_CONFIG.items():
            try:
                config = server_def["config"]
                name = server_def["name"]
                
                # Create loader using MAF's built-in MCP support
                loader = MCPToolLoader(config, name)
                self.loaders[server_id] = loader
                
                logger.info(
                    f"Initialized MCP server '{name}' ({server_id}) at {config['url']}"
                )
                
            except Exception as e:
                logger.error(
                    f"Failed to initialize MCP server '{server_id}': {e}"
                )

        logger.info(
            f"Tool registry ready with {len(self.loaders)} MCP servers"
        )

    async def get_all_tools(
        self,
        servers: Optional[List[McpServerName]] = None
    ) -> List[Any]:
        """Get all MCP tools from specified servers.
        
        This is the primary method for loading MCP tools into agents.
        Tools are loaded using Microsoft Agent Framework's built-in MCP support.
        
        If a remote MCP server doesn't respond or is unavailable, logs a warning
        and continues loading from other servers instead of failing.
        
        Args:
            servers: Optional list of server IDs to load tools from.
                    If None, loads from all configured servers.
        
        Returns:
            List of AIFunction instances from available MCP tools
        """
        all_tools = []
        successful_servers = []
        failed_servers = []
        
        # Determine which servers to load tools from
        servers_to_load = servers if servers else list(self.loaders.keys())
        
        logger.info(
            f"Loading tools from {len(servers_to_load)} MCP servers: "
            f"{', '.join(servers_to_load)}"
        )
        
        # Load tools from each server - continue on failure
        for server_id in servers_to_load:
            if server_id not in self.loaders:
                logger.warning(f"⚠ Unknown MCP server: {server_id}")
                failed_servers.append(server_id)
                continue
            
            try:
                loader = self.loaders[server_id]
                tools = await loader.get_tools()
                
                if tools:
                    all_tools.extend(tools)
                    successful_servers.append(server_id)
                    logger.info(
                        f"✓ Loaded {len(tools)} tools from MCP server '{server_id}'"
                    )
                else:
                    # Server responded but had no tools or failed gracefully
                    failed_servers.append(server_id)
                    logger.warning(
                        f"⚠ No tools loaded from MCP server '{server_id}'"
                    )
                
            except Exception as e:
                # Log warning and continue - don't let one server failure stop others
                failed_servers.append(server_id)
                logger.warning(
                    f"⚠ Failed to load tools from MCP server '{server_id}': {e}"
                )
                logger.warning(
                    f"⚠ Continuing with remaining servers..."
                )
        
        # Summary logging
        if successful_servers:
            logger.info(
                f"✓ Successfully loaded {len(all_tools)} total tools from "
                f"{len(successful_servers)} server(s): {', '.join(successful_servers)}"
            )
        
        if failed_servers:
            logger.warning(
                f"⚠ {len(failed_servers)} server(s) unavailable or failed: {', '.join(failed_servers)}"
            )
        
        if not all_tools:
            logger.warning(
                f"⚠ No tools loaded from any MCP server. Agents will run without MCP tools."
            )
        
        return all_tools

    async def close_all(self) -> None:
        """Close all MCP loaders and cleanup resources."""
        logger.info("Closing all MCP tool loaders...")
        
        for loader in self.loaders.values():
            try:
                await loader.close()
            except Exception as e:
                logger.error(f"Error closing loader: {e}")
        
        logger.info("All MCP tool loaders closed")

    async def list_tools(self) -> dict[str, Any]:
        """List all available tools from all MCP servers with metadata.
        
        Returns:
            Dictionary containing tools organized by server
        """
        result = {
            "servers": {},
            "total_tools": 0,
            "total_servers": len(self.loaders),
            "available_servers": 0,
        }
        
        for server_id, loader in self.loaders.items():
            try:
                tools = await loader.get_tools()
                
                if tools:
                    result["servers"][server_id] = {
                        "name": loader.server_name,
                        "url": loader.base_url,
                        "status": "available",
                        "tool_count": len(tools),
                        "tools": [
                            {
                                "name": tool.name,
                                "description": tool.description,
                            }
                            for tool in tools
                        ]
                    }
                    result["total_tools"] += len(tools)
                    result["available_servers"] += 1
                else:
                    result["servers"][server_id] = {
                        "name": loader.server_name,
                        "url": loader.base_url,
                        "status": "unavailable",
                        "tool_count": 0,
                        "tools": []
                    }
                    
            except Exception as e:
                result["servers"][server_id] = {
                    "name": loader.server_name,
                    "url": loader.base_url,
                    "status": "error",
                    "error": str(e),
                    "tool_count": 0,
                    "tools": []
                }
        
        return result


# Global tool registry instance
# Import and use this singleton throughout the application
tool_registry = ToolRegistry()
