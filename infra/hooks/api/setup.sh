#! /bin/bash

# Install dependencies for the API service
echo ">> Installing dependencies for the API service..."
if [ ! -d ./src/api/node_modules ]; then
    echo "Installing dependencies for the API service..."
    npm ci --prefix=src/api --legacy-peer-deps 
    status=$?
    if [ $status -ne 0 ]; then
        echo "API dependencies installation failed with exit code $status. Exiting."
        exit $status
    fi
else
    echo "Dependencies for the API service already installed."
fi
