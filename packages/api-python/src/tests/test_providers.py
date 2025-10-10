"""Test LLM provider implementations."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from src.orchestrator.providers import get_llm_client
from src.orchestrator.providers.azure_openai import AzureOpenAIProvider
from src.orchestrator.providers.github_models import GitHubModelsProvider
from src.orchestrator.providers.docker_models import DockerModelsProvider
from src.orchestrator.providers.ollama_models import OllamaModelsProvider
from src.config import settings


@pytest.mark.asyncio
async def test_azure_openai_provider_local_docker():
    """Test Azure OpenAI provider in local Docker mode."""
    with patch("src.config.settings") as mock_settings:
        mock_settings.azure_openai_endpoint = "https://test.openai.azure.com/"
        mock_settings.azure_openai_deployment = "gpt-4o"
        mock_settings.azure_openai_api_key = "test-key"
        mock_settings.azure_openai_api_version = "2024-02-15-preview"
        mock_settings.is_local_docker_env = True

        with patch("src.orchestrator.providers.azure_openai.AsyncAzureOpenAI") as mock_client:
            provider = AzureOpenAIProvider()
            await provider.get_client()

            mock_client.assert_called_once_with(
                api_key="test-key",
                api_version="2024-02-15-preview",
                azure_endpoint="https://test.openai.azure.com/",
            )


@pytest.mark.asyncio
async def test_github_models_provider():
    """Test GitHub Models provider."""
    with patch("src.config.settings") as mock_settings:
        mock_settings.github_token = "test-token"
        mock_settings.github_model = "openai/gpt-4o"

        with patch("src.orchestrator.providers.github_models.AsyncOpenAI") as mock_client:
            provider = GitHubModelsProvider()
            await provider.get_client()

            mock_client.assert_called_once_with(
                base_url="https://models.inference.ai.azure.com",
                api_key="test-token",
            )


@pytest.mark.asyncio
async def test_docker_models_provider():
    """Test Docker Models provider."""
    with patch("src.config.settings") as mock_settings:
        mock_settings.docker_model_endpoint = "http://localhost:12434/v1"
        mock_settings.docker_model = "ai/phi4:14B-Q4_0"

        with patch("src.orchestrator.providers.docker_models.AsyncOpenAI") as mock_client:
            provider = DockerModelsProvider()
            await provider.get_client()

            mock_client.assert_called_once_with(
                base_url="http://localhost:12434/v1",
                api_key="DOCKER_API_KEY",
            )


@pytest.mark.asyncio
async def test_ollama_models_provider():
    """Test Ollama Models provider."""
    with patch("src.config.settings") as mock_settings:
        mock_settings.ollama_model_endpoint = "http://localhost:11434/v1"
        mock_settings.ollama_model = "llama3.1"

        with patch("src.orchestrator.providers.ollama_models.AsyncOpenAI") as mock_client:
            provider = OllamaModelsProvider()
            await provider.get_client()

            mock_client.assert_called_once_with(
                base_url="http://localhost:11434/v1",
                api_key="OLLAMA_API_KEY",
            )


@pytest.mark.asyncio
async def test_get_llm_client_azure_openai():
    """Test get_llm_client with Azure OpenAI provider."""
    with patch("src.config.settings") as mock_settings:
        mock_settings.llm_provider = "azure-openai"
        mock_settings.azure_openai_endpoint = "https://test.openai.azure.com/"
        mock_settings.azure_openai_deployment = "gpt-4o"
        mock_settings.azure_openai_api_key = "test-key"
        mock_settings.is_local_docker_env = True

        with patch("src.orchestrator.providers.azure_openai.AsyncAzureOpenAI"):
            client = await get_llm_client()
            assert client is not None


@pytest.mark.asyncio
async def test_get_llm_client_invalid_provider():
    """Test get_llm_client with invalid provider."""
    with patch("src.config.settings") as mock_settings:
        mock_settings.llm_provider = "invalid-provider"

        with pytest.raises(ValueError, match="Unknown LLM_PROVIDER"):
            await get_llm_client()
