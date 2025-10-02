"""Azure OpenAI LLM provider."""

import logging
from typing import Any

from azure.identity import DefaultAzureCredential, ManagedIdentityCredential
from openai import AsyncAzureOpenAI

from ...config import settings
from .base import LLMProvider

logger = logging.getLogger(__name__)

AZURE_COGNITIVE_SERVICES_SCOPE = "https://cognitiveservices.azure.com/.default"


class AzureOpenAIProvider(LLMProvider):
    """Azure OpenAI LLM provider with Managed Identity support."""

    async def get_client(self) -> Any:
        """Get Azure OpenAI client.

        Returns:
            Configured Azure OpenAI client

        Raises:
            ValueError: If required configuration is missing
        """
        logger.info("Using Azure OpenAI")

        if not settings.azure_openai_endpoint:
            raise ValueError("AZURE_OPENAI_ENDPOINT is required for azure-openai provider")

        if not settings.azure_openai_deployment:
            raise ValueError("AZURE_OPENAI_DEPLOYMENT is required for azure-openai provider")

        # Check if running in local Docker environment
        if settings.is_local_docker_env:
            logger.info("Running in local Docker environment, authenticating with API key")

            if not settings.azure_openai_api_key:
                raise ValueError("AZURE_OPENAI_API_KEY is required in local Docker environment")

            return AsyncAzureOpenAI(
                api_key=settings.azure_openai_api_key,
                api_version=settings.azure_openai_api_version,
                azure_endpoint=settings.azure_openai_endpoint,
            )

        # Use Managed Identity in production
        credential: Any = DefaultAzureCredential()

        if settings.azure_client_id:
            logger.info(f"Using Azure Client ID: {settings.azure_client_id}")
            credential = ManagedIdentityCredential(client_id=settings.azure_client_id)

        # Get token for authentication
        token = credential.get_token(AZURE_COGNITIVE_SERVICES_SCOPE)

        return AsyncAzureOpenAI(
            api_version=settings.azure_openai_api_version,
            azure_endpoint=settings.azure_openai_endpoint,
            azure_ad_token=token.token,
        )
