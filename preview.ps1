#!/usr/bin/env pwsh
# This script builds, configures, and prepares the environment for running the AI Travel Agents applications on Windows.
# This script can be run directly via:
#   iex "& { $(irm https://aka.ms/azure-ai-travel-agents-preview-win) }"


& {
    $ErrorActionPreference = 'Stop'

    # Colors (ANSI escape codes, supported in Windows 10+)
    $RED    = "`e[0;31m"
    $GREEN  = "`e[0;32m"
    $YELLOW = "`e[1;33m"
    $BLUE   = "`e[0;34m"
    $CYAN   = "`e[0;36m"
    $BOLD   = "`e[1m"
    $NC     = "`e[0m" # No Color

    $CHECK = [char]0x2714  # ✔
    $CROSS = [char]0x274C  # ❌

    # Parse arguments for --skip-checks
    $SKIP_PREREQS = $false
    foreach ($arg in $args) {
        if ($arg -eq '--skip-checks') {
            $SKIP_PREREQS = $true
        }
    }

    if (-not $SKIP_PREREQS) {
        Write-Host ("{0}{1}Checking prerequisites...{2}" -f $BOLD, $BLUE, $NC)
        $MISSING = 0

        if (Get-Command git -ErrorAction SilentlyContinue) {
            $GIT_VERSION = git --version
            Write-Host ("{0}{1}  Git version: {2}{3}" -f $GREEN, $CHECK, $GIT_VERSION, $NC)
        } else {
            Write-Host ("{0}{1} Git is not installed. Please install Git (https://git-scm.com/){2}" -f $RED, $CROSS, $NC)
            $MISSING = 1
        }

        if (Get-Command node -ErrorAction SilentlyContinue) {
            $NODE_VERSION = node --version
            Write-Host ("{0}{1}  Node.js version: {2}{3}" -f $GREEN, $CHECK, $NODE_VERSION, $NC)
        } else {
            Write-Host ("{0}{1} Node.js is not installed. Please install Node.js (https://nodejs.org/){2}" -f $RED, $CROSS, $NC)
            $MISSING = 1
        }

        if (Get-Command npm -ErrorAction SilentlyContinue) {
            $NPM_VERSION = npm --version
            Write-Host ("{0}{1}  npm version: {2}{3}" -f $GREEN, $CHECK, $NPM_VERSION, $NC)
        } else {
            Write-Host ("{0}{1} npm is not installed. Please install npm (https://www.npmjs.com/){2}" -f $RED, $CROSS, $NC)
            $MISSING = 1
        }

        if (Get-Command docker -ErrorAction SilentlyContinue) {
            $DOCKER_VERSION = docker --version
            Write-Host ("{0}{1}  Docker version: {2}{3}" -f $GREEN, $CHECK, $DOCKER_VERSION, $NC)
        } else {
            Write-Host ("{0}{1} Docker is not installed. Please install Docker Desktop (https://www.docker.com/products/docker-desktop/){2}" -f $RED, $CROSS, $NC)
            $MISSING = 1
        }

        if ($MISSING -eq 1) {
            Write-Host ("`n{0}{1}One or more prerequisites are missing. Please install them and re-run this script.{2}" -f $RED, $BOLD, $NC)
            Write-Host "`nPress any key to exit..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            return
        } else {
            Write-Host ("{0} All prerequisites are installed.{1}" -f $GREEN, $NC)
        }
    } else {
        Write-Host ("{0}{1}Skipping prerequisite checks (--skip-prereqs flag set).{2}" -f $YELLOW, $BOLD, $NC)
    }

    # Step 0: If not running inside the repo, clone it and re-run the script from there
    $REPO_URL = "https://github.com/Azure-Samples/azure-ai-travel-agents.git"
    $REPO_DIR = "azure-ai-travel-agents"

    if (!(Test-Path .git) -or !(Test-Path preview.ps1)) {
        Write-Host ("{0}Cloning Azure AI Travel Agents repository...{1}" -f $CYAN, $NC)
        git clone $REPO_URL
        Set-Location $REPO_DIR
        & pwsh preview.ps1 --skip-checks @args
        return
    }

    # Step 1: Setup API dependencies
    if (Test-Path ./infra/hooks/api/setup.ps1) {
        Write-Host ("{0}>> Running API setup...{1}" -f $CYAN, $NC)
        & pwsh ./infra/hooks/api/setup.ps1
        $api_status = $LASTEXITCODE
        if ($api_status -ne 0) {
            Write-Host ("{0}{1}API setup failed with exit code $api_status. Stopping.{2}" -f $RED, $BOLD, $NC)
            return
        }
    } else {
        Write-Host ("{0}API setup script not found, skipping.{1}" -f $YELLOW, $NC)
    }

    # Step 1.5: Create .env file for the user
    if (!(Test-Path -Path ./src/api)) {
        New-Item -ItemType Directory -Path ./src/api | Out-Null
    }
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
    Set-Content -Path ./src/api/.env -Value $envContent -Encoding UTF8
    Write-Host ("{0}{1}.env file created in src/api/.env.{2}" -f $GREEN, $BOLD, $NC)

    # Step 2: Setup UI dependencies
    if (Test-Path ./infra/hooks/ui/setup.ps1) {
        Write-Host ("{0}>> Running UI setup...{1}" -f $CYAN, $NC)
        & pwsh ./infra/hooks/ui/setup.ps1
        $ui_status = $LASTEXITCODE
        if ($ui_status -ne 0) {
            Write-Host ("{0}{1}UI setup failed with exit code $ui_status. Stopping.{2}" -f $RED, $BOLD, $NC)
            return
        }
    } else {
        Write-Host ("{0}UI setup script not found, skipping.{1}" -f $YELLOW, $NC)
    }

    # Step 2.5: Create .env file for the UI
    $uiEnvContent = @"
NG_API_URL=http://localhost:4000
"@
    Set-Content -Path ./src/ui/.env -Value $uiEnvContent -Encoding UTF8
    Write-Host ("{0}{1}.env file created in src/ui/.env.{2}" -f $GREEN, $BOLD, $NC)

    # Step 3: Setup MCP tools (env, dependencies, docker build)
    if (Test-Path ./infra/hooks/mcp/setup.ps1) {
        Write-Host ("{0}>> Running MCP tools setup...{1}" -f $CYAN, $NC)
        & pwsh ./infra/hooks/mcp/setup.ps1
        $mcp_status = $LASTEXITCODE
        if ($mcp_status -ne 0) {
            Write-Host ("{0}{1}MCP tools setup failed with exit code $mcp_status. Stopping.{2}" -f $RED, $BOLD, $NC)
            return
        }
    } else {
        Write-Host ("{0}MCP tools setup script not found, skipping.{1}" -f $YELLOW, $NC)
    }

    # Step 4: Print next steps
    Write-Host ("\n{0}{1}========================================{2}" -f $GREEN, $BOLD, $NC)
    Write-Host ("{0}{1}Local environment is ready!{2}" -f $GREEN, $BOLD, $NC)
    Write-Host ("{0}To run the API service, use:{1}" -f $BLUE, $NC)
    Write-Host ("  {0}npm start --prefix ./src/api{1}" -f $BOLD, $NC)
    Write-Host ("{0}To run the UI service, open a new terminal and use:{1}" -f $BLUE, $NC)
    Write-Host ("  {0}npm start --prefix ./src/ui{1}" -f $BOLD, $NC)
    Write-Host ("{0}{1}========================================{2}" -f $GREEN, $BOLD, $NC)

    Write-Host "`nPress any key to close this window..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}