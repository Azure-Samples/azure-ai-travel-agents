#!/bin/bash

# This script is used to run the AI Travel Agents application.
# Ensure that you have the necessary permissions to execute this script.

echo "Starting the AI Travel Agents application..."

cd src

# Start the application
docker compose up --build -d tool-customer-query tool-destination-recommendation tool-itinerary-planning tool-code-evaluation tool-model-inference tool-web-search
