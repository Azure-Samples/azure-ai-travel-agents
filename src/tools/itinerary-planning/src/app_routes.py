from mcp.server.sse import SseServerTransport
from starlette.responses import HTMLResponse
from starlette.routing import Mount, Route

from mcp_server import mcp

# Create SSE transport
sse = SseServerTransport("/messages/")


# MCP SSE handler function
async def handle_sse(request):
    async with sse.connect_sse(request.scope, request.receive, request._send) as (
        read_stream,
        write_stream,
    ):
        await mcp._mcp_server.run(read_stream, write_stream, mcp._mcp_server.create_initialization_options())


# Not strictly necessary
async def homepage(request):
    return HTMLResponse("Itinerary planning MCP server")


routes = [
    Route("/", endpoint=homepage),
    # MCP related routes
    Route("/sse", endpoint=handle_sse),
    Mount("/messages/", app=sse.handle_post_message),
]
