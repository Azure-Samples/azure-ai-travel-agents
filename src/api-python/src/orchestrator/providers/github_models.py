"""GitHub Models LLM provider."""

import logging
from typing import Any

from openai import AsyncOpenAI

from ...config import settings
from .base import LLMProvider

logger = logging.getLogger(__name__)


class GitHubModelsProvider(LLMProvider):
    """GitHub Models LLM provider."""

    async def get_client(self) -> Any:
        """Get GitHub Models client.

        Returns:
            Configured OpenAI client for GitHub Models

        Raises:
            ValueError: If required configuration is missing
        """
        logger.info("Using GitHub Models")

        if not settings.github_token:
            raise ValueError("GITHUB_TOKEN is required for github-models provider")

        if not settings.github_model:
            raise ValueError("GITHUB_MODEL is required for github-models provider")

        return AsyncOpenAI(
            base_url="https://models.inference.ai.azure.com",
            api_key=settings.github_token,
        )
