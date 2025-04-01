import uvicorn
from starlette.applications import Starlette

from app_routes import routes

app = Starlette(
    debug=True,
    routes=routes,
)


def run():
    """Start the Starlette server"""
    uvicorn.run(app, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    run()
