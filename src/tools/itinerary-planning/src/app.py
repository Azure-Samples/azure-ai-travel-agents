import logging

import uvicorn
from starlette.responses import HTMLResponse
from starlette.routing import Route

from mcp_server import mcp

logger = logging.getLogger(__name__)

# Not necessary for MCP, but demonstrates the inclusion of non-MCP routes
async def homepage(request):
    return HTMLResponse("Itinerary planning MCP server")

app = mcp.streamable_http_app()
app.router.routes.append(Route("/", endpoint=homepage))

def run():
    """Start the Starlette server"""
    uvicorn.run(app, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    run()
