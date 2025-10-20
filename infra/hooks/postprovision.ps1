# This script is executed after the Azure Developer CLI (azd) provisioning step
# It sets up the environment for the AI Travel Agents application, including creating .env files,
# installing dependencies, and preparing the MCP tools.

# Note: this script is executed at the root of the project directory

Write-Host "Running post-deployment script for AI Travel Agents application..."

##########################################################################
# API Services (LangChain.js, LlamaIndex.TS, MAF Python)
##########################################################################

Write-Host ">> Creating .env files for API services..."

# Get shared Azure OpenAI endpoint
$AZURE_OPENAI_ENDPOINT = azd env get-value AZURE_OPENAI_ENDPOINT | Out-String | ForEach-Object { $_.Trim() }

# Function to create API .env file
function Create-ApiEnvFile {
    param(
        [string]$ApiPath,
        [string]$ServiceName,
        [int]$Port = 4000
    )
    
    $apiEnvPath = "$ApiPath/.env"
    if (-not (Test-Path $apiEnvPath)) {
        "# File automatically generated on $(Get-Date)" | Out-File $apiEnvPath
        "# See .env.sample for more information" | Add-Content $apiEnvPath
        "" | Add-Content $apiEnvPath
        "AZURE_OPENAI_ENDPOINT=$AZURE_OPENAI_ENDPOINT" | Add-Content $apiEnvPath
        "" | Add-Content $apiEnvPath
        "LLM_PROVIDER=azure-openai" | Add-Content $apiEnvPath
        "" | Add-Content $apiEnvPath
        "AZURE_OPENAI_DEPLOYMENT=gpt-5" | Add-Content $apiEnvPath
        "" | Add-Content $apiEnvPath
        "MCP_CUSTOMER_QUERY_URL=http://localhost:8080" | Add-Content $apiEnvPath
        "MCP_DESTINATION_RECOMMENDATION_URL=http://localhost:5002" | Add-Content $apiEnvPath
        "MCP_ITINERARY_PLANNING_URL=http://localhost:5003" | Add-Content $apiEnvPath
        "MCP_ECHO_PING_URL=http://localhost:5004" | Add-Content $apiEnvPath
        "MCP_ECHO_PING_ACCESS_TOKEN=123-this-is-a-fake-token-please-use-a-token-provider" | Add-Content $apiEnvPath
        "" | Add-Content $apiEnvPath
        "PORT=$Port" | Add-Content $apiEnvPath
        "" | Add-Content $apiEnvPath
        "OTEL_SERVICE_NAME=$ServiceName" | Add-Content $apiEnvPath
        "OTEL_EXPORTER_OTLP_ENDPOINT=http://aspire-dashboard:18889" | Add-Content $apiEnvPath
        "OTEL_EXPORTER_OTLP_HEADERS=header-value" | Add-Content $apiEnvPath
        Write-Host "Created .env file for $ServiceName"
    }
    
    # Set overrides for docker environment
    $apiEnvDockerPath = "$ApiPath/.env.docker"
    if (-not (Test-Path $apiEnvDockerPath)) {
        "# File automatically generated on $(Get-Date)" | Out-File $apiEnvDockerPath
        "# See .env.sample for more information" | Add-Content $apiEnvDockerPath
        "" | Add-Content $apiEnvDockerPath
        "MCP_CUSTOMER_QUERY_URL=http://customer-query:8080" | Add-Content $apiEnvDockerPath
        "MCP_DESTINATION_RECOMMENDATION_URL=http://destination-recommendation:5002" | Add-Content $apiEnvDockerPath
        "MCP_ITINERARY_PLANNING_URL=http://itinerary-planning:5003" | Add-Content $apiEnvDockerPath
        "MCP_ECHO_PING_URL=http://echo-ping:5004" | Add-Content $apiEnvDockerPath
        Write-Host "Created .env.docker file for $ServiceName"
    }
}

# Create .env files for all API orchestrators
Create-ApiEnvFile -ApiPath "./packages/api-langchain-js" -ServiceName "api-langchain-js" -Port 4000
Create-ApiEnvFile -ApiPath "./packages/api-llamaindex-ts" -ServiceName "api-llamaindex-ts" -Port 4000
Create-ApiEnvFile -ApiPath "./packages/api-maf-python" -ServiceName "api-maf-python" -Port 8000

# Install dependencies for TypeScript API services
$tsApiServices = @("api-langchain-js", "api-llamaindex-ts")
foreach ($service in $tsApiServices) {
    Write-Host ">> Installing dependencies for $service service..."
    if (-not (Test-Path "./packages/$service/node_modules")) {
        Write-Host "Installing dependencies for $service service..."
        npm ci --prefix=./packages/$service --legacy-peer-deps
    } else {
        Write-Host "Dependencies for $service service already installed."
    }
}

##########################################################################
# UI (Angular)
##########################################################################

Write-Host ">> Creating .env file for the UI service..."
$uiEnvPath = "./packages/ui-angular/.env"
if (-not (Test-Path $uiEnvPath)) {
    "# File automatically generated on $(Get-Date)" | Out-File $uiEnvPath
    "# See .env.sample for more information" | Add-Content $uiEnvPath
    "" | Add-Content $uiEnvPath
    
    # Get provisioned API URLs (if available)
    try {
        $NG_API_URL_LANGCHAIN_JS = azd env get-value NG_API_URL_LANGCHAIN_JS 2>$null | Out-String | ForEach-Object { $_.Trim() }
        $NG_API_URL_LLAMAINDEX_TS = azd env get-value NG_API_URL_LLAMAINDEX_TS 2>$null | Out-String | ForEach-Object { $_.Trim() }
        $NG_API_URL_MAF_PYTHON = azd env get-value NG_API_URL_MAF_PYTHON 2>$null | Out-String | ForEach-Object { $_.Trim() }
    } catch {
        # Ignore errors if env values don't exist yet
    }
    
    "LangChain.js: $NG_API_URL_LANGCHAIN_JS" | Add-Content $uiEnvPath
    "" | Add-Content $uiEnvPath
    "# Available provisioned API endpoints:" | Add-Content $uiEnvPath
    if ($NG_API_URL_LLAMAINDEX_TS) {
        "# LlamaIndex.TS: $NG_API_URL_LLAMAINDEX_TS" | Add-Content $uiEnvPath
    }
    if ($NG_API_URL_MAF_PYTHON) {
        "# MAF Python: $NG_API_URL_MAF_PYTHON" | Add-Content $uiEnvPath
    }
}

# Install dependencies for the UI service
Write-Host ">> Installing dependencies for the UI service..."
if (-not (Test-Path "./packages/ui-angular/node_modules")) {
    Write-Host "Installing dependencies for the UI service..."
    npm ci --prefix=./packages/ui-angular
} else {
    Write-Host "Dependencies for the UI service already installed."
}

##########################################################################
# MCP Tools
##########################################################################
$tools = @('echo-ping', 'customer-query', 'destination-recommendation', 'itinerary-planning')
Write-Host ">> Creating .env file for the MCP servers..."

foreach ($tool in $tools) {
    $toolPath = "./packages/mcp-servers/$tool"
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
$toolServices = $tools | Join-String -Separator ' '
docker compose -f docker-compose.yml up --build -d $toolServices