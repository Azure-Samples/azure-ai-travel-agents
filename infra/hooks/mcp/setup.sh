#!/bin/bash

# This script builds and sets up the MCP containers.

##########################################################################
# MCP Tools
##########################################################################
tools="echo-ping customer-query destination-recommendation itinerary-planning code-evaluation model-inference web-search"
echo ">> Creating .env file for the MCP servers..."

#  for each tool copy the .env.sample (if it exists) to .env and .env.docker (dont overwrite existing .env files)
for tool in $tools; do
    if [ -f ./src/tools/$tool/.env.sample ]; then
        echo "Creating .env file for $tool..."
        if [ ! -f ./src/tools/$tool/.env ]; then
            cp ./src/tools/$tool/.env.sample ./src/tools/$tool/.env
            echo "# File automatically generated on $(date)" >> ./src/tools/$tool/.env
            echo "# See .env.sample for more information" >> ./src/tools/$tool/.env
        fi

        # Create .env.docker file if it doesn't exist
        if [ ! -f ./src/tools/$tool/.env.docker ]; then
            cp ./src/tools/$tool/.env.sample ./src/tools/$tool/.env.docker
            echo "# File automatically generated on $(date)" >> ./src/tools/$tool/.env.docker
            echo "# See .env.sample for more information" >> ./src/tools/$tool/.env.docker
        fi

        # Install dependencies for the tool service
        echo ">> Installing dependencies for $tool service..."
        if [ ! -d ./src/tools/$tool/node_modules ]; then
            npm ci --prefix=./src/tools/$tool
            status=$?
            if [ $status -ne 0 ]; then
                echo "$tool dependencies installation failed with exit code $status. Exiting."
                exit $status
            fi
        else
            echo "Dependencies for $tool service already installed."
        fi
    else
        echo "No .env.sample found for $tool, skipping..."
    fi
done

# Enable Docker Desktop Model Runner
echo ">> Enabling Docker Desktop Model Runner..."
docker desktop enable model-runner --tcp 12434

echo ">> Pulling Docker model..."
docker model pull ai/phi4:14B-Q4_0

#  only build docker compose, do not start the containers yet
echo ">> Building MCP servers with Docker Compose..."
docker compose -f src/docker-compose.yml up --build -d $(echo $tools | sed 's/\([^ ]*\)/tool-\1/g')