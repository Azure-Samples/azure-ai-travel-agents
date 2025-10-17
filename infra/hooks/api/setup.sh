#! /bin/bash

# Install dependencies for the API service
printf ">> Installing dependencies for the API service...\n"
if [ ! -d ./packages/api/node_modules ]; then
    printf "Installing dependencies for the API service...\n"
    npm ci --prefix=./packages/api --legacy-peer-deps
    status=$?
    if [ $status -ne 0 ]; then
        printf "API dependencies installation failed with exit code $status. Exiting.\n"
        exit $status
    fi
else
    printf "Dependencies for the API service already installed.\n"
fi

# Check if we're running in an azd deployment context
# azd sets AZURE_ENV_NAME when running provision/deploy commands
if [ -z "$AZURE_ENV_NAME" ]; then
    # Local development setup - enable Docker Desktop Model Runner
    printf ">> Local development detected. Setting up Docker Desktop Model Runner...\n"
    
    # Check if docker desktop is available
    if command -v docker &> /dev/null; then
        printf ">> Enabling Docker Desktop Model Runner...\n"
        docker desktop enable model-runner 2>/dev/null || {
            printf "   Warning: Failed to enable Docker Desktop Model Runner.\n"
            printf "   This is optional for local development. You can enable it manually.\n"
        }
        
        printf ">> Pulling Docker model...\n"
        docker model pull ai/phi4:14B-Q4_0 2>/dev/null || {
            printf "   Warning: Failed to pull Docker model.\n"
            printf "   This is optional for local development. You can pull it manually.\n"
        }
    else
        printf "   Docker not found. Skipping Docker Desktop Model Runner setup.\n"
        printf "   Install Docker Desktop to use local LLM models.\n"
    fi
else
    printf ">> Azure deployment detected (AZURE_ENV_NAME=$AZURE_ENV_NAME).\n"
    printf "   Skipping Docker Desktop Model Runner setup.\n"
    printf "   Container images will be built and deployed by 'azd deploy'.\n"
fi

printf ">> API setup completed.\n"

