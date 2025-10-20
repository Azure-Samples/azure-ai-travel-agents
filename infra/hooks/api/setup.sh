#! /bin/bash

# Install dependencies for the Langchain.js API service
printf ">> Installing dependencies for the Langchain.js API service...\n"
if [ ! -d ./packages/api-langchain-js/node_modules ]; then
    printf "Installing dependencies for the Langchain.js API service...\n"
    npm ci --prefix=src/api-langchain-js --legacy-peer-deps
    status=$?
    if [ $status -ne 0 ]; then
        printf "API dependencies installation failed with exit code $status. Exiting.\n"
        exit $status
    fi
else
    printf "Dependencies for the Langchain.js API service already installed.\n"
fi

# Install dependencies for the Llamaindex.TS API service
printf ">> Installing dependencies for the Llamaindex.TS API service...\n"
if [ ! -d ./packages/api-llamaindex-ts/node_modules ]; then
    printf "Installing dependencies for the Llamaindex.TS API service...\n"
    npm ci --prefix=src/api-llamaindex-ts --legacy-peer-deps
    status=$?
    if [ $status -ne 0 ]; then
        printf "API dependencies installation failed with exit code $status. Exiting.\n"
        exit $status
    fi
else
    printf "Dependencies for the Llamaindex.TS API service already installed.\n"
fi

# Install dependencies for the MAF API service
printf ">> Installing dependencies for the MAF API service...\n"
cd ./packages/api-maf-python/ && \
    python3 -m venv .venv && \
    source .venv/bin/activate && \
    pip install --upgrade pip && \
    pip install -r requirements.txt
fi

# Enable Docker Desktop Model Runner
printf ">> Enabling Docker Desktop Model Runner...\n"
docker desktop enable model-runner --tcp 12434

printf ">> Pulling Docker model...\n"
docker model pull ai/phi4:14B-Q4_0
