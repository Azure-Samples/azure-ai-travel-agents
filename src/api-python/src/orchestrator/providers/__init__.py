"""LLM provider factory using strategy pattern.

This module provides a factory function to get the appropriate LLM client
based on the LLM_PROVIDER environment variable, implementing the same
strategy pattern as the TypeScript implementation.
"""

import logging
from typing import Any

from ...config import settings
from .azure_openai import AzureOpenAIProvider
from .docker_models import DockerModelsProvider
from .foundry_local import FoundryLocalProvider
from .github_models import GitHubModelsProvider
from .ollama_models import OllamaModelsProvider

logger = logging.getLogger(__name__)


async def get_llm_client() -> Any:
    """Get LLM client based on configured provider.

    Returns:
        Configured LLM client instance

    Raises:
        ValueError: If provider is unknown or misconfigured
    """
    provider = settings.llm_provider

    logger.info(f"Initializing LLM provider: {provider}")

    if provider == "azure-openai":
        provider_instance = AzureOpenAIProvider()
        return await provider_instance.get_client()

    elif provider == "github-models":
        provider_instance = GitHubModelsProvider()
        return await provider_instance.get_client()

    elif provider == "docker-models":
        provider_instance = DockerModelsProvider()
        return await provider_instance.get_client()

    elif provider == "ollama-models":
        provider_instance = OllamaModelsProvider()
        return await provider_instance.get_client()

    elif provider == "foundry-local":
        provider_instance = FoundryLocalProvider()
        return await provider_instance.get_client()

    else:
        raise ValueError(
            f'Unknown LLM_PROVIDER "{provider}". '
            "Valid options are: azure-openai, github-models, docker-models, "
            "ollama-models, foundry-local."
        )


__all__ = ["get_llm_client"]
