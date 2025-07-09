#!/bin/bash

## This script is executed after the Azure Developer CLI (azd) provisioning step
# It sets up the environment for the AI Travel Agents application, including creating .env files,
# installing dependencies, and preparing the MCP tools.

# Note: this script is executed at the root of the project directory

echo "Running post-deployment script for AI Travel Agents application..."

##########################################################################
# API
##########################################################################

echo ">> Creating .env file for the API service..."
if [ ! -f ./src/api/.env ]; then
    echo "# File automatically generated on $(date)" > ./src/api/.env
    echo "# See .env.sample for more information" >> ./src/api/.env
    echo ""
    AZURE_OPENAI_ENDPOINT=$(azd env get-value AZURE_OPENAI_ENDPOINT)
    echo "AZURE_OPENAI_ENDPOINT=\"$AZURE_OPENAI_ENDPOINT\"" >> ./src/api/.env
    echo ""
    echo "LLM_PROVIDER=azure-openai" >> ./src/api/.env
    echo ""
    echo "AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini" >> ./src/api/.env
    echo ""
    echo "MCP_CUSTOMER_QUERY_URL=http://localhost:8080" >> ./src/api/.env
    echo "MCP_DESTINATION_RECOMMENDATION_URL=http://localhost:5002" >> ./src/api/.env
    echo "MCP_ITINERARY_PLANNING_URL=http://localhost:5003" >> ./src/api/.env
    echo "MCP_CODE_EVALUATION_URL=http://localhost:5004" >> ./src/api/.env
    echo "MCP_MODEL_INFERENCE_URL=http://localhost:5005" >> ./src/api/.env
    echo "MCP_WEB_SEARCH_URL=http://localhost:5006" >> ./src/api/.env
    echo "MCP_ECHO_PING_URL=http://localhost:5007" >> ./src/api/.env
    echo "MCP_ECHO_PING_ACCESS_TOKEN=123-this-is-a-fake-token-please-use-a-token-provider" >> ./src/api/.env
    echo ""
    echo "OTEL_SERVICE_NAME=api" >> ./src/api/.env
    echo "OTEL_EXPORTER_OTLP_ENDPOINT=http://aspire-dashboard:18889" >> ./src/api/.env
    echo "OTEL_EXPORTER_OTLP_HEADERS=header-value" >> ./src/api/.env
fi

# Set overrides for docker environment
if [ ! -f ./src/api/.env.docker ]; then
    echo "# File automatically generated on $(date)" > ./src/api/.env.docker
    echo "# See .env.sample for more information" >> ./src/api/.env.docker
    echo ""
    echo "MCP_CUSTOMER_QUERY_URL=http://tool-customer-query:8080" >> ./src/api/.env.docker
    echo "MCP_DESTINATION_RECOMMENDATION_URL=http://tool-destination-recommendation:5002" >> ./src/api/.env.docker
    echo "MCP_ITINERARY_PLANNING_URL=http://tool-itinerary-planning:5003" >> ./src/api/.env.docker
    echo "MCP_CODE_EVALUATION_URL=http://tool-code-evaluation:5004" >> ./src/api/.env.docker
    echo "MCP_MODEL_INFERENCE_URL=http://tool-model-inference:5005" >> ./src/api/.env.docker
    echo "MCP_WEB_SEARCH_URL=http://tool-web-search:5006" >> ./src/api/.env.docker
    echo "MCP_ECHO_PING_URL=http://tool-echo-ping:5007" >> ./src/api/.env.docker
fi

##########################################################################
# UI
##########################################################################

echo ">> Creating .env file for the UI service..."
if [ ! -f ./src/ui/.env ]; then
    echo "# File automatically generated on $(date)" > ./src/ui/.env
    echo "# See .env.sample for more information" >> ./src/ui/.env
    echo ""
    NG_API_URL=$(azd env get-value NG_API_URL)
    echo "NG_API_URL=http://localhost:4000" >> ./src/ui/.env
    echo ""
    echo "# Uncomment the following line to use the provisioned endpoint for the API" >> ./src/ui/.env
    echo "# NG_API_URL=\"$NG_API_URL\"" >> ./src/ui/.env
fi

# Execute the API and UI setup scripts
echo ">> Setting up API and UI services..."
if [ -f ./infra/hooks/api/setup.sh ]; then
    echo "Executing API setup script..."
    ./infra/hooks/api/setup.sh
    api_status=$?
    if [ $api_status -ne 0 ]; then
        echo "API setup failed with exit code $api_status. Exiting."
        exit $api_status
    fi
else
    echo "API setup script not found. Skipping API setup."
fi
if [ -f ./infra/hooks/ui/setup.sh ]; then
    echo "Executing UI setup script..."
    ./infra/hooks/ui/setup.sh
    ui_status=$?
    if [ $ui_status -ne 0 ]; then
        echo "UI setup failed with exit code $ui_status. Exiting."
        exit $ui_status
    fi
else
    echo "UI setup script not found. Skipping UI setup."
fi

# Execute the MCP tools setup script
echo ">> Setting up MCP tools..."
if [ -f ./infra/hooks/mcp/setup.sh ]; then
    echo "Executing MCP tools setup script..."
    ./infra/hooks/mcp/setup.sh
    mcp_status=$?
    if [ $mcp_status -ne 0 ]; then
        echo "MCP tools setup failed with exit code $mcp_status. Exiting."
        exit $mcp_status
    fi
else
    echo "MCP tools setup script not found. Skipping MCP tools setup."
fi