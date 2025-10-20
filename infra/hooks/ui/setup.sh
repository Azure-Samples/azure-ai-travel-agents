#! /bin/bash

# Install dependencies for the UI service
printf ">> Installing dependencies for the UI (Angular) service...\n"
if [ ! -d ./packages/ui-angular/node_modules ]; then
    printf "Installing dependencies for the UI service...\n"
    npm ci --prefix=src/ui-angular
    status=$?
    if [ $status -ne 0 ]; then
        printf "UI dependencies installation failed with exit code $status. Exiting.\n"
        exit $status
    fi
else
    printf "Dependencies for the UI (Angular) service already installed.\n"
fi