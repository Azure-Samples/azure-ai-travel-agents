#!/bin/bash

# This script is used to run the AI Travel Agents application.
# Ensure that you have the necessary permissions to execute this script.

echo "Starting the AI Travel Agents application..."

cd src

# Start the application
docker-compose up --build
