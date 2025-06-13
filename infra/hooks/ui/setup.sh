#! /bin/bash

# Install dependencies for the UI service
echo ">> Installing dependencies for the UI service..."
if [ ! -d ./src/ui/node_modules ]; then
    echo "Installing dependencies for the UI service..."
    npm ci --prefix=src/ui
    status=$?
    if [ $status -ne 0 ]; then
        echo "UI dependencies installation failed with exit code $status. Exiting."
        exit $status
    fi
else
    echo "Dependencies for the UI service already installed."
fi