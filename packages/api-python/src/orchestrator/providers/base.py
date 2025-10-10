"""LLM provider implementations using strategy pattern.

This module implements the same strategy pattern as the TypeScript implementation
in packages/api/src/orchestrator/llamaindex/providers, allowing selection between
different LLM providers based on the LLM_PROVIDER environment variable.
"""

from abc import ABC, abstractmethod
from typing import Any


class LLMProvider(ABC):
    """Base class for LLM providers."""

    @abstractmethod
    async def get_client(self) -> Any:
        """Get the LLM client instance.

        Returns:
            LLM client instance configured for the specific provider
        """
        pass
