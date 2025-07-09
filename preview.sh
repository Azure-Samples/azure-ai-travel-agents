
#!/bin/bash
# This script builds, configures, and prepares the environment for running the AI Travel Agents applications.
# This script can be run directly via:
#   /bin/bash <(curl -fsSL https://aka.ms/azure-ai-travel-agents-preview)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color


# Parse arguments for --skip-checks
SKIP_PREREQS=0
for arg in "$@"; do
  case $arg in
    --skip-checks)
      SKIP_PREREQS=1
      ;;
  esac
done

# Step 0: Prerequisite checks (unless skipped)
if [ $SKIP_PREREQS -eq 0 ]; then
  printf "${BOLD}${BLUE}Checking prerequisites...${NC}\n"
  MISSING=0

  # Unicode checkmark and cross
  CHECK='\xE2\x9C\x94' # ✔
  CROSS='\xE2\x9D\x8C' # ❌

  if command -v git --version >/dev/null 2>&1; then
    GIT_VERSION=$(git --version)
    printf "${GREEN}${CHECK} Git version: ${GIT_VERSION}${NC}\n"
  else
    printf "${RED}${CROSS} Git is not installed. Please install Git (https://git-scm.com/)${NC}\n"
    MISSING=1
  fi

  if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    printf "${GREEN}${CHECK} Node.js version: ${NODE_VERSION}${NC}\n"
  else
    printf "${RED}${CROSS} Node.js is not installed. Please install Node.js (https://nodejs.org/)${NC}\n"
    MISSING=1
  fi

  if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    printf "${GREEN}${CHECK} npm version: ${NPM_VERSION}${NC}\n"
  else
    printf "${RED}${CROSS} npm is not installed. Please install npm (https://www.npmjs.com/)${NC}\n"
    MISSING=1
  fi

  if command -v docker >/dev/null 2>&1; then
    DOCKER_VERSION=$(docker --version)
    printf "${GREEN}${CHECK} Docker version: ${DOCKER_VERSION}${NC}\n"
  else
    printf "${RED}${CROSS} Docker is not installed. Please install Docker Desktop (https://www.docker.com/products/docker-desktop/)${NC}\n"
    MISSING=1
  fi

  if [ $MISSING -eq 1 ]; then
    printf "${RED}${BOLD}One or more prerequisites are missing. Please install them and re-run this script.${NC}\n"
    exit 1
  else
    printf "${GREEN}All prerequisites are installed.${NC}\n"
  fi
else
  printf "${YELLOW}${BOLD}Skipping prerequisite checks (--skip-prereqs flag set).${NC}\n"
fi

# Step 0: If not running inside the repo, clone it and re-run the script from there
REPO_URL="https://github.com/Azure-Samples/azure-ai-travel-agents.git"
REPO_DIR="azure-ai-travel-agents"
# Check for .git directory and preview.sh in the current directory
if [ ! -d .git ] || [ ! -f preview.sh ]; then
  printf "${CYAN}Cloning Azure AI Travel Agents repository...${NC}\n"
  git clone "$REPO_URL"
  cd "$REPO_DIR"
  $SHELL preview.sh --skip-checks "$@"
fi

# Step 1: Setup API dependencies
if [ -f ./infra/hooks/api/setup.sh ]; then
  printf "${CYAN}>> Running API setup...${NC}\n"
  bash ./infra/hooks/api/setup.sh
  api_status=$?
  if [ $api_status -ne 0 ]; then
    printf "${RED}${BOLD}API setup failed with exit code $api_status. Exiting.${NC}\n"
    exit $api_status
  fi
else
  printf "${YELLOW}API setup script not found, skipping.${NC}\n"
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
printf "${GREEN}${BOLD}.env file created in src/api/.env.${NC}"

# Step 2: Setup UI dependencies
if [ -f ./infra/hooks/ui/setup.sh ]; then
  printf "${CYAN}>> Running UI setup...${NC}"
  bash ./infra/hooks/ui/setup.sh
  ui_status=$?
  if [ $ui_status -ne 0 ]; then
    printf "${RED}${BOLD}UI setup failed with exit code $ui_status. Exiting.${NC}\n"
    exit $ui_status
  fi
else
  printf "${YELLOW}UI setup script not found, skipping.${NC}\n"
fi

# Step 2.5: Create .env file for the UI
cat > ./src/ui/.env <<EOM
NG_API_URL=http://localhost:4000
EOM
printf "${GREEN}${BOLD}.env file created in src/ui/.env.${NC}\n"

# Step 3: Setup MCP tools (env, dependencies, docker build)
if [ -f ./infra/hooks/mcp/setup.sh ]; then
  printf "${CYAN}>> Running MCP tools setup...${NC}\n"
  bash ./infra/hooks/mcp/setup.sh
  mcp_status=$?
  if [ $mcp_status -ne 0 ]; then
    printf "${RED}${BOLD}MCP tools setup failed with exit code $mcp_status. Exiting.${NC}\n"
    exit $mcp_status
  fi
else
  printf "${YELLOW}MCP tools setup script not found, skipping.${NC}\n"
fi

# Step 4: Print next steps
printf "\n${GREEN}${BOLD}========================================${NC}\n"
printf "${GREEN}${BOLD}Local environment is ready!${NC}\n"
printf "${BLUE}To run the API service, use:${NC}\n"
printf "  ${BOLD}npm start --prefix ./src/api${NC}\n"
printf "${BLUE}To run the UI service, open a new terminal and use:${NC}\n"
printf "  ${BOLD}npm start --prefix ./src/ui${NC}\n"
printf "${GREEN}${BOLD}========================================${NC}\n"

$SHELL