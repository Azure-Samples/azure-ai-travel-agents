import logging

import uvicorn
from starlette.applications import Starlette
from starlette.responses import HTMLResponse
from starlette.routing import Mount, Route

from mcp_server import itinerary_mcp

logger = logging.getLogger(__name__)

# Not strictly necessary, but demonstrates the inclusion of non-MCP routes
async def homepage(request):
    return HTMLResponse("Itinerary planning MCP server")


app = Starlette(
    debug=True,
    routes=[
        Route("/", endpoint=homepage),
        Mount("/mcp", app=itinerary_mcp.streamable_http_app())
    ]
)


def run():
    """Start the Starlette server"""
    uvicorn.run(app, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    run()
