"""MCP Tool Management using Microsoft Agent Framework.

This module is now deprecated. Use tool_registry.create_mcp_tool() instead.

The tool registry follows Microsoft Agent Framework best practices by creating
fresh MCPStreamableHTTPTool instances for each agent operation, managing their
lifecycle with async context managers.

Reference: https://learn.microsoft.com/en-us/agent-framework/user-guide/model-context-protocol/using-mcp-tools
"""

import logging

logger = logging.getLogger(__name__)

logger.warning(
    "mcp_tool_wrapper is deprecated. Use tool_registry.create_mcp_tool() instead."
)
