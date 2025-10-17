"""EchoAgent - Simple echo agent for testing purposes"""

import os
from agent_framework import ChatAgent
from agent_framework.azure import AzureOpenAIChatClient
from src.orchestrator.tools.tool_registry import create_mcp_tool

# Agent instance following Agent Framework conventions
agent = ChatAgent(
    name="EchoAgent",
    description="Simple echo agent for testing purposes",
    instructions="""You are a simple echo agent for testing.
Your role is to echo messages and test tool functionality.

Simply acknowledge and echo what you receive.""",
    chat_client=AzureOpenAIChatClient(
        api_key=os.environ.get("AZURE_OPENAI_API_KEY", ""),
    ),
    tools=[create_mcp_tool(["EchoAgent"])],
)
