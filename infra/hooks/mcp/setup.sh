#!/bin/bash

# This script builds and sets up the MCP containers.

##########################################################################
# MCP Tools
##########################################################################
tools="echo-ping customer-query destination-recommendation itinerary-planning code-evaluation model-inference web-search"
printf ">> Creating .env file for the MCP servers...\n"

#  for each tool copy the .env.sample (if it exists) to .env and .env.docker (dont overwrite existing .env files)
for tool in $tools; do
    if [ -f ./packages/tools/$tool/.env.sample ]; then
        printf "Creating .env file for $tool...\n"
        if [ ! -f ./packages/tools/$tool/.env ]; then
            cp ./packages/tools/$tool/.env.sample ./packages/tools/$tool/.env
            printf "# File automatically generated on $(date)\n" >> ./packages/tools/$tool/.env
            printf "# See .env.sample for more information\n" >> ./packages/tools/$tool/.env
        fi

        # Create .env.docker file if it doesn't exist
        if [ ! -f ./packages/tools/$tool/.env.docker ]; then
            cp ./packages/tools/$tool/.env.sample ./packages/tools/$tool/.env.docker
            printf "# File automatically generated on $(date)\n" >> ./packages/tools/$tool/.env.docker
            printf "# See .env.sample for more information\n" >> ./packages/tools/$tool/.env.docker
        fi
    else
        printf "No .env.sample found for $tool, skipping...\n"
    fi
done

# Check if we're running in an azd deployment context
if [ -z "$AZURE_ENV_NAME" ]; then
    # Local development - build Docker Compose services
    printf ">> Local development detected. Building MCP servers with Docker Compose...\n"
    
    if command -v docker &> /dev/null; then
        docker compose -f ./packages/docker-compose.yml up --build -d $(echo $tools | sed 's/\([^ ]*\)/tool-\1/g') || {
            printf "   Warning: Failed to build Docker Compose services.\n"
            printf "   You may need to run 'docker compose up' manually.\n"
        }
    else
        printf "   Docker not found. Skipping Docker Compose build.\n"
    fi
else
    printf ">> Azure deployment detected (AZURE_ENV_NAME=$AZURE_ENV_NAME).\n"
    printf "   Skipping Docker Compose build.\n"
    printf "   MCP server containers will be built and deployed by 'azd deploy'.\n"
fi

printf ">> MCP tools setup completed.\n"