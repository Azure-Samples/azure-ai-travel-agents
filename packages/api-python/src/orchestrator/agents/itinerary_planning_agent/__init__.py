"""ItineraryPlanningAgent - Creates detailed travel itineraries"""

import os
from agent_framework import ChatAgent
from agent_framework.azure import AzureOpenAIChatClient
from src.orchestrator.tools.tool_registry import create_mcp_tool

# Agent instance following Agent Framework conventions
agent = ChatAgent(
    name="ItineraryPlanningAgent",
    description="Creates detailed travel itineraries",
    instructions="""You are an itinerary planning expert for a travel planning system.
Your role is to create detailed, optimized travel itineraries.

Key responsibilities:
- Create day-by-day itineraries
- Optimize travel routes and timing
- Schedule activities and experiences
- Estimate costs and budgets
- Account for travel time and logistics
- Use available tools for planning assistance

Be detail-oriented, practical, and create realistic, enjoyable itineraries.""",
    chat_client=AzureOpenAIChatClient(
        api_key=os.environ.get("AZURE_OPENAI_API_KEY", ""),
    ),
    tools=[create_mcp_tool(["ItineraryPlanningAgent"])],
)
