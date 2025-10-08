"""Triage Agent - Routes requests to appropriate specialized agents."""

from typing import Any, Optional, List
from .base_agent import BaseAgent


class TriageAgent(BaseAgent):
    """Triage agent that analyzes requests and routes to specialized agents.
    
    This is the entry point agent that determines which specialized agent(s)
    should handle the user's request.
    """

    def __init__(self, tools: Optional[List[Any]] = None):
        """Initialize the Triage Agent."""
        super().__init__(
            tools=tools,
            name="TriageAgent",
            description="Analyzes travel requests and routes to appropriate specialized agents",
            system_prompt="""You are a triage agent for a travel planning system.
Your role is to analyze user requests and determine which specialized agents should handle them.

Available specialized agents:
- CustomerQueryAgent: Analyzes customer preferences and requirements
- DestinationRecommendationAgent: Suggests travel destinations
- ItineraryPlanningAgent: Creates detailed travel itineraries
- CodeEvaluationAgent: Evaluates code snippets and calculations
- ModelInferenceAgent: Performs specialized AI model inference
- WebSearchAgent: Searches for current travel information
- EchoAgent: Simple echo tool for testing

Your task:
1. Understand the user's request
2. Determine which agent(s) can best fulfill it
3. Coordinate the workflow between agents if multiple are needed
4. Provide clear, helpful responses

Always be friendly, professional, and focused on helping users plan amazing trips.""",
        )
