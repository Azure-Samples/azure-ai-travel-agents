"""Ollama Models LLM provider."""

import logging
from typing import Any

from openai import AsyncOpenAI

from ...config import settings
from .base import LLMProvider

logger = logging.getLogger(__name__)


class OllamaModelsProvider(LLMProvider):
    """Ollama Models LLM provider."""

    async def get_client(self) -> Any:
        """Get Ollama Models client.

        Returns:
            Configured OpenAI client for Ollama Models

        Raises:
            ValueError: If required configuration is missing
        """
        logger.info("Using Ollama Models")

        if not settings.ollama_model_endpoint:
            raise ValueError("OLLAMA_MODEL_ENDPOINT is required for ollama-models provider")

        if not settings.ollama_model:
            raise ValueError("OLLAMA_MODEL is required for ollama-models provider")

        return AsyncOpenAI(
            base_url=settings.ollama_model_endpoint,
            api_key="OLLAMA_API_KEY",  # Placeholder API key for Ollama models
        )
