"""Azure OpenAI LLM provider."""

import logging
from typing import Any

from agent_framework.openai import OpenAIChatClient
from azure.identity import DefaultAzureCredential, ManagedIdentityCredential
from openai import AsyncAzureOpenAI

from src.config import settings
from .base import LLMProvider

logger = logging.getLogger(__name__)

AZURE_COGNITIVE_SERVICES_SCOPE = "https://cognitiveservices.azure.com/.default"


class AzureOpenAIProvider(LLMProvider):
    """Azure OpenAI LLM provider with Managed Identity support."""

    async def get_client(self) -> Any:
        """Get Azure OpenAI chat client for Microsoft Agent Framework.

        Returns:
            OpenAIChatClient configured with Azure OpenAI

        Raises:
            ValueError: If required configuration is missing
        """
        logger.info("Using Azure OpenAI")

        if not settings.azure_openai_endpoint:
            raise ValueError("AZURE_OPENAI_ENDPOINT is required for azure-openai provider")

        if not settings.azure_openai_deployment_name:
            raise ValueError("AZURE_OPENAI_DEPLOYMENT_NAME is required for azure-openai provider")

        # Create the underlying Azure OpenAI async client
        async_client: AsyncAzureOpenAI
        
        # If API key is provided, use it (local development or explicit configuration)
        if settings.azure_openai_api_key:
            logger.info("Using API key authentication")
            async_client = AsyncAzureOpenAI(
                api_key=settings.azure_openai_api_key,
                api_version=settings.azure_openai_api_version,
                azure_endpoint=settings.azure_openai_endpoint,
            )
        else:
            # Otherwise, use Managed Identity in Azure environments
            logger.info("Using Managed Identity authentication")
            credential: Any = DefaultAzureCredential()

            if settings.azure_client_id:
                logger.info(f"Using Azure Client ID: {settings.azure_client_id}")
                credential = ManagedIdentityCredential(client_id=settings.azure_client_id)

            # Get token for authentication
            token = credential.get_token(AZURE_COGNITIVE_SERVICES_SCOPE)

            async_client = AsyncAzureOpenAI(
                api_version=settings.azure_openai_api_version,
                azure_endpoint=settings.azure_openai_endpoint,
                azure_ad_token=token.token,
            )

        # Wrap the Azure OpenAI client with MAF's OpenAIChatClient
        # This provides the ChatClientProtocol interface that ChatAgent expects
        maf_client = OpenAIChatClient(
            model_id=settings.azure_openai_deployment_name,
            async_client=async_client,
        )
        
        logger.info(f"Created MAF OpenAIChatClient with model: {settings.azure_openai_deployment_name}")
        return maf_client
