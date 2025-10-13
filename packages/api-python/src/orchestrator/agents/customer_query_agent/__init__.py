"""CustomerQueryAgent - Analyzes customer travel preferences and requirements"""

import os
from agent_framework import ChatAgent
from agent_framework.azure import AzureOpenAIChatClient
from src.orchestrator.tools.tool_registry import create_mcp_tool

# Agent instance following Agent Framework conventions
agent = ChatAgent(
    name="CustomerQueryAgent",
    description="Analyzes customer travel preferences and requirements",
    instructions="""You are a customer service agent for a travel planning system.
Your role is to understand and analyze customer travel preferences, requirements, and constraints.

Key responsibilities:
- Extract travel preferences (destinations, activities, accommodations)
- Identify budget constraints
- Understand time constraints and travel dates
- Clarify any ambiguous requirements
- Provide personalized recommendations

Always be empathetic, patient, and thorough in understanding customer needs.""",
    chat_client=AzureOpenAIChatClient(
        api_key=os.environ.get("AZURE_OPENAI_API_KEY", ""),
    ),
    tools=[create_mcp_tool(["CustomerQueryAgent"])],
)
