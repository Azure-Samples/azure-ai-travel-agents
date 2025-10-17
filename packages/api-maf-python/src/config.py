"""Configuration management for Azure AI Travel Agents API."""

from typing import Literal, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

# LLM Provider type
LLMProvider = Literal[
    "azure-openai",
    "github-models",
    "docker-models",
    "ollama-models",
    "foundry-local",
]


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # LLM Provider Selection
    llm_provider: LLMProvider = "azure-openai"

    # Azure OpenAI Configuration
    azure_openai_endpoint: Optional[str] = None
    azure_openai_api_key: Optional[str] = None
    azure_openai_deployment_name: Optional[str] = None
    azure_openai_api_version: str = "2024-02-15-preview"
    azure_client_id: Optional[str] = None
    is_local_docker_env: bool = False

    # GitHub Models Configuration
    github_token: Optional[str] = None
    github_model: Optional[str] = None

    # Docker Models Configuration
    docker_model_endpoint: Optional[str] = None
    docker_model: Optional[str] = None

    # Ollama Models Configuration
    ollama_model_endpoint: Optional[str] = None
    ollama_model: Optional[str] = None

    # Foundry Local Configuration
    azure_foundry_local_model_alias: str = "phi-3.5-mini"

    # MCP Server URLs (optional with defaults from docker-compose)
    mcp_customer_query_url: str = "http://mcp-customer-query:5001"
    mcp_destination_recommendation_url: str = "http://mcp-destination-recommendation:5002"
    mcp_itinerary_planning_url: str = "http://mcp-itinerary-planning:5003"
    mcp_echo_ping_url: str = "http://mcp-echo-ping:5004"
    mcp_echo_ping_access_token: Optional[str] = "123-this-is-a-fake-token-please-use-a-token-provider"

    # Server Configuration
    port: int = 4010
    log_level: str = "INFO"

    # OpenTelemetry Configuration
    otel_service_name: str = "api-maf-python"
    otel_exporter_otlp_endpoint: Optional[str] = None
    otel_exporter_otlp_headers: Optional[str] = None


# Global settings instance
settings = Settings()
