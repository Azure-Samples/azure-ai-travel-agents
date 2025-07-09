# Install dependencies for the UI service
Write-Host '>> Installing dependencies for the UI service...'
$nodeModules = './src/ui/node_modules'
if (-not (Test-Path $nodeModules)) {
    Write-Host 'Installing dependencies for the UI service...'
    npm ci --prefix=src/ui
} else {
    Write-Host 'Dependencies for the UI service already installed.'
}
