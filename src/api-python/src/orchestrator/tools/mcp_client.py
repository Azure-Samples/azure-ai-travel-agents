"""Base MCP client interface and implementations."""

import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

import httpx

logger = logging.getLogger(__name__)


class MCPClient(ABC):
    """Base MCP client interface."""

    @abstractmethod
    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        """Call a tool on the MCP server.

        Args:
            tool_name: Name of the tool to call
            arguments: Tool arguments

        Returns:
            Tool execution result
        """
        pass

    @abstractmethod
    async def list_tools(self) -> List[Dict[str, Any]]:
        """List available tools from the MCP server.

        Returns:
            List of available tools
        """
        pass

    @abstractmethod
    async def close(self) -> None:
        """Close the MCP client and cleanup resources."""
        pass


class HTTPMCPClient(MCPClient):
    """HTTP-based MCP client implementation."""

    def __init__(
        self,
        base_url: str,
        access_token: Optional[str] = None,
        timeout: float = 30.0,
    ):
        """Initialize HTTP MCP client.

        Args:
            base_url: Base URL of the MCP server
            access_token: Optional access token for authentication
            timeout: Request timeout in seconds
        """
        self.base_url = base_url.rstrip("/")
        self.access_token = access_token
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=timeout)
        logger.info(f"Initialized HTTP MCP client for {self.base_url}")

    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        """Call a tool via HTTP MCP protocol.

        Args:
            tool_name: Name of the tool to call
            arguments: Tool arguments

        Returns:
            Tool execution result

        Raises:
            httpx.HTTPError: If the HTTP request fails
        """
        headers = {}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"

        payload = {"name": tool_name, "arguments": arguments}

        logger.debug(f"Calling tool '{tool_name}' on {self.base_url}/call")

        try:
            response = await self.client.post(
                f"{self.base_url}/call",
                json=payload,
                headers=headers,
            )
            response.raise_for_status()
            result = response.json()
            logger.debug(f"Tool '{tool_name}' call successful")
            return result
        except httpx.HTTPError as e:
            logger.error(f"Tool '{tool_name}' call failed: {e}")
            raise

    async def list_tools(self) -> List[Dict[str, Any]]:
        """List available tools from the MCP server.

        Returns:
            List of available tools

        Raises:
            httpx.HTTPError: If the HTTP request fails
        """
        headers = {}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"

        logger.debug(f"Listing tools from {self.base_url}/tools")

        try:
            response = await self.client.get(
                f"{self.base_url}/tools",
                headers=headers,
            )
            response.raise_for_status()
            tools = response.json()
            logger.debug(f"Found {len(tools)} tools")
            return tools
        except httpx.HTTPError as e:
            logger.error(f"Failed to list tools: {e}")
            raise

    async def close(self) -> None:
        """Close the HTTP client."""
        await self.client.aclose()
        logger.debug(f"Closed HTTP MCP client for {self.base_url}")


# Note: SSE MCP Client can be added here if needed for specific tools
# For now, we'll focus on HTTP-based communication as it's more straightforward
# and compatible with the existing MCP servers
