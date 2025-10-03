"""Docker Models LLM provider."""

import logging
from typing import Any

from agent_framework.openai import OpenAIChatClient
from openai import AsyncOpenAI

from ...config import settings
from .base import LLMProvider

logger = logging.getLogger(__name__)


class DockerModelsProvider(LLMProvider):
    """Docker Models LLM provider."""

    async def get_client(self) -> Any:
        """Get Docker Models chat client for Microsoft Agent Framework.

        Returns:
            OpenAIChatClient configured for Docker Models

        Raises:
            ValueError: If required configuration is missing
        """
        logger.info("Using Docker Models")

        if not settings.docker_model_endpoint:
            raise ValueError("DOCKER_MODEL_ENDPOINT is required for docker-models provider")

        if not settings.docker_model:
            raise ValueError("DOCKER_MODEL is required for docker-models provider")

        # Create the underlying OpenAI async client for Docker Models
        async_client = AsyncOpenAI(
            base_url=settings.docker_model_endpoint,
            api_key="DOCKER_API_KEY",  # Placeholder API key for Docker models
        )
        
        # Wrap with MAF's OpenAIChatClient
        maf_client = OpenAIChatClient(
            model_id=settings.docker_model,
            async_client=async_client,
        )
        
        logger.info(f"Created MAF OpenAIChatClient with model: {settings.docker_model}")
        return maf_client
