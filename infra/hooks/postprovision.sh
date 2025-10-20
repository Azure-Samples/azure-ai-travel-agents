#!/bin/bash

## This script is executed after the Azure Developer CLI (azd) provisioning step
# It sets up the environment for the AI Travel Agents application, including creating .env files,
# installing dependencies, and preparing the MCP tools.

# Note: this script is executed at the root of the project directory

echo "Running post-deployment script for AI Travel Agents application..."

##########################################################################
# API Services (LangChain.js, LlamaIndex.TS, MAF Python)
##########################################################################

echo ">> Creating .env files for API services..."

# Get shared Azure OpenAI endpoint
AZURE_OPENAI_ENDPOINT=$(azd env get-value AZURE_OPENAI_ENDPOINT)

# Function to create API .env file
create_api_env_file() {
    local api_path=$1
    local service_name=$2
    local port=$3
    
    if [ ! -f "$api_path/.env" ]; then
        echo "# File automatically generated on $(date)" > "$api_path/.env"
        echo "# See .env.sample for more information" >> "$api_path/.env"
        echo "" >> "$api_path/.env"
        echo "AZURE_OPENAI_ENDPOINT=\"$AZURE_OPENAI_ENDPOINT\"" >> "$api_path/.env"
        echo "" >> "$api_path/.env"
        echo "LLM_PROVIDER=azure-openai" >> "$api_path/.env"
        echo "" >> "$api_path/.env"
        echo "AZURE_OPENAI_DEPLOYMENT=gpt-5" >> "$api_path/.env"
        echo "" >> "$api_path/.env"
        echo "MCP_CUSTOMER_QUERY_URL=http://localhost:8080" >> "$api_path/.env"
        echo "MCP_DESTINATION_RECOMMENDATION_URL=http://localhost:5002" >> "$api_path/.env"
        echo "MCP_ITINERARY_PLANNING_URL=http://localhost:5003" >> "$api_path/.env"
        echo "MCP_ECHO_PING_URL=http://localhost:5004" >> "$api_path/.env"
        echo "MCP_ECHO_PING_ACCESS_TOKEN=123-this-is-a-fake-token-please-use-a-token-provider" >> "$api_path/.env"
        echo "" >> "$api_path/.env"
        echo "PORT=$port" >> "$api_path/.env"
        echo "" >> "$api_path/.env"
        echo "OTEL_SERVICE_NAME=$service_name" >> "$api_path/.env"
        echo "OTEL_EXPORTER_OTLP_ENDPOINT=http://aspire-dashboard:18889" >> "$api_path/.env"
        echo "OTEL_EXPORTER_OTLP_HEADERS=header-value" >> "$api_path/.env"
        echo "Created .env file for $service_name"
    fi
    
    # Set overrides for docker environment
    if [ ! -f "$api_path/.env.docker" ]; then
        echo "# File automatically generated on $(date)" > "$api_path/.env.docker"
        echo "# See .env.sample for more information" >> "$api_path/.env.docker"
        echo "" >> "$api_path/.env.docker"
        echo "MCP_CUSTOMER_QUERY_URL=http://customer-query:8080" >> "$api_path/.env.docker"
        echo "MCP_DESTINATION_RECOMMENDATION_URL=http://destination-recommendation:5002" >> "$api_path/.env.docker"
        echo "MCP_ITINERARY_PLANNING_URL=http://itinerary-planning:5003" >> "$api_path/.env.docker"
        echo "MCP_ECHO_PING_URL=http://echo-ping:5004" >> "$api_path/.env.docker"
        echo "Created .env.docker file for $service_name"
    fi
}

# Create .env files for all API orchestrators
create_api_env_file "./packages/api-langchain-js" "api-langchain-js" "4000"
create_api_env_file "./packages/api-llamaindex-ts" "api-llamaindex-ts" "4000"
create_api_env_file "./packages/api-maf-python" "api-maf-python" "8000"

# Install dependencies for TypeScript API services
for service in "api-langchain-js" "api-llamaindex-ts"; do
    echo ">> Installing dependencies for $service service..."
    if [ ! -d "./packages/$service/node_modules" ]; then
        echo "Installing dependencies for $service service..."
        npm ci --prefix=./packages/$service --legacy-peer-deps
    else
        echo "Dependencies for $service service already installed."
    fi
done

##########################################################################
# UI (Angular)
##########################################################################

echo ">> Creating .env file for the UI service..."
if [ ! -f ./packages/ui-angular/.env ]; then
    echo "# File automatically generated on $(date)" > ./packages/ui-angular/.env
    echo "# See .env.sample for more information" >> ./packages/ui-angular/.env
    echo "" >> ./packages/ui-angular/.env
    
    # Get provisioned API URLs (if available)
    NG_API_URL_LANGCHAIN_JS=$(azd env get-value NG_API_URL_LANGCHAIN_JS 2>/dev/null || echo "")
    NG_API_URL_LLAMAINDEX_TS=$(azd env get-value NG_API_URL_LLAMAINDEX_TS 2>/dev/null || echo "")
    NG_API_URL_MAF_PYTHON=$(azd env get-value NG_API_URL_MAF_PYTHON 2>/dev/null || echo "")

    echo "# LangChain.js: $NG_API_URL_LANGCHAIN_JS" >> ./packages/ui-angular/.env
    echo "" >> ./packages/ui-angular/.env
    echo "# Available provisioned API endpoints:" >> ./packages/ui-angular/.env
    [ -n "$NG_API_URL_LLAMAINDEX_TS" ] && echo "# LlamaIndex.TS: $NG_API_URL_LLAMAINDEX_TS" >> ./packages/ui-angular/.env
    [ -n "$NG_API_URL_MAF_PYTHON" ] && echo "# MAF Python: $NG_API_URL_MAF_PYTHON" >> ./packages/ui-angular/.env
fi

# Install dependencies for the UI service
echo ">> Installing dependencies for the UI service..."
if [ ! -d ./packages/ui-angular/node_modules ]; then
    echo "Installing dependencies for the UI service..."
    npm ci --prefix=./packages/ui-angular
else
    echo "Dependencies for the UI service already installed."
fi

##########################################################################
# MCP Tools
##########################################################################

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