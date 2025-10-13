"""Foundry Local LLM provider."""

import logging
from typing import Any

from .base import LLMProvider

logger = logging.getLogger(__name__)


class FoundryLocalProvider(LLMProvider):
    """Azure Foundry Local LLM provider.

    Note: This is a placeholder implementation. The actual Foundry Local SDK
    is not yet available in Python. This will need to be updated when the
    Python SDK becomes available.
    """

    async def get_client(self) -> Any:
        """Get Foundry Local client.

        Returns:
            Configured OpenAI client for Foundry Local

        Raises:
            NotImplementedError: Foundry Local Python SDK not yet available
        """
        logger.info("Using Azure Foundry Local")
        logger.warning(
            "Foundry Local Python SDK is not yet available. "
            "This is a placeholder implementation."
        )

        # Placeholder implementation
        # TODO: Update when Foundry Local Python SDK becomes available
        # Similar to TypeScript: const foundryLocalManager = new FoundryLocalManager()
        # const modelInfo = await foundryLocalManager.init(alias)

        raise NotImplementedError(
            "Foundry Local provider is not yet implemented in Python. "
            "Please use azure-openai, github-models, docker-models, or ollama-models instead."
        )
