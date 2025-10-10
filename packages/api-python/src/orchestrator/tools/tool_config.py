"""MCP Tool Configuration following TypeScript implementation patterns."""

from typing import Literal, TypedDict

from config import Settings

# MCP Server Names matching TypeScript implementation
McpServerName = Literal[
    "echo-ping",
    "customer-query",
    "web-search",
    "itinerary-planning",
    "model-inference",
    "code-evaluation",
    "destination-recommendation",
]

# MCP API paths
MCP_API_SSE_PATH = "/sse"
MCP_API_HTTP_PATH = "/mcp"


class MCPServerConfig(TypedDict):
    """MCP Server Configuration."""

    url: str
    type: Literal["http", "sse"]
    verbose: bool


class MCPServerDefinition(TypedDict):
    """MCP Server Definition."""

    config: MCPServerConfig
    id: McpServerName
    name: str


def get_mcp_tools_config() -> dict[McpServerName, MCPServerDefinition]:
    """
    Get MCP tools configuration following TypeScript implementation pattern.
    
    Mirrors packages/api/src/orchestrator/llamaindex/tools/index.ts
    
    Returns:
        Dictionary mapping server names to their configurations
    """
    settings = Settings()
    
    return {
        # "ms-learn": {
        #     "config": {
        #         "url": "https://learn.microsoft.com/api/mcp",
        #         "type": "http",
        #         "verbose": True,
        #     },
        #     "id": "ms-learn",
        #     "name": "MS Learn",
        # },
        "echo-ping": {
            "config": {
                "url": f"{settings.mcp_echo_ping_url}{MCP_API_HTTP_PATH}",
                "type": "http",
                "verbose": True,
            },
            "id": "echo-ping",
            "name": "Echo Test",
        },
        "customer-query": {
            "config": {
                "url": f"{settings.mcp_customer_query_url}{MCP_API_HTTP_PATH}",
                "type": "http",
                "verbose": True,
            },
            "id": "customer-query",
            "name": "Customer Query",
        },
        # "web-search": {
        #     "config": {
        #         "url": f"{settings.mcp_web_search_url}{MCP_API_SSE_PATH}",
        #         "type": "sse",
        #         "verbose": True,
        #     },
        #     "id": "web-search",
        #     "name": "Web Search",
        # },
        "itinerary-planning": {
            "config": {
                "url": f"{settings.mcp_itinerary_planning_url}{MCP_API_HTTP_PATH}",
                "type": "http",
                "verbose": True,
            },
            "id": "itinerary-planning",
            "name": "Itinerary Planning",
        },
        # "model-inference": {
        #     "config": {
        #         "url": f"{settings.mcp_model_inference_url}{MCP_API_SSE_PATH}",
        #         "type": "sse",
        #         "verbose": True,
        #     },
        #     "id": "model-inference",
        #     "name": "Model Inference",
        # },
        # "code-evaluation": {
        #     "config": {
        #         "url": f"{settings.mcp_code_evaluation_url}{MCP_API_SSE_PATH}",
        #         "type": "sse",
        #         "verbose": True,
        #     },
        #     "id": "code-evaluation",
        #     "name": "Code Evaluation",
        # },
        # "destination-recommendation": {
        #     "config": {
        #         "url": f"{settings.mcp_destination_recommendation_url}{MCP_API_HTTP_PATH}",
        #         "type": "http",
        #         "verbose": True,
        #     },
        #     "id": "destination-recommendation",
        #     "name": "Destination Recommendation",
        # },
    }


# Export singleton instance
MCP_TOOLS_CONFIG = get_mcp_tools_config()
