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
if [ ! -f ./packages/api/.env ]; then
    echo "# File automatically generated on $(date)" > ./packages/api/.env
    echo "# See .env.sample for more information" >> ./packages/api/.env
    echo ""
    AZURE_OPENAI_ENDPOINT=$(azd env get-value AZURE_OPENAI_ENDPOINT)
    echo "AZURE_OPENAI_ENDPOINT=\"$AZURE_OPENAI_ENDPOINT\"" >> ./packages/api/.env
    echo ""
    echo "LLM_PROVIDER=azure-openai" >> ./packages/api/.env
    echo ""
    echo "AZURE_OPENAI_DEPLOYMENT=gpt-5" >> ./packages/api/.env
    echo ""
    echo "MCP_CUSTOMER_QUERY_URL=http://localhost:8080" >> ./packages/api/.env
    echo "MCP_DESTINATION_RECOMMENDATION_URL=http://localhost:5002" >> ./packages/api/.env
    echo "MCP_ITINERARY_PLANNING_URL=http://localhost:5003" >> ./packages/api/.env
    echo "MCP_ECHO_PING_URL=http://localhost:5004" >> ./packages/api/.env
    echo "MCP_ECHO_PING_ACCESS_TOKEN=123-this-is-a-fake-token-please-use-a-token-provider" >> ./packages/api/.env
    echo ""
    echo "OTEL_SERVICE_NAME=api" >> ./packages/api/.env
    echo "OTEL_EXPORTER_OTLP_ENDPOINT=http://aspire-dashboard:18889" >> ./packages/api/.env
    echo "OTEL_EXPORTER_OTLP_HEADERS=header-value" >> ./packages/api/.env
fi

# Set overrides for docker environment
if [ ! -f ./packages/api/.env.docker ]; then
    echo "# File automatically generated on $(date)" > ./packages/api/.env.docker
    echo "# See .env.sample for more information" >> ./packages/api/.env.docker
    echo ""
    echo "MCP_CUSTOMER_QUERY_URL=http://mcp-customer-query:8080" >> ./packages/api/.env.docker
    echo "MCP_DESTINATION_RECOMMENDATION_URL=http://mcp-destination-recommendation:5002" >> ./packages/api/.env.docker
    echo "MCP_ITINERARY_PLANNING_URL=http://mcp-itinerary-planning:5003" >> ./packages/api/.env.docker
    echo "MCP_ECHO_PING_URL=http://mcp-echo-ping:5004" >> ./packages/api/.env.docker
fi

##########################################################################
# UI
##########################################################################

echo ">> Creating .env file for the UI service..."
if [ ! -f ./packages/ui/.env ]; then
    echo "# File automatically generated on $(date)" > ./packages/ui/.env
    echo "# See .env.sample for more information" >> ./packages/ui/.env
    echo ""
    NG_API_URL=$(azd env get-value NG_API_URL)
    echo "NG_API_URL=http://localhost:4000" >> ./packages/ui/.env
    echo ""
    echo "# Uncomment the following line to use the provisioned endpoint for the API" >> ./packages/ui/.env
    echo "# NG_API_URL=\"$NG_API_URL\"" >> ./packages/ui/.env
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