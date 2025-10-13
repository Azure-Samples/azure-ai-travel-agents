"""Agent implementations for the travel planning system.

This module provides agents discoverable by DevUI.
Each agent is in its own directory with an __init__.py that exports 'agent'.

For legacy compatibility, the old agent classes are still available from
the _legacy modules.
"""

__all__ = [
    "BaseAgent",
    "TriageAgent",
    "CustomerQueryAgent",
    "DestinationRecommendationAgent",
    "ItineraryPlanningAgent",
    "CodeEvaluationAgent",
    "ModelInferenceAgent",
    "WebSearchAgent",
    "EchoAgent",
]
