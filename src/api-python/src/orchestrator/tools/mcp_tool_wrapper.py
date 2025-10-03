"""MCP Tool Wrapper for Microsoft Agent Framework integration."""

import json
import logging
from typing import Any, Dict
from pydantic import BaseModel, create_model

from agent_framework import AIFunction

from .mcp_client import HTTPMCPClient
from .tool_config import MCPServerConfig

logger = logging.getLogger(__name__)


class MCPToolWrapper:
    """
    Wrapper to convert MCP tools into MAF-compatible tools.
    
    This class bridges MCP server tools with Microsoft Agent Framework's
    AIFunction interface, following MAF best practices for tool calling.
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

    async def get_tools(self) -> list[AIFunction]:
        """
        Get MAF-compatible AI functions from MCP server.
        
        Returns:
            List of MAF AIFunction objects
        """
        try:
            # List tools from MCP server
            mcp_tools = await self.client.list_tools()
            
            logger.info(
                f"Retrieved {len(mcp_tools)} tools from {self.server_name}"
            )
            
            # Convert each MCP tool to MAF AIFunction
            maf_tools = []
            for mcp_tool in mcp_tools:
                maf_tool = self._create_maf_function(mcp_tool)
                maf_tools.append(maf_tool)
            
            return maf_tools
            
        except Exception as e:
            logger.error(
                f"Error getting tools from {self.server_name}: {str(e)}"
            )
            return []

    def _create_maf_function(self, mcp_tool: dict[str, Any]) -> AIFunction:
        """
        Create a MAF AIFunction from an MCP tool definition.
        
        Args:
            mcp_tool: MCP tool definition with name, description, inputSchema
            
        Returns:
            MAF AIFunction object
        """
        tool_name = mcp_tool.get("name", "unknown")
        tool_description = mcp_tool.get("description", "")
        input_schema = mcp_tool.get("inputSchema", {})
        
        # Create a dynamic Pydantic model for the input parameters
        # Using a simple Dict[str, Any] model for flexibility with MCP tools
        InputModel = create_model(
            f"{tool_name}_Input",
            __base__=BaseModel,
            **{prop: (Any, ...) for prop in input_schema.get("properties", {}).keys()}
        )
        
        # Create tool function that calls MCP server
        async def tool_function(**kwargs: Any) -> str:
            """
            Execute the MCP tool with given arguments.
            
            Following MAF best practices:
            - Async execution
            - Proper error handling
            - String return value
            """
            try:
                logger.info(
                    f"Calling MCP tool {tool_name} with args: {kwargs}"
                )
                
                # Call MCP server
                result = await self.client.call_tool(tool_name, kwargs)
                
                logger.info(f"MCP tool {tool_name} returned successfully")
                
                # Return result as string (MAF handles this)
                return json.dumps(result) if isinstance(result, dict) else str(result)
                
            except Exception as e:
                logger.error(
                    f"Error calling MCP tool {tool_name}: {str(e)}"
                )
                return f"Error calling {tool_name}: {str(e)}"
        
        # Create MAF AIFunction
        # Following MAF SDK patterns for tool creation
        maf_function = AIFunction(
            name=tool_name,
            description=tool_description or f"MCP tool: {tool_name}",
            func=tool_function,
            input_model=InputModel
        )
        
        return maf_function

    async def close(self) -> None:
        """Clean up MCP client resources."""
        await self.client.close()
        logger.info(f"Closed MCP client for {self.server_name}")
