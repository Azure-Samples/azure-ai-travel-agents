"""Tool registry for managing MCP server connections."""

import logging
from typing import Any, Dict, Optional

from .mcp_client import HTTPMCPClient
from ...config import settings

logger = logging.getLogger(__name__)


class ToolRegistry:
    """Registry for managing MCP tool server connections."""

    def __init__(self) -> None:
        """Initialize the tool registry."""
        self.clients: Dict[str, HTTPMCPClient] = {}
        self._initialize_clients()
        logger.info("Tool registry initialized")

    def _initialize_clients(self) -> None:
        """Initialize MCP clients for all configured servers."""
        # Customer Query
        self.clients["customer-query"] = HTTPMCPClient(
            base_url=settings.mcp_customer_query_url
        )

        # Destination Recommendation
        self.clients["destination-recommendation"] = HTTPMCPClient(
            base_url=settings.mcp_destination_recommendation_url
        )

        # Itinerary Planning
        self.clients["itinerary-planning"] = HTTPMCPClient(
            base_url=settings.mcp_itinerary_planning_url
        )

        # Code Evaluation
        self.clients["code-evaluation"] = HTTPMCPClient(
            base_url=settings.mcp_code_evaluation_url
        )

        # Model Inference
        self.clients["model-inference"] = HTTPMCPClient(
            base_url=settings.mcp_model_inference_url
        )

        # Web Search
        self.clients["web-search"] = HTTPMCPClient(
            base_url=settings.mcp_web_search_url
        )

        # Echo Ping
        self.clients["echo-ping"] = HTTPMCPClient(
            base_url=settings.mcp_echo_ping_url,
            access_token=settings.mcp_echo_ping_access_token,
        )

        logger.info(f"Initialized {len(self.clients)} MCP clients")

    async def call_tool(
        self,
        server: str,
        tool_name: str,
        arguments: Dict[str, Any],
    ) -> Any:
        """Call a tool on a specific MCP server.

        Args:
            server: Server identifier (e.g., 'customer-query')
            tool_name: Name of the tool to call
            arguments: Tool arguments

        Returns:
            Tool execution result

        Raises:
            ValueError: If the server is not registered
        """
        if server not in self.clients:
            raise ValueError(f"Unknown MCP server: {server}")

        logger.debug(f"Calling tool '{tool_name}' on server '{server}'")
        return await self.clients[server].call_tool(tool_name, arguments)

    async def list_tools(self, server: Optional[str] = None) -> Dict[str, Any]:
        """List tools from one or all MCP servers.

        Args:
            server: Optional server identifier. If None, lists tools from all servers.

        Returns:
            Dictionary mapping server names to their available tools
        """
        if server:
            if server not in self.clients:
                raise ValueError(f"Unknown MCP server: {server}")
            return {server: await self.clients[server].list_tools()}

        # List tools from all servers
        all_tools = {}
        for server_name, client in self.clients.items():
            try:
                tools = await client.list_tools()
                all_tools[server_name] = tools
            except Exception as e:
                logger.error(f"Failed to list tools from {server_name}: {e}")
                all_tools[server_name] = {"error": str(e)}

        return all_tools

    async def close_all(self) -> None:
        """Close all MCP clients and cleanup resources."""
        logger.info("Closing all MCP clients")
        for client in self.clients.values():
            await client.close()
        logger.info("All MCP clients closed")


# Global tool registry instance
tool_registry = ToolRegistry()
