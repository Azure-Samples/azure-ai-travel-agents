"""Docker Models LLM provider."""

import logging
from typing import Any

from openai import AsyncOpenAI

from ...config import settings
from .base import LLMProvider

logger = logging.getLogger(__name__)


class DockerModelsProvider(LLMProvider):
    """Docker Models LLM provider."""

    async def get_client(self) -> Any:
        """Get Docker Models client.

        Returns:
            Configured OpenAI client for Docker Models

        Raises:
            ValueError: If required configuration is missing
        """
        logger.info("Using Docker Models")

        if not settings.docker_model_endpoint:
            raise ValueError("DOCKER_MODEL_ENDPOINT is required for docker-models provider")

        if not settings.docker_model:
            raise ValueError("DOCKER_MODEL is required for docker-models provider")

        return AsyncOpenAI(
            base_url=settings.docker_model_endpoint,
            api_key="DOCKER_API_KEY",  # Placeholder API key for Docker models
        )
