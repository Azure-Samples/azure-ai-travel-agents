<div align="center">

<img src="./docs/ai-travel-agents-logo.png" alt="" align="center" height="128" />

# Azure AI Travel Agents with Llamaindex.TS and MCP

[![Join Azure AI Foundry Community Discord](https://img.shields.io/badge/Discord-Azure_AI_Foundry_Community_Discord-blue?style=flat-square&logo=discord&color=5865f2&logoColor=fff)](https://aka.ms/foundry/discord)
[![Join Azure AI Foundry Developer Forum](https://img.shields.io/badge/GitHub-Azure_AI_Foundry_Developer_Forum-blue?style=flat-square&logo=github&color=000000&logoColor=fff)](https://aka.ms/foundry/forum)
[![Announcement blog post](https://img.shields.io/badge/Announcement%20Blog%20post-black?style=flat-square)](https://techcommunity.microsoft.com/blog/AzureDevCommunityBlog/introducing-azure-ai-travel-agents-a-flagship-mcp-powered-sample-for-ai-travel-s/4416683)
<br>
[![Open project in GitHub Codespaces](https://img.shields.io/badge/Codespaces-Open-blue?style=flat-square&logo=github)](https://codespaces.new/Azure-Samples/azure-ai-travel-agents?hide_repo_select=true&ref=main&quickstart=true)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Azure-Samples/azure-ai-travel-agents/build-test.yaml?style=flat-square&label=Build)](https://github.com/Azure-Samples/azure-ai-travel-agents/actions)
![Node version](https://img.shields.io/badge/Node.js->=22-3c873a?style=flat-square)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Java](https://img.shields.io/badge/Java-yellow?style=flat-square&logo=java&logoColor=white)](https://www.java.com)
[![.NET](https://img.shields.io/badge/.NET-green?style=flat-square&logo=.net&logoColor=white)](https://dotnet.microsoft.com)
[![Python](https://img.shields.io/badge/Python-red?style=flat-square&logo=python&logoColor=white)](https://www.python.org)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE.md)

:star: To stay updated and get notified about changes, star this repo on GitHub!

[![GitHub Repo stars](https://img.shields.io/github/stars/Azure-Samples/azure-ai-travel-agents?style=social)](https://github.com/Azure-Samples/azure-ai-travel-agents)


![Animation showing the chat app in action](./docs/azure-ai-travel-agent-demo-1.gif)

</div>

## Overview

The AI Travel Agents is a robust **enterprise application** that leverages multiple **AI agents** to enhance travel agency operations. The application demonstrates how LlamaIndex.TS orchestrates **multiple AI agents** to assist employees in handling customer queries, providing destination recommendations, and planning itineraries. Multiple **MCP** (Model Context Protocol) servers, built with **Python, Node.js, Java and .NET**, are used to provide various tools and services to the agents, enabling them to work together seamlessly.

| Agent Name                       | Purpose                                                                                                                       |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Customer Query Understanding** | Extracts key **preferences** from customer inquiries.                                                                         |
| **Destination Recommendation**   | Suggests **destinations** based on customer preferences.                                                                          |
| **Itinerary Planning**           | Creates a detailed **itinerary** and travel plan.                                                                                 |
| **Code Evaluation**              | Executes custom logic and scripts when needed.                                                                                  |
| **Model Inference**              | Runs a custom **LLM** using **ONNX** and **vLLM** on **Azure Container Apps' serverless GPU** for high-performance inference. |
| **Web Search**                   | Uses Grounding with Bing Search to fetch live travel data.                                                                    |
| **Echo Ping**                    | Echoes back any received input (used as an MCP server example).                                                               |

## High-Level Architecture

The architecture of the AI Travel Agents application is designed to be modular and scalable:

- All components are containerized using **Docker** so that they can be easily deployed and managed by **[Azure Container Apps](https://learn.microsoft.com/azure/container-apps/)**.
- All agents tools are available as MCP ([Model Context Protocol](https://github.com/modelcontextprotocol)) servers and are called by the MCP clients.
- MCP servers are implemented independently using variant technologies, such as **Python**, **Node.js**, **Java**, and **.NET**.
- The Agent Workflow Service orchestrates the interaction between the agents and MCP clients, allowing them to work together seamlessly.
- The Aspire Dashboard is used to monitor the application, providing insights into the performance and behavior of the agents (through the [OpenTelemetry integration](https://opentelemetry.io/ecosystem/integrations/)).

<div align="center">
  <img src="./docs/ai-travel-agents-architecture-diagram.png" alt="Application architecture" width="640px" />
</div>

## Features
- Multiple AI agents (each with its own specialty)
- Orchestrated by [LlamaIndex.TS](https://ts.llamaindex.ai/)
- Supercharged by [MCP](https://modelcontextprotocol.io/introduction)
- Deployed serverlessly via [Azure Container Apps](https://learn.microsoft.com/azure/container-apps/)

## Prerequisites

Ensure you have the following installed before running the application:

- **[Docker](https://www.docker.com/)**
- **[Azure Developer CLI](https://aka.ms/azure-dev/install)**
- **[Git](https://git-scm.com/downloads)**
- **[Node.js](https://nodejs.org/en/download)** (for the UI and API services)
- **[Powershell 7+ (pwsh)](https://github.com/powershell/powershell)** - For Windows users only.
  - **Important**: Ensure you can run `pwsh.exe` from a PowerShell terminal. If this fails, you likely need to upgrade PowerShell.

## Preview the application locally

To run and preview the application locally, follow these steps:

1. Clone the repository:

**Using HTTPS**:

```bash
git clone https://github.com/Azure-Samples/azure-ai-travel-agents.git
```

**Using SSH**:

```bash
git clone git@github.com:Azure-Samples/azure-ai-travel-agents.git
```

**Using GitHub CLI**

```bash
gh repo clone Azure-Samples/azure-ai-travel-agents
```

2. Navigate to the cloned repository:

```bash
cd azure-ai-travel-agents
```

3. Login to your Azure account:

```shell
azd auth login
```

For GitHub Codespaces users, if the previous command fails, try:

```shell
azd auth login --use-device-code
```

4. Provision the Azure resources:

```bash
azd provision
```

When asked, enter a name that will be used for the resource group.
This will create a new folder in the `.azure` folder, and set it as the active environment for any calls to `azd` going forward.
This will also install the necessary dependencies for the UI and API services, and build the Docker images for the agents.

5. Open a new terminal and run the following command to start the API:

```bash
npm run start --prefix=src/api
```

6. Open a new terminal and run the following command to start the UI:

```bash
npm run start --prefix=src/ui
```

7. Navigate to the UI in your web browser at `http://localhost:4200`.

![UI Screenshot](docs/azure-ai-travel-agent-demo-1.png)


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

#### Deploy the sample

1. Open a terminal and navigate to the root of the project.
2. Authenticate with Azure by running `azd auth login`.
3. Run `azd up` to deploy the application to Azure. This will provision Azure resources, deploy this sample, with all the containers, and set up the necessary configurations.
   - You will be prompted to select a base location for the resources. If you're unsure of which location to choose, select `swedencentral`.
   - By default, the OpenAI resource will be deployed to `swedencentral`. You can set a different location with `azd env set AZURE_LOCATION <location>`. Currently only a short list of locations is accepted. That location list is based on the [OpenAI model availability table](https://learn.microsoft.com/azure/ai-services/openai/concepts/models?tabs=global-standard%2Cstandard-chat-completions) and may become outdated as availability changes.

The deployment process will take a few minutes. Once it's done, you'll see the URL of the web app in the terminal.

<div align="center">
  <img src="./docs/azd-up.png" alt="Screenshot of the azd up command result" width="600px" />
</div>

You can now open the web app in your browser and start chatting with the bot.

#### Clean up

To clean up all the Azure resources created by this sample:

1. Run `azd down --purge`
2. When asked if you are sure you want to continue, enter `y`

The resource group and all the resources will be deleted.

## Advanced Setup

To run the application in a more advanced local setup or deploy to Azure, please refer to the [Advanced Setup](docs/advanced-setup.md) documentation. This includes setting up the Azure Container Apps environment, using local LLM providers, configuring the services, and deploying the application to Azure.

## Join the Community

We encourage you to join our Azure AI Foundry Developer Community​ to share your experiences, ask questions, and get support:

- [aka.ms/foundry/discord​](https://aka.ms/foundry/discord) - Join our Discord community for real-time discussions and support.
- [aka.ms/foundry/forum](https://aka.ms/foundry/forum) - Visit our Azure AI Foundry Developer Forum to ask questions and share your knowledge.

## Contributing

We welcome contributions to the AI Travel Agents project! If you have suggestions, bug fixes, or new features, please feel free to submit a pull request. For more information on contributing, please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) file.
