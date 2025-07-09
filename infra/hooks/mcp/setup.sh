#!/bin/bash

# This script builds and sets up the MCP containers.

##########################################################################
# MCP Tools
##########################################################################
tools="echo-ping customer-query destination-recommendation itinerary-planning code-evaluation model-inference web-search"
printf ">> Creating .env file for the MCP servers...\n"

#  for each tool copy the .env.sample (if it exists) to .env and .env.docker (dont overwrite existing .env files)
for tool in $tools; do
    if [ -f ./src/tools/$tool/.env.sample ]; then
        printf "Creating .env file for $tool...\n"
        if [ ! -f ./src/tools/$tool/.env ]; then
            cp ./src/tools/$tool/.env.sample ./src/tools/$tool/.env
            printf "# File automatically generated on $(date)\n" >> ./src/tools/$tool/.env
            printf "# See .env.sample for more information\n" >> ./src/tools/$tool/.env
        fi

        # Create .env.docker file if it doesn't exist
        if [ ! -f ./src/tools/$tool/.env.docker ]; then
            cp ./src/tools/$tool/.env.sample ./src/tools/$tool/.env.docker
            printf "# File automatically generated on $(date)\n" >> ./src/tools/$tool/.env.docker
            printf "# See .env.sample for more information\n" >> ./src/tools/$tool/.env.docker
        fi
    else
        printf "No .env.sample found for $tool, skipping...\n"
    fi
done

#  only build docker compose, do not start the containers yet
printf ">> Building MCP servers with Docker Compose...\n"
docker compose -f src/docker-compose.yml up --build -d $(echo $tools | sed 's/\([^ ]*\)/tool-\1/g')