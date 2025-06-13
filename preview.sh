
#!/bin/bash
# This script builds, configures, and prepares the environment for running the AI Travel Agents applications.
# This script can be run directly via:
#   /bin/bash <(curl -fsSL https://raw.githubusercontent.com/Azure-Samples/azure-ai-travel-agents/main/preview.sh)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# If not running inside the repo, clone it and re-run the script from there
REPO_URL="https://github.com/Azure-Samples/azure-ai-travel-agents.git"
REPO_DIR="azure-ai-travel-agents"
# Check for .git directory and preview.sh in the current directory
if [ ! -d .git ] || [ ! -f preview.sh ]; then
  echo -e "${CYAN}Cloning AI Travel Agents repository...${NC}"
  git clone "$REPO_URL"
  cd "$REPO_DIR"
  exec bash preview.sh "$@"
else
  echo -e "${CYAN}Running setup in existing repository. Skipping clone.${NC}"
fi

# Step 0: Prerequisite checks
echo -e "${BOLD}${BLUE}Checking prerequisites...${NC}"
MISSING=0

# Unicode checkmark and cross
CHECK='\xE2\x9C\x94' # ✔
CROSS='\xE2\x9D\x8C' # ❌

if command -v node >/dev/null 2>&1; then
  NODE_VERSION=$(node --version)
  echo -e "${GREEN}${CHECK} Node.js version: ${NODE_VERSION}${NC}"
else
  echo -e "${RED}${CROSS} Node.js is not installed. Please install Node.js (https://nodejs.org/)${NC}"
  MISSING=1
fi

if command -v npm >/dev/null 2>&1; then
  NPM_VERSION=$(npm --version)
  echo -e "${GREEN}${CHECK} npm version: ${NPM_VERSION}${NC}"
else
  echo -e "${RED}${CROSS} npm is not installed. Please install npm (https://www.npmjs.com/)${NC}"
  MISSING=1
fi

if command -v docker >/dev/null 2>&1; then
  DOCKER_VERSION=$(docker --version)
  echo -e "${GREEN}${CHECK} Docker version: ${DOCKER_VERSION}${NC}"
else
  echo -e "${RED}${CROSS} Docker is not installed. Please install Docker Desktop (https://www.docker.com/products/docker-desktop/)${NC}"
  MISSING=1
fi

if [ $MISSING -eq 1 ]; then
  echo -e "${RED}${BOLD}One or more prerequisites are missing. Please install them and re-run this script.${NC}"
  exit 1
else
  echo -e "${GREEN}All prerequisites are installed.${NC}\n"
fi

# Step 1: Setup API dependencies
if [ -f ./infra/hooks/api/setup.sh ]; then
  echo -e "${CYAN}>> Running API setup...${NC}"
  bash ./infra/hooks/api/setup.sh
  api_status=$?
  if [ $api_status -ne 0 ]; then
    echo -e "${RED}${BOLD}API setup failed with exit code $api_status. Exiting.${NC}"
    exit $api_status
  fi
else
  echo -e "${YELLOW}API setup script not found, skipping.${NC}"
fi

# Step 1.5: Create .env file for the user
cat > ./src/api/.env <<EOM
LLM_PROVIDER=docker-models
DOCKER_MODEL_ENDPOINT=http://localhost:12434/engines/llama.cpp/v1
DOCKER_MODEL=ai/phi4:14B-Q4_0

MCP_CUSTOMER_QUERY_URL=http://localhost:8080
MCP_DESTINATION_RECOMMENDATION_URL=http://localhost:5002
MCP_ITINERARY_PLANNING_URL=http://localhost:5003
MCP_CODE_EVALUATION_URL=http://localhost:5004
MCP_MODEL_INFERENCE_URL=http://localhost:5005
MCP_WEB_SEARCH_URL=http://localhost:5006
MCP_ECHO_PING_URL=http://localhost:5007
MCP_ECHO_PING_ACCESS_TOKEN=123-this-is-a-fake-token-please-use-a-token-provider
EOM
echo -e "${GREEN}${BOLD}.env file created in src/api/.env.${NC}"

# Step 2: Setup UI dependencies
if [ -f ./infra/hooks/ui/setup.sh ]; then
  echo -e "${CYAN}>> Running UI setup...${NC}"
  bash ./infra/hooks/ui/setup.sh
  ui_status=$?
  if [ $ui_status -ne 0 ]; then
    echo -e "${RED}${BOLD}UI setup failed with exit code $ui_status. Exiting.${NC}"
    exit $ui_status
  fi
else
  echo -e "${YELLOW}UI setup script not found, skipping.${NC}"
fi

# Step 2.5: Create .env file for the UI
cat > ./src/ui/.env <<EOM
NG_API_URL=http://localhost:4000
EOM
echo -e "${GREEN}${BOLD}.env file created in src/ui/.env.${NC}"

# Step 3: Setup MCP tools (env, dependencies, docker build)
if [ -f ./infra/hooks/mcp/setup.sh ]; then
  echo -e "${CYAN}>> Running MCP tools setup...${NC}"
  bash ./infra/hooks/mcp/setup.sh
  mcp_status=$?
  if [ $mcp_status -ne 0 ]; then
    echo -e "${RED}${BOLD}MCP tools setup failed with exit code $mcp_status. Exiting.${NC}"
    exit $mcp_status
  fi
else
  echo -e "${YELLOW}MCP tools setup script not found, skipping.${NC}"
fi

# Step 4: Print next steps
echo -e "\n${GREEN}${BOLD}========================================${NC}"
echo -e "${GREEN}${BOLD}Local environment is ready!${NC}\n"
echo -e "${BLUE}To run the API service, use:${NC}"
echo -e "  ${BOLD}npm start --prefix ./src/api${NC}\n"
echo -e "${BLUE}To run the UI service, open a new terminal and use:${NC}"
echo -e "  ${BOLD}npm start --prefix ./src/ui${NC}\n"
echo -e "${GREEN}${BOLD}========================================${NC}"
