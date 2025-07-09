#! /bin/bash

# Install dependencies for the API service
printf ">> Installing dependencies for the API service...\n"
if [ ! -d ./src/api/node_modules ]; then
    printf "Installing dependencies for the API service...\n"
    npm ci --prefix=src/api --legacy-peer-deps
    status=$?
    if [ $status -ne 0 ]; then
        printf "API dependencies installation failed with exit code $status. Exiting.\n"
        exit $status
    fi
else
    printf "Dependencies for the API service already installed.\n"
fi

# Enable Docker Desktop Model Runner
printf ">> Enabling Docker Desktop Model Runner...\n"
docker desktop enable model-runner --tcp 12434

printf ">> Pulling Docker model...\n"
docker model pull ai/phi4:14B-Q4_0
