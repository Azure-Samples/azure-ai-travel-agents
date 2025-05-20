# Advanced Setup

This section provides advanced setup instructions for running the application in a containerized environment using Docker. It is recommended to use the provided scripts for a smoother experience, but if you prefer to run the services manually, follow these steps.

## Prerequisites

Ensure you have the following installed before running the application:
- **[Docker](https://www.docker.com/)**
  

## Environment Variables setup for containerized services

The application uses environment variables to configure the services. You can set them in a `.env` file in the root directory or directly in your terminal. We recommend the following approach:
1. Create a `.env.dev` file for each containerized service under `src/`, and optionally a `.env.docker` file for Docker-specific configurations:
    - `src/ui/.env.dev`
    - `src/ui/.env.docker`
    - `src/api/.env.dev`
    - `src/api/.env.docker`
    - `src/tools/customer-query/.env.dev`
    - `src/tools/customer-query/.env.docker`
    - `src/tools/destination-recommendation/.env.dev`
    - `src/tools/destination-recommendation/.env.docker`
    - `src/tools/itinerary-planning/.env.dev`
    - `src/tools/itinerary-planning/.env.docker`
    - `src/tools/code-evaluation/.env.dev`
    - `src/tools/code-evaluation/.env.docker`
    - `src/tools/model-inference/.env.dev`
    - `src/tools/model-inference/.env.docker`
    - `src/tools/web-search/.env.dev`
    - `src/tools/web-search/.env.docker`
    - `src/tools/echo-ping/.env.dev`
    - `src/tools/echo-ping/.env.docker`

2. `.env.docker` files are used to set environment variables for Docker containers. These files should contain the same variables as `.env.dev` files, but with values specific to the Docker environment. For example:
```bash
# src/api/.env.dev
TOOL_CUSTOMER_QUERY_URL=http://localhost:8080

# src/api/.env.docker
TOOL_CUSTOMER_QUERY_URL=http://tool-customer-query:8080
```

3. Load the environment variable files in `docker-compose.yml` using the `env_file` directive, in the following order:
```yml
  web-api:
    container_name: web-api
    # ...
    env_file: 
      - "./api/.env.dev"
      - "./api/.env.docker" # override .env with .env.docker
```

> [!Note]
> Adding the `- environment:` directive to the `docker-compose.yml` file will override the environment variables set in the `.env.*` files.

## Run the Entire Application

To run the entire application, run the following command to build and run all the services defined in the `src/docker-compose.yml` file.

```sh
cd ./src
docker compose up --build
```

This command will build and start all the services defined in the `docker-compose.yml` file.

Alternatively, if you're in VS Code you can use the **Run Task** command (Ctrl+Shift+P) and select the `Run AI Travel Agents` task.

Once all services are up and running, you can:
- Access the **UI** at `http://localhost:4200`.
- View the traces via the [Aspire Dashboard](https://aspiredashboard.com/) at http://localhost:18888. On `Structured` tab you'll see the logging messages from the **tool-echo-ping** and **api** services. The `Traces` tab will show the traces across the services, such as the call from **api** to **echo-agent**.

>[!IMPORTANT]
> When running the application in a containerized environment, you will not be able to make changes to the code and see them reflected in the running services. You will need to rebuild the containers using `docker compose up --build` to see any changes. This is because the code is copied into the container during the build process, and any changes made to the code on your local machine will not be reflected in the container unless you rebuild it.

## Deploy to Azure

To deploy the application to Azure, you can use the provided `azd` commands. The `azd` CLI is a command-line interface for deploying applications to Azure. It simplifies the process of deploying and managing Azure resources.

This is still work in progress, see opened PR [here](https://github.com/Azure-Samples/azure-ai-travel-agents/pull/53) for more details.