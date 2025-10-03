"""Specialized travel planning agents."""

from typing import List, Optional

from ..tools.tool_registry import tool_registry
from .base_agent import BaseAgent


class CustomerQueryAgent(BaseAgent):
    """Agent for analyzing customer preferences and requirements."""

    def __init__(self):
        """Initialize the Customer Query Agent."""
        super().__init__(
            name="CustomerQueryAgent",
            description="Analyzes customer travel preferences and requirements",
            system_prompt="""You are a customer service agent for a travel planning system.
Your role is to understand and analyze customer travel preferences, requirements, and constraints.

Key responsibilities:
- Extract travel preferences (destinations, activities, accommodations)
- Identify budget constraints
- Understand time constraints and travel dates
- Clarify any ambiguous requirements
- Provide personalized recommendations

Always be empathetic, patient, and thorough in understanding customer needs.""",
        )


class DestinationRecommendationAgent(BaseAgent):
    """Agent for recommending travel destinations."""

    def __init__(self, tools: Optional[List] = None):
        """Initialize the Destination Recommendation Agent.
        
        Args:
            tools: Optional list of destination recommendation tools
        """
        super().__init__(
            name="DestinationRecommendationAgent",
            description="Recommends travel destinations based on preferences",
            system_prompt="""You are a destination recommendation expert for a travel planning system.
Your role is to suggest ideal travel destinations based on customer preferences.

Key responsibilities:
- Analyze customer preferences and constraints
- Recommend suitable destinations
- Provide insights about each destination
- Consider factors like budget, season, activities, and travel style
- Use available tools to get current destination information

Be creative, knowledgeable, and considerate of all preferences.""",
            tools=tools,
        )


class ItineraryPlanningAgent(BaseAgent):
    """Agent for creating detailed travel itineraries."""

    def __init__(self, tools: Optional[List] = None):
        """Initialize the Itinerary Planning Agent.
        
        Args:
            tools: Optional list of itinerary planning tools
        """
        super().__init__(
            name="ItineraryPlanningAgent",
            description="Creates detailed travel itineraries",
            system_prompt="""You are an itinerary planning expert for a travel planning system.
Your role is to create detailed, optimized travel itineraries.

Key responsibilities:
- Create day-by-day itineraries
- Optimize travel routes and timing
- Schedule activities and experiences
- Estimate costs and budgets
- Account for travel time and logistics
- Use available tools for planning assistance

Be detail-oriented, practical, and create realistic, enjoyable itineraries.""",
            tools=tools,
        )


class CodeEvaluationAgent(BaseAgent):
    """Agent for evaluating code and performing calculations."""

    def __init__(self, tools: Optional[List] = None):
        """Initialize the Code Evaluation Agent.
        
        Args:
            tools: Optional list of code evaluation tools
        """
        super().__init__(
            name="CodeEvaluationAgent",
            description="Evaluates code snippets and performs calculations",
            system_prompt="""You are a code evaluation agent for a travel planning system.
Your role is to execute code snippets and perform calculations.

Key responsibilities:
- Execute Python code safely
- Perform travel-related calculations (distances, costs, times)
- Process data and generate insights
- Use available calculation tools

Be precise, safe, and helpful in all code evaluations.""",
            tools=tools,
        )


class ModelInferenceAgent(BaseAgent):
    """Agent for specialized AI model inference."""

    def __init__(self, tools: Optional[List] = None):
        """Initialize the Model Inference Agent.
        
        Args:
            tools: Optional list of model inference tools
        """
        super().__init__(
            name="ModelInferenceAgent",
            description="Performs specialized AI model inference",
            system_prompt="""You are a model inference agent for a travel planning system.
Your role is to perform specialized AI model inference tasks.

Key responsibilities:
- Run specialized AI models
- Process complex data with ML models
- Provide AI-powered insights
- Use available inference tools

Be accurate and efficient in all inference tasks.""",
            tools=tools,
        )


class WebSearchAgent(BaseAgent):
    """Agent for searching current travel information."""

    def __init__(self, tools: Optional[List] = None):
        """Initialize the Web Search Agent.
        
        Args:
            tools: Optional list of web search tools
        """
        super().__init__(
            name="WebSearchAgent",
            description="Searches for current travel information and news",
            system_prompt="""You are a web search agent for a travel planning system.
Your role is to find current travel information, news, and updates.

Key responsibilities:
- Search for current travel conditions
- Find recent travel news and alerts
- Locate up-to-date information about destinations
- Use web search tools effectively

Provide timely, accurate, and relevant information.""",
            tools=tools,
        )


class EchoAgent(BaseAgent):
    """Simple echo agent for testing."""

    def __init__(self, tools: Optional[List] = None):
        """Initialize the Echo Agent.
        
        Args:
            tools: Optional list of echo tools
        """
        super().__init__(
            name="EchoAgent",
            description="Simple echo agent for testing purposes",
            system_prompt="""You are a simple echo agent for testing.
Your role is to echo messages and test tool functionality.

Simply acknowledge and echo what you receive.""",
            tools=tools,
        )
