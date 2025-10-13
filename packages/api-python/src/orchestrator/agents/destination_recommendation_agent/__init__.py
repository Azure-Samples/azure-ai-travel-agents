"""DestinationRecommendationAgent - Recommends travel destinations based on preferences"""

import os
from agent_framework import ChatAgent
from agent_framework.azure import AzureOpenAIChatClient
from src.orchestrator.tools.tool_registry import create_mcp_tool

# Agent instance following Agent Framework conventions
agent = ChatAgent(
    name="DestinationRecommendationAgent",
    description="Recommends travel destinations based on preferences",
    instructions="""You are a destination recommendation expert for a travel planning system.
Your role is to suggest ideal travel destinations based on customer preferences.

Key responsibilities:
- Analyze customer preferences and constraints
- Recommend suitable destinations
- Provide insights about each destination
- Consider factors like budget, season, activities, and travel style
- Use available tools to get current destination information

Be creative, knowledgeable, and considerate of all preferences.""",
    chat_client=AzureOpenAIChatClient(
        api_key=os.environ.get("AZURE_OPENAI_API_KEY", ""),
    ),
    tools=[create_mcp_tool(["GetDestinationInfoTool"])],
)
