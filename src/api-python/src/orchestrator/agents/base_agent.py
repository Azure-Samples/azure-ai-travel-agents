"""Base agent class for Microsoft Agent Framework integration."""

import logging
from typing import Any, Dict, List, Optional

from agent_framework import Agent, AgentConfig

logger = logging.getLogger(__name__)


class BaseAgent:
    """Base class for all agents in the travel planning system.
    
    This provides a common interface and shared functionality for all
    specialized agents.
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
            tools: Optional list of tools available to the agent
        """
        self.name = name
        self.description = description
        self.system_prompt = system_prompt
        self.tools = tools or []
        self.agent: Optional[Agent] = None
        logger.info(f"Initialized {name}")

    async def initialize(self, llm_client: Any) -> None:
        """Initialize the MAF agent with LLM client.

        Args:
            llm_client: LLM client instance from provider
        """
        config = AgentConfig(
            name=self.name,
            description=self.description,
            instructions=self.system_prompt,
            tools=self.tools,
        )
        
        self.agent = Agent(
            config=config,
            llm_client=llm_client,
        )
        
        logger.info(f"MAF agent {self.name} initialized")

    async def process(self, message: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Process a message using the agent.

        Args:
            message: User message to process
            context: Optional context information

        Returns:
            Agent response

        Raises:
            RuntimeError: If agent not initialized
        """
        if not self.agent:
            raise RuntimeError(f"Agent {self.name} not initialized. Call initialize() first.")

        logger.debug(f"{self.name} processing message: {message[:100]}...")
        
        # Process with context if provided
        if context:
            response = await self.agent.run(message, context=context)
        else:
            response = await self.agent.run(message)
        
        logger.debug(f"{self.name} response: {str(response)[:100]}...")
        return response

    def get_agent(self) -> Agent:
        """Get the underlying MAF agent.

        Returns:
            MAF Agent instance

        Raises:
            RuntimeError: If agent not initialized
        """
        if not self.agent:
            raise RuntimeError(f"Agent {self.name} not initialized")
        return self.agent
