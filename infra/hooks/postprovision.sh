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

# Install dependencies for the API service
echo ">> Installing dependencies for the API service..."
if [ ! -d ./src/api/node_modules ]; then
    echo "Installing dependencies for the API service..."
    npm ci --prefix=src/api --legacy-peer-deps 
else
    echo "Dependencies for the API service already installed."
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

# Install dependencies for the UI service
echo ">> Installing dependencies for the UI service..."
if [ ! -d ./src/ui/node_modules ]; then
    echo "Installing dependencies for the UI service..."
    npm ci --prefix=src/ui
else
    echo "Dependencies for the UI service already installed."
fi

##########################################################################
# MCP Tools
##########################################################################
tools="echo-ping customer-query destination-recommendation itinerary-planning code-evaluation model-inference web-search"
echo ">> Creating .env file for the MCP servers..."

#  for each tool copy the .env.sample (if it exists) to .env and .env.docker (dont overwrite existing .env files)
for tool in $tools; do
    if [ -f ./src/tools/$tool/.env.sample ]; then
        echo "Creating .env file for $tool..."
        if [ ! -f ./src/tools/$tool/.env ]; then
            cp ./src/tools/$tool/.env.sample ./src/tools/$tool/.env
            echo "# File automatically generated on $(date)" >> ./src/tools/$tool/.env
            echo "# See .env.sample for more information" >> ./src/tools/$tool/.env
        fi

        # Create .env.docker file if it doesn't exist
        if [ ! -f ./src/tools/$tool/.env.docker ]; then
            cp ./src/tools/$tool/.env.sample ./src/tools/$tool/.env.docker
            echo "# File automatically generated on $(date)" >> ./src/tools/$tool/.env.docker
            echo "# See .env.sample for more information" >> ./src/tools/$tool/.env.docker
        fi

        # Install dependencies for the tool service
        echo ">> Installing dependencies for $tool service..."
        if [ ! -d ./src/tools/$tool/node_modules ]; then
            npm ci --prefix=./src/tools/$tool
        else
            echo "Dependencies for $tool service already installed."
        fi
    else
        echo "No .env.sample found for $tool, skipping..."
    fi
done

#  only build docker compose, do not start the containers yet
echo ">> Building MCP servers with Docker Compose..."
docker compose -f src/docker-compose.yml up --build -d $(echo $tools | sed 's/\([^ ]*\)/tool-\1/g')