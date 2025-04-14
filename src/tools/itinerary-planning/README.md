# Python MCP server for Itinerary Planning

## Local Environment

1. Create a [Python virtual environment](https://docs.python.org/3/tutorial/venv.html#creating-virtual-environments) and activate it.

    ```bash
    uv venv
    ```

2. Install the the MCP server packages:

    ```bash
    uv pip install -e src/tools/itinerary-planning
    ```

3. Run the MCP server:

    ```shell
    uv run src/tools/itinerary-planning/src/app.py
    ```

## Debug with MCP Inspector

For testing and debugging MCP functionality, use the MCP Inspector:

```cmd
uv run mcp dev src/tools/itinerary-planning/src/mcp_server.py
```
