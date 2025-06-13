# This script builds and sets up the MCP containers for Windows PowerShell.

##########################################################################
# MCP Tools
##########################################################################
$tools = @('echo-ping', 'customer-query', 'destination-recommendation', 'itinerary-planning', 'code-evaluation', 'model-inference', 'web-search')
Write-Host '>> Creating .env file for the MCP servers...'

foreach ($tool in $tools) {
    $envSample = "./src/tools/$tool/.env.sample"
    $envFile = "./src/tools/$tool/.env"
    $envDockerFile = "./src/tools/$tool/.env.docker"
    if (Test-Path $envSample) {
        Write-Host "Creating .env file for $tool..."
        if (-not (Test-Path $envFile)) {
            Copy-Item $envSample $envFile
            Add-Content $envFile "# File automatically generated on $(Get-Date)"
            Add-Content $envFile "# See .env.sample for more information"
        }
        if (-not (Test-Path $envDockerFile)) {
            Copy-Item $envSample $envDockerFile
            Add-Content $envDockerFile "# File automatically generated on $(Get-Date)"
            Add-Content $envDockerFile "# See .env.sample for more information"
        }
        # Install dependencies for the tool service
        Write-Host ">> Installing dependencies for $tool service..."
        $nodeModules = "./src/tools/$tool/node_modules"
        if (-not (Test-Path $nodeModules)) {
            npm ci --prefix=./src/tools/$tool
        } else {
            Write-Host "Dependencies for $tool service already installed."
        }
    } else {
        Write-Host "No .env.sample found for $tool, skipping..."
    }
}

# Enable Docker Desktop Model Runner
Write-Host 'Enabling Docker Desktop Model Runner...'
docker desktop enable model-runner --tcp 12434
docker model pull ai/phi4:14B-Q4_0

# Only build docker compose, do not start the containers yet
Write-Host '>> Building MCP servers with Docker Compose...'
$composeServices = $tools | ForEach-Object { "tool-$_" } | Join-String ' '
docker compose -f src/docker-compose.yml up --build -d $composeServices
