"""Base agent class for Microsoft Agent Framework integration."""

import logging
from typing import Any, Dict, List, Optional

try:
    from agent_framework import ChatAgent
except ImportError:
    raise ImportError(
        "Microsoft Agent Framework SDK is required. "
        "Install with: pip install agent-framework>=1.0.0b251001"
    )

logger = logging.getLogger(__name__)


class BaseAgent:
    """Base class for all agents in the travel planning system.
    
    This provides a common interface and shared functionality for all
    specialized agents using Microsoft Agent Framework.
    """

    def __init__(
        self,
        name: str,
        description: str,
        system_prompt: str,
        tools: Optional[List[Any]] = None,
    ):
        """Initialize the base agent.

        Args:
            name: Agent name
            description: Agent description
            system_prompt: System prompt for the agent
            tools: Optional list of tools available to the agent (can be AIFunction, MCP tools, etc.)
        """
        self.name = name
        self.description = description
        self.system_prompt = system_prompt
        self.tools = tools or []
        self.chat_client: Optional[Any] = None
        self.agent: Optional[ChatAgent] = None
        logger.info(f"Initialized {name}")

    async def initialize(self, chat_client: Any) -> None:
        """Initialize the MAF agent with chat client.

        Args:
            chat_client: Chat client instance from Microsoft Agent Framework
                       (e.g., OpenAIChatClient, OpenAIResponsesClient, etc.)
        """
        # Store the chat client
        self.chat_client = chat_client
        
        # Create ChatAgent with the chat client from Microsoft Agent Framework
        # The chat client should already be configured with the right model
        self.agent = ChatAgent(
            chat_client=chat_client,
            name=self.name,
            instructions=self.system_prompt,
            tools=self.tools if self.tools else None,
        )
        
        logger.info(f"MAF ChatAgent '{self.name}' initialized with {len(self.tools)} tools")

    async def process(self, message: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Process a message using the agent.

        Args:
            message: User message to process
            context: Optional context information

        Returns:
            Agent response as string

        Raises:
            RuntimeError: If agent not initialized
        """
        if not self.agent:
            raise RuntimeError(f"Agent {self.name} not initialized. Call initialize() first.")

        logger.debug(f"{self.name} processing message: {message[:100]}...")
        
        # Use the ChatAgent's run method to process the message
        result = await self.agent.run(message=message)
        
        # Extract the text response from the result
        # The result should be a string from ChatAgent.run()
        response_text = str(result)
        
        logger.debug(f"{self.name} response: {response_text[:100]}...")
        return response_text

    def get_agent(self) -> ChatAgent:
        """Get the underlying MAF ChatAgent.

        Returns:
            MAF ChatAgent instance

        Raises:
            RuntimeError: If agent not initialized
        """
        if not self.agent:
            raise RuntimeError(f"Agent {self.name} not initialized")
        return self.agent
