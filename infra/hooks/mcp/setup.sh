#!/bin/bash

# This script builds and sets up the MCP containers.

##########################################################################
# MCP Tools
##########################################################################
tools="echo-ping customer-query destination-recommendation itinerary-planning"
printf ">> Creating .env file for the MCP servers...\n"

#  for each tool copy the .env.sample (if it exists) to .env and .env.docker (dont overwrite existing .env files)
for tool in $tools; do
    if [ -f ./packages/mcp-servers/$tool/.env.sample ]; then
        printf "Creating .env file for $tool...\n"
        if [ ! -f ./packages/mcp-servers/$tool/.env ]; then
            cp ./packages/mcp-servers/$tool/.env.sample ./packages/mcp-servers/$tool/.env
            printf "# File automatically generated on $(date)\n" >> ./packages/mcp-servers/$tool/.env
            printf "# See .env.sample for more information\n" >> ./packages/mcp-servers/$tool/.env
        fi

        # Create .env.docker file if it doesn't exist
        if [ ! -f ./packages/mcp-servers/$tool/.env.docker ]; then
            cp ./packages/mcp-servers/$tool/.env.sample ./packages/mcp-servers/$tool/.env.docker
            printf "# File automatically generated on $(date)\n" >> ./packages/mcp-servers/$tool/.env.docker
            printf "# See .env.sample for more information\n" >> ./packages/mcp-servers/$tool/.env.docker
        fi
    else
        printf "No .env.sample found for $tool, skipping...\n"
    fi
done

#  only build docker compose, do not start the containers yet
printf ">> Building MCP servers with Docker Compose...\n"

# Transform tool names to Docker Compose service names with mcp- prefix
compose_services=""
for tool in $tools; do
    compose_services="$compose_services mcp-$tool"
done
compose_services=$(echo $compose_services | xargs) # trim leading/trailing whitespace

docker compose -f docker-compose.yml up --build -d $compose_services
