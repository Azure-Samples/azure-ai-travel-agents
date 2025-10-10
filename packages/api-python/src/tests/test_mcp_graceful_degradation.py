"""Test graceful degradation when MCP servers are unavailable."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import logging


@pytest.mark.asyncio
async def test_mcp_server_unavailable_graceful_degradation():
    """Test that unavailable MCP servers are handled gracefully with warnings."""
    from orchestrator.tools.mcp_tool_wrapper import MCPToolLoader
    
    config = {
        "url": "http://unavailable-server:9999/mcp",
        "type": "http"
    }
    
    loader = MCPToolLoader(config, "Unavailable Server")
    
    # Mock connection failure
    with patch('orchestrator.tools.mcp_tool_wrapper.MCPStreamableHTTPTool') as mock_tool_class:
        mock_context = AsyncMock()
        mock_context.__aenter__.side_effect = ConnectionError("Server not responding")
        mock_tool_class.return_value = mock_context
        
        # Should return empty list, not raise exception
        tools = await loader.get_tools()
        
        assert tools == []
        # No exception should be raised


@pytest.mark.asyncio
async def test_tool_registry_continues_with_failed_servers(caplog):
    """Test that tool registry continues loading from available servers when some fail."""
    from orchestrator.tools.tool_registry import ToolRegistry
    
    registry = ToolRegistry()
    
    # Mock loaders: one succeeds, one fails
    with patch.object(registry, 'loaders') as mock_loaders:
        # Successful loader
        success_loader = AsyncMock()
        success_tool = MagicMock(name="working_tool")
        success_loader.get_tools.return_value = [success_tool]
        
        # Failed loader
        failed_loader = AsyncMock()
        failed_loader.get_tools.return_value = []  # Returns empty on failure
        
        mock_loaders.items.return_value = [
            ("working-server", success_loader),
            ("failed-server", failed_loader)
        ]
        mock_loaders.keys.return_value = ["working-server", "failed-server"]
        mock_loaders.__contains__ = lambda self, key: key in ["working-server", "failed-server"]
        
        # Get tools from all servers
        with caplog.at_level(logging.WARNING):
            tools = await registry.get_all_tools()
        
        # Should have tools from successful server
        assert len(tools) == 1
        assert tools[0] == success_tool
        
        # Should log warning about failed server
        warning_logs = [record for record in caplog.records if record.levelname == "WARNING"]
        assert any("failed-server" in record.message for record in warning_logs)


@pytest.mark.asyncio
async def test_all_servers_unavailable_no_exception(caplog):
    """Test that when all MCP servers are unavailable, system continues without tools."""
    from orchestrator.tools.tool_registry import ToolRegistry
    
    registry = ToolRegistry()
    
    # Mock all loaders to fail
    with patch.object(registry, 'loaders') as mock_loaders:
        failed_loader1 = AsyncMock()
        failed_loader1.get_tools.return_value = []
        
        failed_loader2 = AsyncMock()
        failed_loader2.get_tools.return_value = []
        
        mock_loaders.items.return_value = [
            ("server1", failed_loader1),
            ("server2", failed_loader2)
        ]
        mock_loaders.keys.return_value = ["server1", "server2"]
        mock_loaders.__contains__ = lambda self, key: key in ["server1", "server2"]
        
        # Should return empty list, not raise exception
        with caplog.at_level(logging.WARNING):
            tools = await registry.get_all_tools()
        
        assert tools == []
        
        # Should log warning about no tools
        warning_logs = [record for record in caplog.records if record.levelname == "WARNING"]
        assert any("No tools loaded" in record.message for record in warning_logs)


@pytest.mark.asyncio
async def test_partial_server_failure_continues(caplog):
    """Test that partial server failures don't stop the workflow."""
    from orchestrator.tools.tool_registry import ToolRegistry
    
    registry = ToolRegistry()
    
    with patch.object(registry, 'loaders') as mock_loaders:
        # Create 3 loaders: 2 succeed, 1 fails
        loader1 = AsyncMock()
        tool1 = MagicMock(name="tool1")
        loader1.get_tools.return_value = [tool1]
        
        loader2 = AsyncMock()
        loader2.get_tools.return_value = []  # Failed
        
        loader3 = AsyncMock()
        tool3 = MagicMock(name="tool3")
        loader3.get_tools.return_value = [tool3]
        
        mock_loaders.items.return_value = [
            ("server1", loader1),
            ("server2", loader2),
            ("server3", loader3)
        ]
        mock_loaders.keys.return_value = ["server1", "server2", "server3"]
        mock_loaders.__contains__ = lambda self, key: key in ["server1", "server2", "server3"]
        
        with caplog.at_level(logging.INFO):
            tools = await registry.get_all_tools()
        
        # Should have tools from successful servers
        assert len(tools) == 2
        
        # Should log success for working servers
        info_logs = [record for record in caplog.records if record.levelname == "INFO"]
        assert any("server1" in record.message for record in info_logs)
        assert any("server3" in record.message for record in info_logs)


@pytest.mark.asyncio
async def test_workflow_initialization_with_no_tools():
    """Test that workflow can initialize even when no MCP tools are available."""
    from orchestrator.workflow import TravelWorkflowOrchestrator
    from orchestrator.tools.tool_registry import tool_registry
    
    orchestrator = TravelWorkflowOrchestrator()
    
    # Mock tool registry to return empty list
    with patch.object(tool_registry, 'get_all_tools', new_callable=AsyncMock) as mock_get_tools:
        mock_get_tools.return_value = []
        
        # Mock LLM client
        with patch('orchestrator.workflow.get_llm_client', new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = MagicMock()
            
            # Should initialize without error
            await orchestrator.initialize()
            
            # Should have empty tools list
            assert orchestrator.all_tools == []
            
            # Agents should still be initialized (with no tools)
            assert orchestrator.triage_agent is not None
            assert orchestrator.customer_query_agent is not None


@pytest.mark.asyncio
async def test_connection_timeout_handled_gracefully(caplog):
    """Test that connection timeouts are handled gracefully."""
    from orchestrator.tools.mcp_tool_wrapper import MCPToolLoader
    
    config = {
        "url": "http://slow-server:8000/mcp",
        "type": "http"
    }
    
    loader = MCPToolLoader(config, "Slow Server")
    
    # Mock timeout error
    with patch('orchestrator.tools.mcp_tool_wrapper.MCPStreamableHTTPTool') as mock_tool_class:
        mock_context = AsyncMock()
        mock_context.__aenter__.side_effect = TimeoutError("Connection timeout")
        mock_tool_class.return_value = mock_context
        
        with caplog.at_level(logging.WARNING):
            tools = await loader.get_tools()
        
        assert tools == []
        
        # Should log warning, not error
        warning_logs = [record for record in caplog.records if record.levelname == "WARNING"]
        assert any("unavailable or not responding" in record.message for record in warning_logs)
        
        # Should not have any ERROR logs
        error_logs = [record for record in caplog.records if record.levelname == "ERROR"]
        assert len(error_logs) == 0
