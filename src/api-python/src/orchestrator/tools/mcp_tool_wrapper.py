"""MCP Tool Wrapper for Microsoft Agent Framework integration."""

import json
import logging
from typing import Any, Callable

from agent_framework import Tool, ToolResult

from .mcp_client import HTTPMCPClient
from .tool_config import MCPServerConfig

logger = logging.getLogger(__name__)


class MCPToolWrapper:
    """
    Wrapper to convert MCP tools into MAF-compatible tools.
    
    This class bridges MCP server tools with Microsoft Agent Framework's
    Tool interface, following MAF best practices for tool calling.
    """

    def __init__(self, server_config: MCPServerConfig, server_name: str):
        """
        Initialize MCP tool wrapper.
        
        Args:
            server_config: MCP server configuration
            server_name: Name of the MCP server
        """
        self.server_config = server_config
        self.server_name = server_name
        self.client = HTTPMCPClient(
            name=f"mcp-{server_name}",
            url=server_config["url"]
        )
        logger.info(f"Initialized MCP tool wrapper for {server_name}")

    async def get_tools(self) -> list[Tool]:
        """
        Get MAF-compatible tools from MCP server.
        
        Returns:
            List of MAF Tool objects
        """
        try:
            # List tools from MCP server
            mcp_tools = await self.client.list_tools()
            
            logger.info(
                f"Retrieved {len(mcp_tools)} tools from {self.server_name}"
            )
            
            # Convert each MCP tool to MAF Tool
            maf_tools = []
            for mcp_tool in mcp_tools:
                maf_tool = self._create_maf_tool(mcp_tool)
                maf_tools.append(maf_tool)
            
            return maf_tools
            
        except Exception as e:
            logger.error(
                f"Error getting tools from {self.server_name}: {str(e)}"
            )
            return []

    def _create_maf_tool(self, mcp_tool: dict[str, Any]) -> Tool:
        """
        Create a MAF Tool from an MCP tool definition.
        
        Args:
            mcp_tool: MCP tool definition with name, description, inputSchema
            
        Returns:
            MAF Tool object
        """
        tool_name = mcp_tool.get("name", "unknown")
        tool_description = mcp_tool.get("description", "")
        input_schema = mcp_tool.get("inputSchema", {})
        
        # Create tool function that calls MCP server
        async def tool_function(**kwargs: Any) -> ToolResult:
            """
            Execute the MCP tool with given arguments.
            
            Following MAF best practices:
            - Async execution
            - Proper error handling
            - Structured ToolResult return
            """
            try:
                logger.info(
                    f"Calling MCP tool {tool_name} with args: {kwargs}"
                )
                
                # Call MCP server
                result = await self.client.call_tool(tool_name, kwargs)
                
                logger.info(f"MCP tool {tool_name} returned successfully")
                
                # Return MAF ToolResult
                return ToolResult(
                    content=json.dumps(result) if isinstance(result, dict) else str(result),
                    is_error=False
                )
                
            except Exception as e:
                logger.error(
                    f"Error calling MCP tool {tool_name}: {str(e)}"
                )
                return ToolResult(
                    content=f"Error: {str(e)}",
                    is_error=True
                )
        
        # Create MAF Tool
        # Following MAF SDK patterns for tool creation
        maf_tool = Tool(
            name=tool_name,
            description=tool_description,
            parameters=input_schema,
            function=tool_function
        )
        
        return maf_tool

    async def close(self) -> None:
        """Clean up MCP client resources."""
        await self.client.close()
        logger.info(f"Closed MCP client for {self.server_name}")
