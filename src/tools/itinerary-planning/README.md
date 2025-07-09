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

## Start local server

Navigate to the source directory and run the server:

```bash
cd src/tools/itinerary-planning/src
```

```bash
uv run start
```

## Deploy the MCP server as standalone Azure Container App

This server is designed to be deployed with the rest of the servers in this AI Travel Agents project. However, it can also be deployed as a standalone Azure Container App.

1. Ensure you have the Azure CLI installed and logged in:

    ```bash
    az login
    ```

2. Create a resource group for the Container App:

    ```bash
    az group create --name pf-travelagent --location westus2
    ```

3. Create a Container App environment:

    ```bash
    az containerapp env create --name pf-travelagent-env  --resource-group pf-travelagent --location westus2
    ```

4. Deploy the Container App:

    ```bash
    az containerapp up --name pf-travelagent-app --source src/tools/itinerary-planning --ingress external --target-port 8000
    ```
