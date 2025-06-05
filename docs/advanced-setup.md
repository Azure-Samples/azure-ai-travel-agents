# Advanced Setup

This section provides advanced setup instructions for running the application in a containerized environment using Docker. It is recommended to use the provided scripts for a smoother experience, but if you prefer to run the services manually, follow these steps.

## Environment Variables setup for containerized services

The application uses environment variables to configure the services. You can set them in a `.env` file in the root directory or directly in your terminal. We recommend the following approach:

1. Create a `.env` file for each containerized service under `src/`, and optionally a `.env.docker` file for Docker-specific configurations:
    - `src/ui/.env`
    - `src/ui/.env.docker`
    - `src/api/.env`
    - `src/api/.env.docker`
    - `src/tools/customer-query/.env`
    - `src/tools/customer-query/.env.docker`
    - `src/tools/destination-recommendation/.env`
    - `src/tools/destination-recommendation/.env.docker`
    - `src/tools/itinerary-planning/.env`
    - `src/tools/itinerary-planning/.env.docker`
    - `src/tools/code-evaluation/.env`
    - `src/tools/code-evaluation/.env.docker`
    - `src/tools/model-inference/.env`
    - `src/tools/model-inference/.env.docker`
    - `src/tools/web-search/.env`
    - `src/tools/web-search/.env.docker`
    - `src/tools/echo-ping/.env`
    - `src/tools/echo-ping/.env.docker`

2. `.env.docker` files are used to set environment variables for Docker containers. These files should contain the same variables as `.env` files, but with values specific to the Docker environment. For example:
  
```bash
# src/api/.env
MCP_CUSTOMER_QUERY_URL=http://localhost:8080

# src/api/.env.docker
MCP_CUSTOMER_QUERY_URL=http://tool-customer-query:8080
```

3. Load the environment variable files in `docker-compose.yml` using the `env_file` directive, in the following order:
```yml
  web-api:
    container_name: web-api
    # ...
    env_file: 
      - "./api/.env"
      - "./api/.env.docker" # override .env with .env.docker
```

> [!Note]
> Adding the `- environment:` directive to the `docker-compose.yml` file will override the environment variables set in the `.env.*` files.

## Preview the application in a containerized environment locally

### Prerequisites

Ensure you have the following installed before running the application:
- **[Docker](https://www.docker.com/)**

### Running the MCP servers in a containerized environment

The included MCP servers are built using various technologies, such as Node.js, Python, and .NET. Each service has its own Dockerfile and is configured to run in a containerized environment.

To build and start all MCP servers containers (defined in the `src/docker-compose.yml` file), run the following command:

```sh
docker compose -f src/docker-compose.yml up --build -d
```

This command will build and start all the services defined in the `docker-compose.yml` file, including the UI and API services.

If you want to run the MCP servers containers only, you can use the following command:

```sh
docker compose -f src/docker-compose.yml up --build -d --no-deps customer-query destination-recommendation itinerary-planning echo-ping
```

Alternatively, if you're in VS Code you can use the **Run Task** command (Ctrl+Shift+P) and select the `Run AI Travel Agents` task.


>[!IMPORTANT]
> When running the application in a containerized environment, you will not be able to make changes to the code and see them reflected in the running services. You will need to rebuild the containers using `docker compose up --build` to see any changes. This is because the code is copied into the container during the build process, and any changes made to the code on your local machine will not be reflected in the container unless you rebuild it.

## Deploy to Azure

### Prerequisites

Ensure you have the following installed before deploying the application:
- **[Docker](https://docs.docker.com/get-started/get-docker/)**
- **[Azure Developer CLI (azd)](https://learn.microsoft.com/azure/developer/azure-developer-cli/install-azd)**
  
### Deploy the application

To deploy the application to Azure, you can use the provided `azd` and Bicep infrastructure-as-code configuration (see `/infra` folder). The `azd` CLI is a command-line interface for deploying applications to Azure. It simplifies the process of provisioning, deploying and managing Azure resources.

To deploy the application, follow these steps:
1. Open a terminal and navigate to the root directory of the project.
2. Run the following command to initialize the Azure Developer CLI:

```sh
azd auth login
```

3. Run the following command to deploy the application:

```sh
azd up
```

This command will provision the necessary Azure resources and deploy the application to Azure. To troubleshoot any issues, see [troubleshooting](#troubleshooting).

### Configure environment variables for running services

Configure environment variables for running services by updating `settings` in [main.parameters.json](../infra/main.parameters.json).

### Configure CI/CD pipeline

Run `azd pipeline config` to configure the deployment pipeline to connect securely to Azure. 

- Deploying with `GitHub Actions`: Select `GitHub` when prompted for a provider. If your project lacks the `azure-dev.yml` file, accept the prompt to add it and proceed with pipeline configuration.

- Deploying with `Azure DevOps Pipeline`: Select `Azure DevOps` when prompted for a provider. If your project lacks the `azure-dev.yml` file, accept the prompt to add it and proceed with pipeline configuration.

## What's included in the infrastructure configuration

### Infrastructure configuration

To describe the infrastructure and application, `azure.yaml` along with Infrastructure as Code files using Bicep were added with the following directory structure:

```yaml
- azure.yaml        # azd project configuration
- infra/            # Infrastructure-as-code Bicep files
  - main.bicep      # Subscription level resources
  - resources.bicep # Primary resource group resources
  - modules/        # Library modules
```

The resources declared in [resources.bicep](../infra/resources.bicep) are provisioned when running `azd up` or `azd provision`.
This includes:

- Azure Container App to host the 'api' service.
- Azure Container App to host the 'ui' service.
- Azure Container App to host the 'itinerary-planning' service.
- Azure Container App to host the 'customer-query' service.
- Azure Container App to host the 'destination-recommendation' service.
- Azure Container App to host the 'echo-ping' service.
- Azure Container App to host the 'web-search' service.
- Azure Container App to host the 'model-inference' service.
- Azure Container App to host the 'code-evaluation' service.
- Azure API Management (APIM) to secure and manage all endpoints with GenAI capabilities.
- Azure OpenAI resource to host the 'model-inference' service.

More information about [Bicep](https://aka.ms/bicep) language.

For detailed information about the API Management integration, see [APIM Integration Guide](./apim-integration.md).

## Troubleshooting

Q: I visited the service endpoint listed, and I'm seeing a blank page, a generic welcome page, or an error page.

A: Your service may have failed to start, or it may be missing some configuration settings. To investigate further:

1. Run `azd show`. Click on the link under "View in Azure Portal" to open the resource group in Azure Portal.
2. Navigate to the specific Container App service that is failing to deploy.
3. Click on the failing revision under "Revisions with Issues".
4. Review "Status details" for more information about the type of failure.
5. Observe the log outputs from Console log stream and System log stream to identify any errors.
6. If logs are written to disk, use *Console* in the navigation to connect to a shell within the running container.

Q: I tried to provision or deploy the application, but it failed with an error.

```
Deployment Error Details:
InvalidTemplateDeployment: The template deployment 'openai' is not valid according to the validation procedure. The tracking id is 'xxxxxxxx-xxx-xxxx-xxxx-xxxxxxxxxxxx'. See inner errors for details.
SpecialFeatureOrQuotaIdRequired: The subscription does not have QuotaId/Feature required by SKU 'S0' from kind 'AIServices' or contains blocked QuotaId/Feature.
```

A: This error indicates that the Azure OpenAI service is not available in your subscription or region. To resolve this, you can either:

1. Request access to the Azure OpenAI service by following the instructions in the [Azure OpenAI Service documentation](https://learn.microsoft.com/en-us/azure/ai-services/openai/quotas-limits?tabs=REST#regional-quota-capacity-limits).
2. Change the Azure OpenAI service SKU to a different one that is available in your subscription or region. You can do this by updating the `location` (or `AZURE_LOCATION`) parameter in the `main.parameters.json` file under the `infra` folder.
3. If you are using a free Azure subscription, consider upgrading to a paid subscription that supports the Azure OpenAI service.

Q: I deployed the application, but the UI is not loading or showing errors.

A: This could be due to several reasons, such as misconfigured environment variables, network issues, or service dependencies not being available. To troubleshoot:

1. Check the logs of the UI service in Azure Portal to see if there are any errors or warnings.
2. Ensure that all required environment variables are set correctly in the Azure Portal under the Container App settings.
3. Verify that all dependent services (like the API, customer query, etc.) are running and accessible.
For more troubleshooting information, visit [Container Apps troubleshooting](https://learn.microsoft.com/azure/container-apps/troubleshooting). 

### Additional information

For additional information about setting up your `azd` project, visit our official [docs](https://learn.microsoft.com/azure/developer/azure-developer-cli/make-azd-compatible?pivots=azd-convert).
