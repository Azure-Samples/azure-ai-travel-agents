# Getting Started

Welcome to the Azure AI Travel Agents sample application! This project demonstrates how: 
- To build a multi-agent system using Azure AI Foundry services and LlamaIndex.TS.
- To implement various Model Context Protocol (MCP) servers in different programming languages.
- To provision and deploy the application to Azure using the Azure Developer CLI (azd).

## Prerequisites

In order to run the application, ensure you have the following installed before running the application:

- **[Azure Developer CLI](https://aka.ms/azure-dev/install)**
- **[Docker](https://www.docker.com/)** (v4.41.2 or later)
- **[Git](https://git-scm.com/downloads)**
- **[Node.js](https://nodejs.org/en/download)** (for the UI and API services)
- **[Powershell 7+ (pwsh)](https://github.com/powershell/powershell)** - For Windows users only.
  - **Important**: Ensure you can run `pwsh.exe` from a PowerShell terminal. If this fails, you likely need to upgrade PowerShell.

## Preview the application locally

To run and preview the application locally, follow these steps:

1. Clone the repository:

<details open>
  <summary>Using HTTPS</summary>

```bash
git clone https://github.com/Azure-Samples/azure-ai-travel-agents.git
```

</details>
<br>
<details>
  <summary>Using SSH</summary>

```bash
git clone git@github.com:Azure-Samples/azure-ai-travel-agents.git
```
</details>

<br>
<details>
  <summary>Using GitHub CLI</summary>

```bash
gh repo clone Azure-Samples/azure-ai-travel-agents
```
</details>
<br>

2. Navigate to the cloned repository:

```bash
cd azure-ai-travel-agents
```

3. Login to your Azure account:

```shell
azd auth login
```
<details>
  <summary>For GitHub Codespaces users</summary>

If the previous command fails, try:

```shell
azd auth login --use-device-code
```
</details>
<br>

4. Provision the Azure resources:

```bash
azd provision
```

When asked, enter a name that will be used for the resource group. **Depending on the region you choose and the available resources and quotas, you may encouter provisioning errors. If this happens, please read our troubleshooting guide in the [Advanced Setup](advanced-setup.md) documentation.**

1. Open a new terminal and run the following command to start the API:

```bash
npm start --prefix=src/api
```

6. Open a new terminal and run the following command to start the UI:

```bash
npm start --prefix=src/ui
```

7. Once all services are up and running, you can:
- Access the **UI** at http://localhost:4200.
- View the traces via the [Aspire Dashboard](https://aspiredashboard.com/) at http://localhost:18888. 
  - On `Structured` tab you'll see the logging messages from the **tool-echo-ping** and **api** services. The `Traces` tab will show the traces across the services, such as the call from **api** to **echo-agent**.

![UI Screenshot](azure-ai-travel-agent-demo-1.png)

⚠️ In case you encounter issues when starting either the API or UI, try running `azd hooks run postprovision` to force run the post-provisioning hooks. This is due to an issue with the `azd provision` command not executing the post-provisioning hooks automatically, in some cases, the first time you run it.

### Use GitHub Codespaces

You can run this project directly in your browser by using GitHub Codespaces, which will open a web-based VS Code:

[![Open in GitHub Codespaces](https://img.shields.io/static/v1?style=for-the-badge&label=GitHub+Codespaces&message=Open&color=blue&logo=github)](https://codespaces.new/Azure-Samples/azure-ai-travel-agents?hide_repo_select=true&ref&quickstart=true)

### Use a VSCode dev container

A similar option to Codespaces is VS Code Dev Containers, that will open the project in your local VS Code instance using the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).

You will also need to have [Docker](https://www.docker.com/products/docker-desktop) installed on your machine to run the container.

[![Open in Dev Containers](https://img.shields.io/static/v1?style=for-the-badge&label=Dev%20Containers&message=Open&color=blue&logo=visualstudiocode)](https://vscode.dev/redirect?url=vscode://ms-vscode-remote.remote-containers/cloneInVolume?url=https://github.com/Azure-Samples/azure-ai-travel-agents)

## Cost estimation

Pricing varies per region and usage, so it isn't possible to predict exact costs for your usage.
However, you can use the [Azure pricing calculator](https://azure.com/e/10e328d3aa074a5089a5ae6c1fb65ba9) for the resources below to get an estimate.

- Azure Container Apps: Consumption plan, Free for the first 2M executions. Pricing per execution and memory used. [Pricing](https://azure.microsoft.com/pricing/details/container-apps/)
- Azure Container Registry: Free for the first 2GB of storage. Pricing per GB stored and per GB data transferred. [Pricing](https://azure.microsoft.com/pricing/details/container-registry/)
- Azure OpenAI: Standard tier, GPT model. Pricing per 1K tokens used, and at least 1K tokens are used per query. [Pricing](https://azure.microsoft.com/pricing/details/cognitive-services/openai-service/)
- Azure Monitor: Free for the first 5GB of data ingested. Pricing per GB ingested after that. [Pricing](https://azure.microsoft.com/pricing/details/monitor/)

⚠️ To avoid unnecessary costs, remember to take down your app if it's no longer in use,
either by deleting the resource group in the Portal or running `azd down --purge` (see [Clean up](#clean-up)).

## Deploy the sample

1. Open a terminal and navigate to the root of the project.
2. Authenticate with Azure by running `azd auth login`.
3. Run `azd up` to deploy the application to Azure. This will provision Azure resources, deploy this sample, with all the containers, and set up the necessary configurations.
   - You will be prompted to select a base location for the resources. If you're unsure of which location to choose, select `swedencentral`.
   - By default, the OpenAI resource will be deployed to `swedencentral`. You can set a different location with `azd env set AZURE_LOCATION <location>`. Currently only a short list of locations is accepted. That location list is based on the [OpenAI model availability table](https://learn.microsoft.com/azure/ai-services/openai/concepts/models?tabs=global-standard%2Cstandard-chat-completions) and may become outdated as availability changes.

The deployment process will take a few minutes. Once it's done, you'll see the URL of the web app in the terminal.

<div align="center">
  <img src="./azd-up.png" alt="Screenshot of the azd up command result" width="600px" />
</div>

You can now open the web app in your browser and start chatting with the bot.

## Clean up

To clean up all the Azure resources created by this sample:

1. Run `azd down --purge`
2. When asked if you are sure you want to continue, enter `y`

The resource group and all the resources will be deleted.

## Advanced Setup

To run the application in a more advanced local setup or deploy to Azure, please refer to the troubleshooting guide in the [Advanced Setup](advanced-setup.md) documentation. This includes setting up the Azure Container Apps environment, using local LLM providers, configuring the services, and deploying the application to Azure.

## Contributing

We welcome contributions to the AI Travel Agents project! If you have suggestions, bug fixes, or new features, please feel free to submit a pull request. For more information on contributing, please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) file.

## Join the Community

We encourage you to join our Azure AI Foundry Developer Community​ to share your experiences, ask questions, and get support:

- [aka.ms/foundry/discord​](https://aka.ms/foundry/discord) - Join our Discord community for real-time discussions and support.
- [aka.ms/foundry/forum](https://aka.ms/foundry/forum) - Visit our Azure AI Foundry Developer Forum to ask questions and share your knowledge.

<div align="center">
  <img src="./ai-foundry-developer-community-cta.png" alt="Join us on Discord" width="1000px" />
</div>

