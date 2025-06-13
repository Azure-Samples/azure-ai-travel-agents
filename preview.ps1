# This script builds, configures, and prepares the environment for running the AI Travel Agents applications on Windows.
# This script can be run directly via:
#   irm https://raw.githubusercontent.com/Azure-Samples/azure-ai-travel-agents/main/preview.ps1 | pwsh

$ErrorActionPreference = 'Stop'

# Colors (ANSI escape codes, supported in Windows 10+)
$RED    = "`e[31m"
$GREEN  = "`e[32m"
$YELLOW = "`e[33m"
$BLUE   = "`e[34m"
$CYAN   = "`e[36m"
$BOLD   = "`e[1m"
$NC     = "`e[0m" # No Color

# If not running inside the repo, clone it and re-run the script from there
$REPO_URL = "https://github.com/Azure-Samples/azure-ai-travel-agents.git"
$REPO_DIR = "azure-ai-travel-agents"
if (!(Test-Path .git) -or !(Test-Path (Split-Path -Leaf $MyInvocation.MyCommand.Path))) {
    Write-Host ("{0}Cloning AI Travel Agents repository...{1}" -f $CYAN, $NC)
    git clone $REPO_URL
    Set-Location $REPO_DIR
    & pwsh preview.ps1 @args
    exit $LASTEXITCODE
}

# Unicode checkmark and cross
$CHECK = [char]0x2714  # ✔
$CROSS = [char]0x274C  # ❌

Write-Host ("{0}{1}Checking prerequisites...{2}" -f $BOLD, $BLUE, $NC)
$missing = $false

# Node.js
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host ("{0}{1} Node.js version: {2}{3}" -f $GREEN, $CHECK, $nodeVersion, $NC)
} else {
    Write-Host ("{0}{1} Node.js is not installed. Please install Node.js (https://nodejs.org/){2}" -f $RED, $CROSS, $NC)
    $missing = $true
}

# npm
if (Get-Command npm -ErrorAction SilentlyContinue) {
    $npmVersion = npm --version
    Write-Host ("{0}{1} npm version: {2}{3}" -f $GREEN, $CHECK, $npmVersion, $NC)
} else {
    Write-Host ("{0}{1} npm is not installed. Please install npm (https://www.npmjs.com/){2}" -f $RED, $CROSS, $NC)
    $missing = $true
}

# Docker
if (Get-Command docker -ErrorAction SilentlyContinue) {
    $dockerVersion = docker --version
    Write-Host ("{0}{1} Docker version: {2}{3}" -f $GREEN, $CHECK, $dockerVersion, $NC)
} else {
    Write-Host ("{0}{1} Docker is not installed. Please install Docker Desktop (https://www.docker.com/products/docker-desktop/){2}" -f $RED, $CROSS, $NC)
    $missing = $true
}

if ($missing) {
    Write-Host ("{0}{1}One or more prerequisites are missing. Please install them and re-run this script.{2}" -f $RED, $BOLD, $NC)
    exit 1
} else {
    Write-Host ("{0}All prerequisites are installed.{1}`n" -f $GREEN, $NC)
}

# Step 1: Setup API dependencies
if (Test-Path ./infra/hooks/api/setup.ps1) {
    Write-Host ("{0}>> Running API setup...{1}" -f $CYAN, $NC)
    & ./infra/hooks/api/setup.ps1
} else {
    Write-Host ("{0}API setup script not found, skipping.{1}" -f $YELLOW, $NC)
}

# Step 1.5: Create .env file for the user
$envContent = @"
LLM_PROVIDER=docker-models
DOCKER_MODEL_ENDPOINT=http://localhost:12434/engines/llama.cpp/v1
DOCKER_MODEL=ai/phi4:14B-Q4_0

MCP_CUSTOMER_QUERY_URL=http://localhost:8080
MCP_DESTINATION_RECOMMENDATION_URL=http://localhost:5002
MCP_ITINERARY_PLANNING_URL=http://localhost:5003
MCP_CODE_EVALUATION_URL=http://localhost:5004
MCP_MODEL_INFERENCE_URL=http://localhost:5005
MCP_WEB_SEARCH_URL=http://localhost:5006
MCP_ECHO_PING_URL=http://localhost:5007
MCP_ECHO_PING_ACCESS_TOKEN=123-this-is-a-fake-token-please-use-a-token-provider
"@
if (!(Test-Path -Path ./src/api)) {
    New-Item -ItemType Directory -Path ./src/api | Out-Null
}
Set-Content -Path ./src/api/.env -Value $envContent -Encoding UTF8
Write-Host ("{0}{1}.env file created in ./src/api/.env.{2}" -f $GREEN, $BOLD, $NC)

# Step 2: Setup UI dependencies
if (Test-Path ./infra/hooks/ui/setup.ps1) {
    Write-Host ("{0}>> Running UI setup...{1}" -f $CYAN, $NC)
    & ./infra/hooks/ui/setup.ps1
} else {
    Write-Host ("{0}UI setup script not found, skipping.{1}" -f $YELLOW, $NC)
}

# Step 2.5: Create .env file for the UI
$uiEnvContent = @"NG_API_URL=http://localhost:4000
"@
Set-Content -Path ./src/ui/.env -Value $uiEnvContent -Encoding UTF8
Write-Host ("{0}{1}.env file created in src/ui/.env.{2}" -f $GREEN, $BOLD, $NC)

# Step 3: Setup MCP tools (env, dependencies, docker build)
if (Test-Path ./infra/hooks/mcp/setup.ps1) {
    Write-Host ("{0}>> Running MCP tools setup...{1}" -f $CYAN, $NC)
    & ./infra/hooks/mcp/setup.ps1
} else {
    Write-Host ("{0}MCP tools setup script not found, skipping.{1}" -f $YELLOW, $NC)
}

# Step 4: Print next steps
Write-Host ("`n{0}{1}========================================{2}" -f $GREEN, $BOLD, $NC)
Write-Host ("{0}{1}Local environment is ready!{2}`n" -f $GREEN, $BOLD, $NC)
Write-Host ("{0}To run the API service, use:{1}" -f $BLUE, $NC)
Write-Host ("  {0}npm start --prefix ./src/api{1}`n" -f $BOLD, $NC)
Write-Host ("{0}To run the UI service, open a new terminal and use:{1}" -f $BLUE, $NC)
Write-Host ("  {0}npm start --prefix ./src/ui{1}`n" -f $BOLD, $NC)
Write-Host ("{0}{1}========================================{2}" -f $GREEN, $BOLD, $NC)
