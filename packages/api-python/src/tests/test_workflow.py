"""Tests for MAF workflow orchestrator."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from src.orchestrator.workflow import TravelWorkflowOrchestrator


@pytest.mark.asyncio
async def test_workflow_orchestrator_initialization():
    """Test workflow orchestrator initialization."""
    orchestrator = TravelWorkflowOrchestrator()
    
    assert orchestrator.triage_agent is not None
    assert orchestrator.customer_query_agent is not None
    assert orchestrator.destination_agent is not None
    assert orchestrator.itinerary_agent is not None
    assert len(orchestrator.agents) == 8


@pytest.mark.asyncio
async def test_workflow_orchestrator_initialize():
    """Test workflow orchestrator full initialization."""
    orchestrator = TravelWorkflowOrchestrator()
    
    mock_llm_client = MagicMock()
    
    with patch("src.orchestrator.workflow.get_llm_client", return_value=mock_llm_client):
        with patch.object(orchestrator.triage_agent, "initialize", new_callable=AsyncMock):
            with patch("src.orchestrator.workflow.Workflow") as mock_workflow_class:
                await orchestrator.initialize()
                
                assert orchestrator.llm_client is not None
                assert orchestrator.workflow is not None
                mock_workflow_class.assert_called_once()


@pytest.mark.asyncio
async def test_workflow_process_request_without_initialization():
    """Test that processing without initialization raises error."""
    orchestrator = TravelWorkflowOrchestrator()
    
    with pytest.raises(RuntimeError, match="not initialized"):
        await orchestrator.process_request("test message")


@pytest.mark.asyncio
async def test_workflow_get_agent_by_name():
    """Test getting agent by name."""
    orchestrator = TravelWorkflowOrchestrator()
    
    agent = await orchestrator.get_agent_by_name("TriageAgent")
    assert agent is not None
    assert agent.name == "TriageAgent"
    
    agent = await orchestrator.get_agent_by_name("NonExistentAgent")
    assert agent is None


@pytest.mark.asyncio
async def test_workflow_handoff_to_agent():
    """Test handoff to specific agent."""
    orchestrator = TravelWorkflowOrchestrator()
    
    mock_llm_client = MagicMock()
    
    with patch("src.orchestrator.workflow.get_llm_client", return_value=mock_llm_client):
        with patch.object(orchestrator.triage_agent, "initialize", new_callable=AsyncMock):
            with patch.object(orchestrator.triage_agent, "process", new_callable=AsyncMock) as mock_process:
                mock_process.return_value = "Test response"
                
                # Initialize agents first
                for agent in orchestrator.agents:
                    with patch.object(agent, "initialize", new_callable=AsyncMock):
                        await agent.initialize(mock_llm_client)
                
                response = await orchestrator.handoff_to_agent(
                    "TriageAgent",
                    "test message"
                )
                
                assert response == "Test response"
                mock_process.assert_called_once()


@pytest.mark.asyncio
async def test_workflow_handoff_to_nonexistent_agent():
    """Test handoff to nonexistent agent raises error."""
    orchestrator = TravelWorkflowOrchestrator()
    
    with pytest.raises(ValueError, match="not found"):
        await orchestrator.handoff_to_agent(
            "NonExistentAgent",
            "test message"
        )
