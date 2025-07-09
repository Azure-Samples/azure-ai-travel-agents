# Install dependencies for the API service
Write-Host '>> Installing dependencies for the API service...'
$nodeModules = './src/api/node_modules'
if (-not (Test-Path $nodeModules)) {
    Write-Host 'Installing dependencies for the API service...'
    npm ci --prefix=src/api --legacy-peer-deps
} else {
    Write-Host 'Dependencies for the API service already installed.'
}
