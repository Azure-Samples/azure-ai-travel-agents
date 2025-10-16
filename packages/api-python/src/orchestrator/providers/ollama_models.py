"""Ollama Models LLM provider."""

import logging
from typing import Any

from agent_framework.openai import OpenAIChatClient
from openai import AsyncOpenAI

from src.config import settings
from .base import LLMProvider

logger = logging.getLogger(__name__)


class OllamaModelsProvider(LLMProvider):
    """Ollama Models LLM provider."""

    async def get_client(self) -> Any:
        """Get Ollama Models chat client for Microsoft Agent Framework.

        Returns:
            OpenAIChatClient configured for Ollama Models

        Raises:
            ValueError: If required configuration is missing
        """
        logger.info("Using Ollama Models")

        if not settings.ollama_model_endpoint:
            raise ValueError("OLLAMA_MODEL_ENDPOINT is required for ollama-models provider")

        if not settings.ollama_model:
            raise ValueError("OLLAMA_MODEL is required for ollama-models provider")

        # Create the underlying OpenAI async client for Ollama
        async_client = AsyncOpenAI(
            base_url=settings.ollama_model_endpoint,
            api_key="OLLAMA_API_KEY",  # Placeholder API key for Ollama models
        )

        # Wrap with MAF's OpenAIChatClient
        maf_client = OpenAIChatClient(
            model_id=settings.ollama_model,
            async_client=async_client,
        )

        logger.info(f"Created MAF OpenAIChatClient with model: {settings.ollama_model}")
        return maf_client
