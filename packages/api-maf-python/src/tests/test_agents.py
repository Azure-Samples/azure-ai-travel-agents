"""Tests for MAF agent implementations."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from src.orchestrator.agents import (
    BaseAgent,
    TriageAgent,
    CustomerQueryAgent,
    DestinationRecommendationAgent,
)


@pytest.mark.asyncio
async def test_base_agent_initialization():
    """Test base agent initialization."""
    agent = BaseAgent(name="TestAgent", description="Test agent", system_prompt="Test prompt")

    assert agent.name == "TestAgent"
    assert agent.description == "Test agent"
    assert agent.system_prompt == "Test prompt"
    assert agent.agent is None


@pytest.mark.asyncio
async def test_base_agent_initialize_with_llm():
    """Test base agent initialization with LLM client."""
    agent = BaseAgent(name="TestAgent", description="Test agent", system_prompt="Test prompt")

    mock_llm_client = MagicMock()

    with patch("src.orchestrator.agents.base_agent.Agent") as mock_agent_class:
        await agent.initialize(mock_llm_client)

        assert agent.agent is not None
        mock_agent_class.assert_called_once()


@pytest.mark.asyncio
async def test_base_agent_process_without_initialization():
    """Test that processing without initialization raises error."""
    agent = BaseAgent(name="TestAgent", description="Test agent", system_prompt="Test prompt")

    with pytest.raises(RuntimeError, match="not initialized"):
        await agent.process("test message")


@pytest.mark.asyncio
async def test_triage_agent_initialization():
    """Test triage agent initialization."""
    agent = TriageAgent()

    assert agent.name == "TriageAgent"
    assert "triage" in agent.description.lower()
    assert agent.system_prompt is not None


@pytest.mark.asyncio
async def test_customer_query_agent_initialization():
    """Test customer query agent initialization."""
    agent = CustomerQueryAgent()

    assert agent.name == "CustomerQueryAgent"
    assert "customer" in agent.description.lower()
    assert agent.system_prompt is not None


@pytest.mark.asyncio
async def test_destination_recommendation_agent_initialization():
    """Test destination recommendation agent initialization."""
    agent = DestinationRecommendationAgent()

    assert agent.name == "DestinationRecommendationAgent"
    assert "destination" in agent.description.lower()
    assert agent.system_prompt is not None


@pytest.mark.asyncio
async def test_destination_agent_with_tools():
    """Test destination agent with tools."""
    mock_tools = [MagicMock(), MagicMock()]
    agent = DestinationRecommendationAgent(tools=mock_tools)

    assert agent.tools == mock_tools
    assert len(agent.tools) == 2
