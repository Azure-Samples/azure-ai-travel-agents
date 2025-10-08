"""Test MCP tool integration using Microsoft Agent Framework SDK."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch, PropertyMock


@pytest.mark.asyncio
async def test_mcp_tool_loader_initialization():
    """Test MCPToolLoader initialization with Microsoft Agent Framework SDK."""
    from orchestrator.tools.mcp_tool_wrapper import MCPToolLoader
    
    config = {
        "url": "http://localhost:8001/mcp",
        "type": "http",
        "verbose": True
    }
    
    loader = MCPToolLoader(config, "Test Server")
    
    assert loader.server_name == "Test Server"
    assert loader.base_url == "http://localhost:8001/mcp"
    assert loader._tools == []
    
    await loader.close()


@pytest.mark.asyncio
async def test_tool_registry_initialization():
    """Test ToolRegistry initialization."""
    from orchestrator.tools.tool_registry import ToolRegistry
    
    # Create a new registry instance
    registry = ToolRegistry()
    
    # Should have loaders for configured servers
    assert len(registry.loaders) > 0
    
    await registry.close_all()


@pytest.mark.asyncio  
async def test_get_tools_with_maf_sdk():
    """Test loading tools using Microsoft Agent Framework's MCPStreamableHTTPTool."""
    from orchestrator.tools.mcp_tool_wrapper import MCPToolLoader
    from agent_framework import MCPStreamableHTTPTool
    
    config = {
        "url": "http://localhost:8001/mcp",
        "type": "http",
        "verbose": True
    }
    
    loader = MCPToolLoader(config, "Test Server")
    
    # Mock the MCPStreamableHTTPTool context manager
    mock_tool = MagicMock()
    mock_tool.functions = [MagicMock(name="test_tool")]
    
    with patch('orchestrator.tools.mcp_tool_wrapper.MCPStreamableHTTPTool') as mock_tool_class:
        # Make the mock return an async context manager
        mock_context = AsyncMock()
        mock_context.__aenter__.return_value = mock_tool
        mock_context.__aexit__.return_value = None
        mock_tool_class.return_value = mock_context
        
        tools = await loader.get_tools()
        
        # Should have called MCPStreamableHTTPTool with correct parameters
        mock_tool_class.assert_called_once()
        call_kwargs = mock_tool_class.call_args[1]
        assert call_kwargs['name'] == "Test Server"
        assert call_kwargs['url'] == "http://localhost:8001/mcp"
        assert call_kwargs['load_tools'] == True
        
        # Should return the tools
        assert len(tools) == 1
        assert tools[0].name == "test_tool"
    
    await loader.close()


@pytest.mark.asyncio
async def test_tool_registry_get_all_tools():
    """Test getting all tools from registry."""
    from orchestrator.tools.tool_registry import tool_registry
    
    # Mock the tool loading
    with patch.object(tool_registry, 'loaders') as mock_loaders:
        # Create a mock loader
        mock_loader = AsyncMock()
        mock_tool = MagicMock()
        mock_tool.name = "test_tool"
        mock_loader.get_tools.return_value = [mock_tool]
        
        mock_loaders.items.return_value = [("test-server", mock_loader)]
        mock_loaders.keys.return_value = ["test-server"]
        mock_loaders.__contains__ = lambda self, key: key == "test-server"
        
        # Get tools
        tools = await tool_registry.get_all_tools()
        
        # Should have called the loader
        mock_loader.get_tools.assert_called_once()
        
        # Should return the tools
        assert len(tools) == 1
        assert tools[0] == mock_tool


@pytest.mark.asyncio
async def test_maf_sdk_import():
    """Test that Microsoft Agent Framework SDK imports work correctly."""
    try:
        from agent_framework import MCPStreamableHTTPTool
        assert MCPStreamableHTTPTool is not None
    except ImportError as e:
        # Expected if SDK not installed
        assert "agent-framework" in str(e).lower()


@pytest.mark.asyncio
async def test_mcp_tool_with_auth_header():
    """Test MCPToolLoader with authentication header."""
    from orchestrator.tools.mcp_tool_wrapper import MCPToolLoader
    
    config = {
        "url": "http://localhost:8001/mcp",
        "type": "http",
        "accessToken": "test-token-123"
    }
    
    loader = MCPToolLoader(config, "Authenticated Server")
    
    # Verify the authentication header is configured
    assert loader.access_token == "test-token-123"
    assert "Authorization" in loader.headers
    assert loader.headers["Authorization"] == "Bearer test-token-123"
    
    await loader.close()


@pytest.mark.asyncio
async def test_error_handling_on_connection_failure():
    """Test error handling when MCP server connection fails."""
    from orchestrator.tools.mcp_tool_wrapper import MCPToolLoader
    from agent_framework import MCPStreamableHTTPTool
    
    config = {
        "url": "http://localhost:8001/mcp",
        "type": "http"
    }
    
    loader = MCPToolLoader(config, "Test Server")
    
    # Mock connection failure
    with patch('orchestrator.tools.mcp_tool_wrapper.MCPStreamableHTTPTool') as mock_tool_class:
        # Make the context manager raise an exception
        mock_context = AsyncMock()
        mock_context.__aenter__.side_effect = Exception("Connection failed")
        mock_tool_class.return_value = mock_context
        
        tools = await loader.get_tools()
        
        # Should return empty list on error
        assert tools == []
    
    await loader.close()


@pytest.mark.asyncio
async def test_context_manager_cleanup():
    """Test that async context manager properly cleans up resources."""
    from orchestrator.tools.mcp_tool_wrapper import MCPToolLoader
    from agent_framework import MCPStreamableHTTPTool
    
    config = {
        "url": "http://localhost:8001/mcp",
        "type": "http"
    }
    
    loader = MCPToolLoader(config, "Test Server")
    
    # Mock the MCPStreamableHTTPTool
    mock_tool = MagicMock()
    mock_tool.functions = [MagicMock(name="tool1")]
    
    mock_exit = AsyncMock()
    
    with patch('orchestrator.tools.mcp_tool_wrapper.MCPStreamableHTTPTool') as mock_tool_class:
        mock_context = AsyncMock()
        mock_context.__aenter__.return_value = mock_tool
        mock_context.__aexit__ = mock_exit
        mock_tool_class.return_value = mock_context
        
        await loader.get_tools()
        
        # Should have called __aexit__ for cleanup
        mock_exit.assert_called_once()
    
    await loader.close()
