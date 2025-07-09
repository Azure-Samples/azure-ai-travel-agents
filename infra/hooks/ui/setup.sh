#! /bin/bash

# Install dependencies for the UI service
printf ">> Installing dependencies for the UI service...\n"
if [ ! -d ./src/ui/node_modules ]; then
    printf "Installing dependencies for the UI service...\n"
    npm ci --prefix=src/ui
    status=$?
    if [ $status -ne 0 ]; then
        printf "UI dependencies installation failed with exit code $status. Exiting.\n"
        exit $status
    fi
else
    printf "Dependencies for the UI service already installed.\n"
fi