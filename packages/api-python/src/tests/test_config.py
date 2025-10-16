"""Test configuration module."""

import pytest
from src.config import Settings


def test_settings_defaults():
    """Test default settings values."""
    # This will use .env.sample or raise error if required fields are missing
    # For testing, we'll create a minimal settings object
    settings = Settings(
        azure_openai_endpoint="https://test.openai.azure.com/",
        azure_openai_api_key="test-key",
        azure_openai_deployment="gpt-4o",
        mcp_customer_query_url="http://localhost:5001",
        mcp_destination_recommendation_url="http://localhost:5002",
        mcp_itinerary_planning_url="http://localhost:5003",
        mcp_echo_ping_url="http://localhost:5007",
    )

    assert settings.port == 4000
    assert settings.log_level == "INFO"
    assert settings.otel_service_name == "api-python"
    assert settings.azure_openai_api_version == "2024-02-15-preview"


def test_settings_custom_port():
    """Test custom port setting."""
    settings = Settings(
        azure_openai_endpoint="https://test.openai.azure.com/",
        azure_openai_api_key="test-key",
        azure_openai_deployment="gpt-4o",
        mcp_customer_query_url="http://localhost:5001",
        mcp_destination_recommendation_url="http://localhost:5002",
        mcp_itinerary_planning_url="http://localhost:5003",
        mcp_echo_ping_url="http://localhost:5007",
        port=5000,
    )

    assert settings.port == 5000
