"""Test MCP client implementations."""

import pytest
from unittest.mock import AsyncMock, patch
from src.orchestrator.tools.mcp_client import HTTPMCPClient


@pytest.mark.asyncio
async def test_http_mcp_client_initialization():
    """Test HTTP MCP client initialization."""
    client = HTTPMCPClient(base_url="http://localhost:5000")

    assert client.base_url == "http://localhost:5000"
    assert client.access_token is None
    assert client.timeout == 30.0

    await client.close()


@pytest.mark.asyncio
async def test_http_mcp_client_with_token():
    """Test HTTP MCP client with access token."""
    client = HTTPMCPClient(
        base_url="http://localhost:5000",
        access_token="test-token",
    )

    assert client.access_token == "test-token"

    await client.close()


@pytest.mark.asyncio
async def test_http_mcp_client_call_tool():
    """Test calling a tool via HTTP MCP client."""
    client = HTTPMCPClient(base_url="http://localhost:5000")

    # Mock the httpx client
    mock_response = AsyncMock()
    mock_response.json.return_value = {"result": "success"}
    mock_response.raise_for_status = AsyncMock()

    with patch.object(client.client, "post", return_value=mock_response):
        result = await client.call_tool(
            tool_name="test_tool",
            arguments={"param": "value"},
        )

        assert result == {"result": "success"}

    await client.close()


@pytest.mark.asyncio
async def test_http_mcp_client_list_tools():
    """Test listing tools via HTTP MCP client."""
    client = HTTPMCPClient(base_url="http://localhost:5000")

    # Mock the httpx client
    mock_response = AsyncMock()
    mock_response.json.return_value = [
        {"name": "tool1", "description": "Tool 1"},
        {"name": "tool2", "description": "Tool 2"},
    ]
    mock_response.raise_for_status = AsyncMock()

    with patch.object(client.client, "get", return_value=mock_response):
        tools = await client.list_tools()

        assert len(tools) == 2
        assert tools[0]["name"] == "tool1"

    await client.close()
