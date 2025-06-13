---
title: getting-started
createTime: 2025/06/06 13:07:02
---
# Getting Started

Welcome to the Azure AI Travel Agents sample application! This project demonstrates how: 
- To build a multi-agent system using Azure AI Foundry services and LlamaIndex.TS.
- To implement various Model Context Protocol (MCP) servers in different programming languages.
- To provision and deploy the application to Azure using the Azure Developer CLI (azd).

## Preview the application locally for FREE

To run and preview the application locally, we will use [Docker Model Runner](https://docs.docker.com/ai/model-runner/).

> [!NOTE]
> If your machine does not have enough resources to run the Docker Model Runner, you can still run the application using Azure OpenAI. Please refer to the [Preview the application using Azure AI Foundry](#preview-the-application-using-azure-ai-foundry) section below.

### Prerequisites
- **[Git](https://git-scm.com/downloads)** (for cloning the repository)
- **[Node.js](https://nodejs.org/en/download)** (for the UI and API services)
- **[Docker v4.42.0 or later](https://www.docker.com/)** (for the MCP servers)
- **[ai/phi4:14B-Q4_0 model](https://hub.docker.com/r/ai/phi4)** (7.80 GB)
  - This is the model variant from the Phi-4 family that supports **Function Calling** which is required for the application to work.

In order to run the application locally, you need to clone the repository and run the preview script. This will set up the necessary environment and start the application. 

We also recommend you [fork the repository](https://github.com/Azure-Samples/azure-ai-travel-agents/fork) to your own GitHub account so you can make changes and experiment with the code.

<details open>
  <summary>Using HTTPS</summary>

```bash
git clone https://github.com/YOUR-USERNAME/azure-ai-travel-agents.git
```

</details>
<br>
<details>
  <summary>Using SSH</summary>

```bash
git clone git@github.com:YOUR-USERNAME/azure-ai-travel-agents.git
```
</details>

<br>
<details>
  <summary>Using GitHub CLI</summary>

```bash
gh repo clone YOUR-USERNAME/azure-ai-travel-agents
```
</details>
<br>


### Start the application

1. Run the preview script from the root of the project:
<details open>
  <summary>For Linux and macOS users</summary>

```bash
./preview.sh
```

</details>
<br>
<details>
  <summary>For Windows users</summary>

```powershell
.\preview.ps1
```
</details>
<br>

Start the API service by running the following command in a terminal:

```bash
npm start --prefix=src/api
```

Open a new terminal and start the UI service by running the following command:

```bash
npm start --prefix=src/ui
```

Once all services are up and running, you can access the **UI** at http://localhost:4200.

![UI Screenshot](azure-ai-travel-agent-demo-1.png)

You can also view the traces via the [Aspire Dashboard](https://aspiredashboard.com/) at http://localhost:18888.
  - On `Structured` tab you'll see the logging messages from the **tool-echo-ping** and **api** services. The `Traces` tab will show the traces across the services, such as the call from **api** to **echo-agent**.


## Preview the application using Azure AI Foundry

### Prerequisites

In order to run the application using Azure AI Foundry, ensure you have the following installed before running the application:

- **[Git](https://git-scm.com/downloads)** (for cloning the repository)
- **[Node.js](https://nodejs.org/en/download)** (for the UI and API services)
- **[Docker](https://www.docker.com/)** (for the MCP servers)
- **[Azure Developer CLI](https://aka.ms/azure-dev/install)** (for managing Azure resources)
- **[Powershell 7+ (pwsh)](https://github.com/powershell/powershell)** - For Windows users only.
  - **Important**: Ensure you can run `pwsh.exe` from a PowerShell terminal. If this fails, you likely need to upgrade PowerShell.

### Fork and clone the repository

To run and preview the application locally, we recommend you [fork the repository](https://github.com/Azure-Samples/azure-ai-travel-agents/fork) to your own GitHub account so you can make changes and experiment with the code.

1. Clone the repository:

<details open>
  <summary>Using HTTPS</summary>

```bash
git clone https://github.com/YOUR-USERNAME/azure-ai-travel-agents.git
```

</details>
<br>
<details>
  <summary>Using SSH</summary>

```bash
git clone git@github.com:YOUR-USERNAME/azure-ai-travel-agents.git
```
</details>

<br>
<details>
  <summary>Using GitHub CLI</summary>

```bash
gh repo clone YOUR-USERNAME/azure-ai-travel-agents
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

4. Provision the Azure resources. This is an important step that sets up an Azure AI Foundry environment:

```bash
azd provision
```

When asked, enter a name that will be used for the resource group. **Depending on the region you choose and the available resources and quotas, you may encouter provisioning errors. If this happens, please read our troubleshooting guide in the [Advanced Setup](advanced-setup.md) documentation.**

5. Open a new terminal and run the following command to start the API:

```bash
npm start --prefix=src/api
```

6. Open a new terminal and run the following command to start the UI:

```bash
npm start --prefix=src/ui
```

7. Once all services are up and running, you can access the **UI** at http://localhost:4200.

![UI Screenshot](azure-ai-travel-agent-demo-1.gif)

You can also view the traces via the [Aspire Dashboard](https://aspiredashboard.com/) at http://localhost:18888.
  - On `Structured` tab you'll see the logging messages from the **tool-echo-ping** and **api** services. The `Traces` tab will show the traces across the services, such as the call from **api** to **echo-agent**.

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

## Technical documentation

For more detailed information about the architecture, components, and how the application works, please refer to the [Technical Documentation](./overview.md).


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

