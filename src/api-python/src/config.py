"""Configuration management for Azure AI Travel Agents API."""

from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Azure OpenAI Configuration
    azure_openai_endpoint: str
    azure_openai_api_key: str
    azure_openai_deployment: str
    azure_openai_api_version: str = "2024-02-15-preview"

    # MCP Server URLs
    mcp_customer_query_url: str
    mcp_destination_recommendation_url: str
    mcp_itinerary_planning_url: str
    mcp_code_evaluation_url: str
    mcp_model_inference_url: str
    mcp_web_search_url: str
    mcp_echo_ping_url: str
    mcp_echo_ping_access_token: Optional[str] = None

    # Server Configuration
    port: int = 4000
    log_level: str = "INFO"

    # OpenTelemetry Configuration
    otel_service_name: str = "api-python"
    otel_exporter_otlp_endpoint: Optional[str] = None
    otel_exporter_otlp_headers: Optional[str] = None


# Global settings instance
settings = Settings()
