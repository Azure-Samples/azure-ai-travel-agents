# This script is executed after the Azure Developer CLI (azd) provisioning step
# It sets up the environment for the AI Travel Agents application, including creating .env files,
# installing dependencies, and preparing the MCP tools.

# Note: this script is executed at the root of the project directory

Write-Host "Running post-deployment script for AI Travel Agents application..."

##########################################################################
# API
##########################################################################

Write-Host ">> Creating .env file for the API service..."
$apiEnvPath = "./src/api/.env"
if (-not (Test-Path $apiEnvPath)) {
    "# File automatically generated on $(Get-Date)" | Out-File $apiEnvPath
    "# See .env.sample for more information" | Add-Content $apiEnvPath
    "" | Add-Content $apiEnvPath
    $AZURE_OPENAI_ENDPOINT = azd env get-value AZURE_OPENAI_ENDPOINT | Out-String | ForEach-Object { $_.Trim() }
    "AZURE_OPENAI_ENDPOINT=$AZURE_OPENAI_ENDPOINT" | Add-Content $apiEnvPath
    "" | Add-Content $apiEnvPath
    "LLM_PROVIDER=azure-openai" | Add-Content $apiEnvPath
    "" | Add-Content $apiEnvPath
    "AZURE_OPENAI_DEPLOYMENT=gpt-4o-mini" | Add-Content $apiEnvPath
    "" | Add-Content $apiEnvPath
    "MCP_CUSTOMER_QUERY_URL=http://localhost:8080" | Add-Content $apiEnvPath
    "MCP_DESTINATION_RECOMMENDATION_URL=http://localhost:5002" | Add-Content $apiEnvPath
    "MCP_ITINERARY_PLANNING_URL=http://localhost:5003" | Add-Content $apiEnvPath
    "MCP_CODE_EVALUATION_URL=http://localhost:5004" | Add-Content $apiEnvPath
    "MCP_MODEL_INFERENCE_URL=http://localhost:5005" | Add-Content $apiEnvPath
    "MCP_WEB_SEARCH_URL=http://localhost:5006" | Add-Content $apiEnvPath
    "MCP_ECHO_PING_URL=http://localhost:5007" | Add-Content $apiEnvPath
    "MCP_ECHO_PING_ACCESS_TOKEN=123-this-is-a-fake-token-please-use-a-token-provider" | Add-Content $apiEnvPath
    "" | Add-Content $apiEnvPath
    "OTEL_SERVICE_NAME=api" | Add-Content $apiEnvPath
    "OTEL_EXPORTER_OTLP_ENDPOINT=http://aspire-dashboard:18889" | Add-Content $apiEnvPath
    "OTEL_EXPORTER_OTLP_HEADERS=header-value" | Add-Content $apiEnvPath
}

# Set overrides for docker environment
$apiEnvDockerPath = "./src/api/.env.docker"
if (-not (Test-Path $apiEnvDockerPath)) {
    "# File automatically generated on $(Get-Date)" | Out-File $apiEnvDockerPath
    "# See .env.sample for more information" | Add-Content $apiEnvDockerPath
    "" | Add-Content $apiEnvDockerPath
    "MCP_CUSTOMER_QUERY_URL=http://tool-customer-query:8080" | Add-Content $apiEnvDockerPath
    "MCP_DESTINATION_RECOMMENDATION_URL=http://tool-destination-recommendation:5002" | Add-Content $apiEnvDockerPath
    "MCP_ITINERARY_PLANNING_URL=http://tool-itinerary-planning:5003" | Add-Content $apiEnvDockerPath
    "MCP_CODE_EVALUATION_URL=http://tool-code-evaluation:5004" | Add-Content $apiEnvDockerPath
    "MCP_MODEL_INFERENCE_URL=http://tool-model-inference:5005" | Add-Content $apiEnvDockerPath
    "MCP_WEB_SEARCH_URL=http://tool-web-search:5006" | Add-Content $apiEnvDockerPath
    "MCP_ECHO_PING_URL=http://tool-echo-ping:5007" | Add-Content $apiEnvDockerPath
}

# Install dependencies for the API service
Write-Host ">> Installing dependencies for the API service..."
if (-not (Test-Path "./src/api/node_modules")) {
    Write-Host "Installing dependencies for the API service..."
    npm ci --prefix=src/api --legacy-peer-deps
} else {
    Write-Host "Dependencies for the API service already installed."
}

##########################################################################
# UI
##########################################################################

Write-Host ">> Creating .env file for the UI service..."
$uiEnvPath = "./src/ui/.env"
if (-not (Test-Path $uiEnvPath)) {
    "# File automatically generated on $(Get-Date)" | Out-File $uiEnvPath
    "# See .env.sample for more information" | Add-Content $uiEnvPath
    "" | Add-Content $uiEnvPath
    $NG_API_URL = azd env get-value NG_API_URL | Out-String | ForEach-Object { $_.Trim() }
    "NG_API_URL=http://localhost:4000" | Add-Content $uiEnvPath
    "" | Add-Content $uiEnvPath
    "# Uncomment the following line to use the provisioned endpoint for the API" | Add-Content $uiEnvPath
    "# NG_API_URL=$NG_API_URL" | Add-Content $uiEnvPath
}

# Install dependencies for the UI service
Write-Host ">> Installing dependencies for the UI service..."
if (-not (Test-Path "./src/ui/node_modules")) {
    Write-Host "Installing dependencies for the UI service..."
    npm ci --prefix=src/ui
} else {
    Write-Host "Dependencies for the UI service already installed."
}

##########################################################################
# MCP Tools
##########################################################################
$tools = @('echo-ping', 'customer-query', 'destination-recommendation', 'itinerary-planning', 'code-evaluation', 'model-inference', 'web-search')
Write-Host ">> Creating .env file for the MCP servers..."

foreach ($tool in $tools) {
    $toolPath = "./src/tools/$tool"
    $envSample = "$toolPath/.env.sample"
    $envFile = "$toolPath/.env"
    $envDockerFile = "$toolPath/.env.docker"
    if (Test-Path $envSample) {
        Write-Host "Creating .env file for $tool..."
        if (-not (Test-Path $envFile)) {
            Copy-Item $envSample $envFile
            "# File automatically generated on $(Get-Date)" | Add-Content $envFile
            "# See .env.sample for more information" | Add-Content $envFile
        }
        if (-not (Test-Path $envDockerFile)) {
            Copy-Item $envSample $envDockerFile
            "# File automatically generated on $(Get-Date)" | Add-Content $envDockerFile
            "# See .env.sample for more information" | Add-Content $envDockerFile
        }
        # Install dependencies for the tool service
        Write-Host ">> Installing dependencies for $tool service..."
        if (-not (Test-Path "$toolPath/node_modules")) {
            npm ci --prefix=$toolPath
        } else {
            Write-Host "Dependencies for $tool service already installed."
        }
    } else {
        Write-Host "No .env.sample found for $tool, skipping..."
    }
}

# Enable Docker Desktop Model Runner
docker desktop enable model-runner --tcp 12434

# Only build docker compose, do not start the containers yet
Write-Host ">> Building MCP servers with Docker Compose..."
$toolServices = $tools | ForEach-Object { "tool-$_" } | Join-String -Separator ' '
docker compose -f src/docker-compose.yml up --build -d $toolServices