"""Example usage of MCP tools with Microsoft Agent Framework.

This module demonstrates how to use MCP tools following Microsoft Agent Framework
SDK best practices.

Reference: https://learn.microsoft.com/en-us/agent-framework/user-guide/model-context-protocol/using-mcp-tools
"""

import asyncio
import logging
from typing import List

from agent_framework import ChatAgent, AIFunction

from orchestrator.tools.tool_registry import tool_registry
from orchestrator.tools.mcp_tool_wrapper import MCPToolLoader
from orchestrator.tools.tool_config import MCPServerConfig

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def example_1_basic_usage():
    """Example 1: Basic MCP tools usage with ChatAgent.

    Demonstrates:
    - Loading all MCP tools
    - Creating a ChatAgent with MCP tools
    - Processing user queries
    """
    logger.info("=== Example 1: Basic MCP Tools Usage ===")

    # Load all available MCP tools
    mcp_tools = await tool_registry.get_all_tools()
    logger.info(f"Loaded {len(mcp_tools)} MCP tools")

    # Create a ChatAgent with MCP tools
    # Note: Requires an actual LLM client (Azure OpenAI, GitHub Models, etc.)
    # For this example, we'll just show the tool loading

    logger.info("MCP tools ready for use with ChatAgent")
    for tool in mcp_tools[:5]:  # Show first 5 tools
        logger.info(f"  - {tool.name}: {tool.description}")


async def example_2_specific_servers():
    """Example 2: Load tools from specific MCP servers.

    Demonstrates:
    - Selective tool loading
    - Server filtering
    """
    logger.info("=== Example 2: Load Specific MCP Servers ===")

    # Load tools from specific servers only
    travel_tools = await tool_registry.get_all_tools(servers=["itinerary-planning", "destination-recommendation"])

    logger.info(f"Loaded {len(travel_tools)} travel-related tools")
    for tool in travel_tools:
        logger.info(f"  - {tool.name}")


async def example_3_tool_discovery():
    """Example 3: Discover and inspect MCP tools.

    Demonstrates:
    - Tool discovery
    - Schema inspection
    - Server capabilities
    """
    logger.info("=== Example 3: Tool Discovery ===")

    # List all tools from all servers
    all_tools = await tool_registry.list_tools()

    for server_name, tools in all_tools.items():
        if isinstance(tools, dict) and "error" in tools:
            logger.error(f"Server '{server_name}' error: {tools['error']}")
            continue

        logger.info(f"\nServer: {server_name}")
        logger.info(f"  Tools: {len(tools)}")

        for tool in tools[:2]:  # Show first 2 tools per server
            logger.info(f"    - {tool.get('name', 'unknown')}")
            logger.info(f"      Description: {tool.get('description', 'N/A')}")

            # Show input schema
            input_schema = tool.get("inputSchema", {})
            properties = input_schema.get("properties", {})
            if properties:
                logger.info(f"      Parameters: {list(properties.keys())}")


async def example_4_direct_tool_call():
    """Example 4: Direct MCP tool invocation.

    Demonstrates:
    - Bypassing MAF wrapper for direct calls
    - Low-level MCP protocol usage
    """
    logger.info("=== Example 4: Direct Tool Call ===")

    try:
        # Call MCP tool directly (without going through agent)
        result = await tool_registry.call_tool(
            server="echo-ping", tool_name="ping", arguments={"message": "Hello from MCP!"}
        )

        logger.info(f"Direct call result: {result}")

    except Exception as e:
        logger.error(f"Direct call failed: {e}")


async def example_5_custom_wrapper():
    """Example 5: Create custom MCP tool wrapper.

    Demonstrates:
    - Custom server configuration
    - Manual wrapper creation
    - Tool conversion
    """
    logger.info("=== Example 5: Custom MCP Wrapper ===")

    # Create custom MCP server config
    custom_config: MCPServerConfig = {"url": "http://localhost:8001/mcp", "type": "http", "verbose": True}

    # Create loader for custom server
    loader = MCPToolLoader(server_config=custom_config, server_name="Custom MCP Server")

    try:
        # Get tools from custom server
        tools = await loader.get_tools()
        logger.info(f"Custom server has {len(tools)} tools")

        for tool in tools:
            logger.info(f"  - {tool.name}: {tool.description}")

    except Exception as e:
        logger.error(f"Failed to load custom server tools: {e}")

    finally:
        # Cleanup
        await loader.close()


async def example_6_agent_with_tools():
    """Example 6: Complete agent setup with MCP tools.

    Demonstrates:
    - Full agent initialization
    - MCP tools integration
    - Agent execution flow

    Note: This requires a valid LLM client configuration.
    """
    logger.info("=== Example 6: Agent with MCP Tools ===")

    # Load MCP tools
    mcp_tools = await tool_registry.get_all_tools(servers=["itinerary-planning", "customer-query", "echo-ping"])

    logger.info(f"Loaded {len(mcp_tools)} tools for agent")

    # The agent would be initialized like this:
    # from orchestrator.agents.base_agent import BaseAgent
    # from orchestrator.providers.azure_openai import get_azure_openai_client
    #
    # llm_client = await get_azure_openai_client()
    #
    # agent = BaseAgent(
    #     name="travel_assistant",
    #     description="AI-powered travel planning assistant",
    #     system_prompt="You are a helpful travel planning assistant. "
    #                   "Use available tools to help users plan their trips.",
    #     tools=mcp_tools
    # )
    #
    # await agent.initialize(llm_client)
    #
    # # Process user request
    # response = await agent.process(
    #     "I need a 3-day itinerary for Paris with hotel recommendations"
    # )
    #
    # logger.info(f"Agent response: {response}")

    logger.info("Agent setup complete (LLM client required for execution)")


async def example_7_error_handling():
    """Example 7: Error handling with MCP tools.

    Demonstrates:
    - Graceful error handling
    - Server unavailability
    - Tool call failures
    """
    logger.info("=== Example 7: Error Handling ===")

    # Try to load tools - some servers might be unavailable
    mcp_tools = await tool_registry.get_all_tools()

    # Tools with errors will be skipped, successful ones loaded
    logger.info(f"Successfully loaded {len(mcp_tools)} tools")

    # Try direct call to potentially unavailable server
    try:
        result = await tool_registry.call_tool(server="nonexistent-server", tool_name="test", arguments={})
    except ValueError as e:
        logger.info(f"Expected error for unknown server: {e}")

    # MCP tool wrappers return errors as strings instead of raising
    # This allows agents to handle errors gracefully


async def main():
    """Run all examples."""
    examples = [
        example_1_basic_usage,
        example_2_specific_servers,
        example_3_tool_discovery,
        example_4_direct_tool_call,
        example_5_custom_wrapper,
        example_6_agent_with_tools,
        example_7_error_handling,
    ]

    for example in examples:
        try:
            await example()
            print()  # Blank line between examples
        except Exception as e:
            logger.error(f"Example failed: {e}", exc_info=True)

    # Cleanup
    logger.info("=== Cleanup ===")
    await tool_registry.close_all()
    logger.info("All MCP clients closed")


if __name__ == "__main__":
    asyncio.run(main())
