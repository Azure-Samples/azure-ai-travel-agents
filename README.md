<div align="center">

<img src="./docs/ai-travel-agents-logo.png" alt="" align="center" height="128" />

<h1>Agents and MCP Orchestration <br>with LlamaIndex.TS, Langchain.js <br>and Microsoft Agent Framework!</h1>

[![Join Azure AI Foundry Community Discord](https://img.shields.io/badge/Discord-Azure_AI_Foundry_Community_Discord-blue?style=flat-square&logo=discord&color=5865f2&logoColor=fff)](https://discord.gg/NcwHpz6bRW)
[![Join Azure AI Foundry Developer Forum](https://img.shields.io/badge/GitHub-Azure_AI_Foundry_Developer_Forum-blue?style=flat-square&logo=github&color=000000&logoColor=fff)](https://aka.ms/foundry/forum)
[![Announcement blog post](https://img.shields.io/badge/Announcement%20Blog%20post-black?style=flat-square)](https://techcommunity.microsoft.com/blog/AzureDevCommunityBlog/introducing-azure-ai-travel-agents-a-flagship-mcp-powered-sample-for-ai-travel-s/4416683)
<br>
[![Open project in GitHub Codespaces](https://img.shields.io/badge/Codespaces-Open-blue?style=flat-square&logo=github)](https://codespaces.new/Azure-Samples/azure-ai-travel-agents?hide_repo_select=true&ref=main&quickstart=true)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Azure-Samples/azure-ai-travel-agents/build.yaml?style=flat-square&label=Build)](https://github.com/Azure-Samples/azure-ai-travel-agents/actions)
![Node version](https://img.shields.io/badge/Node.js->=22-3c873a?style=flat-square)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Java](https://img.shields.io/badge/Java-yellow?style=flat-square&logo=java&logoColor=white)](https://www.java.com)
[![.NET](https://img.shields.io/badge/.NET-green?style=flat-square&logo=.net&logoColor=white)](https://dotnet.microsoft.com)
[![Python](https://img.shields.io/badge/Python-red?style=flat-square&logo=python&logoColor=white)](https://www.python.org)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE.md)

:star: To stay updated and get notified about changes, star this repo on GitHub!

[![GitHub Repo stars](https://img.shields.io/github/stars/Azure-Samples/azure-ai-travel-agents?style=social)](https://github.com/Azure-Samples/azure-ai-travel-agents) ![GitHub forks](https://img.shields.io/github/forks/azure-samples/azure-ai-travel-agents) ![GitHub watchers](https://img.shields.io/github/watchers/azure-samples/azure-ai-travel-agents)



[Overview](#overview) • [Architecture](#high-level-architecture) • [Features](#features) • [Preview locally FOR FREE](#preview-the-application-locally-for-free) • [Cost estimation](#cost-estimation) • [Join the Community](#join-the-community)

![Animation showing the chat app in action](./docs/azure-ai-travel-agent-demo-1.gif)

[![Preview the application locally for free](https://img.shields.io/badge/Preview_the_application_locally_FOR_FREE-blue?style=flat-square&logo=docker&logoColor=white&logoSize=48)](#preview-the-application-locally-for-free)

</div>

## Overview

The AI Travel Agents is a robust **enterprise application** that leverages multiple **AI agents** to enhance travel agency operations. The application demonstrates how LlamaIndex.TS orchestrates **multiple AI agents** to assist employees in handling customer queries, providing destination recommendations, and planning itineraries. Multiple **MCP** (Model Context Protocol) servers, built with **Python, Node.js, Java and .NET**, are used to provide various tools and services to the agents, enabling them to work together seamlessly.

| Agent Name                       | Purpose                                                                                                                       |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Customer Query Understanding** | Extracts key **preferences** from customer inquiries.                                                                         |
| **Destination Recommendation**   | Suggests **destinations** based on customer preferences.                                                                          |
| **Itinerary Planning**           | Creates a detailed **itinerary** and travel plan.                                                                                 |
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

> [!NOTE]
> New to the Model Context Protocol (MCP)? Check out our free [MCP for Beginners](https://github.com/microsoft/mcp-for-beginners) guide.

## Features
- Multiple AI agents (each with its own specialty)
- Orchestrated by [LlamaIndex.TS](https://ts.llamaindex.ai/), [Langchain.js](https://js.langchain.com/) and the [Microsoft Agent Framework](https://github.com/microsoft/agent-framework/)
- Supercharged by [MCP](https://modelcontextprotocol.io/introduction)
- Deployed serverlessly via [Azure Container Apps](https://learn.microsoft.com/azure/container-apps/)
- Includes an [llms.txt](./llms.txt) file to provide information to help LLMs use this project at inference time ([learn more](https://llmstxt.org/))
- OpenTelemetry instrumentation for monitoring with [Aspire Dashboard](https://www.aspiredashboard.com/)
- Sample code for MCP servers in multiple languages: Python, Node.js, Java, .NET
- Easy to extend with new agents and tools
- Comprehensive documentation using VitePress

<!-- Note: this is a placeholder for HackerNoon links which point from the article to an old section in this readme -->
<a id="prerequisites"/>
<!--  -->

## Preview the application locally for FREE

To run and preview the application locally, we will use [Docker Model Runner](https://docs.docker.com/ai/model-runner/).

> [!IMPORTANT]
> The Phi4 14B model requires **significant resources** (at least 16GB RAM and a modern CPU or GPU) to run efficiently. 
GPU acceleration is only supported on macOS Apple Silicon and NVIDIA GPUs on Windows). 
> If your machine does not have enough resources to run LLMs locally, you can still run the application using Azure AI Foundry. Please refer to the [Advanced Setup](docs/advanced-setup.md) documentation for more information.

### One setup script

The script will do the following:
- Run a check for the required tools and dependencies
- Clone the current repository to your local machine
- Install npm dependencies for the API and web app
- Download the [Phi4 14B model](https://hub.docker.com/r/ai/phi4)
  - This will take a while, as the model is large (around 7.80 GB)
- Build the Docker images for all the MCP servers
- Configure all the .env files with the correct settings for local AX

In order to run the application locally, ensure you have the following installed before running the preview script:
- **[Git](https://git-scm.com/downloads)** (for cloning the repository)
- **[Node.js](https://nodejs.org/en/download)** (for the UI and API services)
- **[Docker](https://www.docker.com/)** (for the MCP servers and using DMR - Docker Model Runner)
  - Make sure to enable the **[DMR](https://docs.docker.com/ai/model-runner/#enable-docker-model-runner)** in Docker Desktop settings.
- **[Powershell 7+ (pwsh)](https://github.com/powershell/powershell)** - For Windows users only.
  - **Important**: Ensure you can run `pwsh.exe` from a PowerShell terminal. If this fails, you likely need to [upgrade PowerShell](https://aka.ms/PSWindows)


<details open>
  <summary>For Linux and macOS users</summary>

```bash
/bin/bash <(curl -fsSL https://aka.ms/azure-ai-travel-agents-preview)
```
</details>
<br>
<details>
  <summary>For Windows users</summary>

```powershell
iex "& { $(irm https://aka.ms/azure-ai-travel-agents-preview-win) }"
```
</details>
<br>

## Cost estimation

When provisioning resources in Azure, it's important to consider the costs associated with running the application. The AI Travel Agents sample uses several Azure services, and the costs can vary based on your usage and configuration.

Pricing varies per region and usage, so it isn't possible to predict exact costs for your usage.
However, you can use the [Azure pricing calculator](https://azure.com/e/10e328d3aa074a5089a5ae6c1fb65ba9) for the resources below to get an estimate.

- Azure Container Apps: Consumption plan, Free for the first 2M executions. Pricing per execution and memory used. [Pricing](https://azure.microsoft.com/pricing/details/container-apps/)
- Azure Container Registry: Free for the first 2GB of storage. Pricing per GB stored and per GB data transferred. [Pricing](https://azure.microsoft.com/pricing/details/container-registry/)
- Azure OpenAI: Standard tier, GPT model. Pricing per 1K tokens used, and at least 1K tokens are used per query. [Pricing](https://azure.microsoft.com/pricing/details/cognitive-services/openai-service/)
- Azure Monitor: Free for the first 5GB of data ingested. Pricing per GB ingested after that. [Pricing](https://azure.microsoft.com/pricing/details/monitor/)

> [!IMPORTANT] 
> To avoid unnecessary costs, remember to take down your app if it's no longer in use,
either by deleting the resource group in the Portal or running `azd down --purge` (see [Clean up](#clean-up)).

## Quick deploy the sample to Azure

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

## Clean up

To clean up all the Azure resources created by this sample:

1. Run `azd down --purge`
2. When asked if you are sure you want to continue, enter `y`

The resource group and all the resources will be deleted.

## 🚀 LlamaIndex.TS + GitHub Models Deployment Guide

**NEW**: This deployment now uses **LlamaIndex.TS orchestration** with **GitHub Models API** (gpt-4o-mini) as the LLM provider. This makes it even easier to get started without Azure OpenAI.

### Quick Start with GitHub Models

```bash
# 1. Get GitHub Personal Access Token (Classic)
# Go to https://github.com/settings/tokens
# Create token with: repo, read:packages, write:packages scopes

# 2. Update environment
cd packages/api
cp .env.sample .env.docker
# Edit .env.docker and add your GitHub token:
# LLM_PROVIDER=github-models
# GITHUB_TOKEN=ghp_your_token_here
# GITHUB_MODEL=gpt-4o-mini

# 3. Deploy
cd ..
docker-compose up -d

# 4. Access
# Frontend: http://localhost:4200
# API: http://localhost:4000
```

**For complete documentation**, see: **[DEPLOYMENT_GUIDE_LLAMAINDEX_GITHUB_MODELS.md](docs/DEPLOYMENT_GUIDE_LLAMAINDEX_GITHUB_MODELS.md)**

### What Changed in This Version

- ✅ **Orchestrator**: Switched from LangChain to **LlamaIndex.TS** (simpler agent routing)
- ✅ **LLM Provider**: Integrated **GitHub Models API** (free, no Azure subscription needed)
- ✅ **Response Handling**: Fixed LlamaIndex response format extraction
- ✅ **Core Services**: 3 operational MCP services (customer-query, destination-recommendation, itinerary-planning)
- ✅ **Frontend**: Updated with improved event streaming and debug logging

See **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** for detailed changes.

## Advanced Setup

To run the application in a more advanced local setup or deploy to Azure, please refer to the troubleshooting guide in the [Advanced Setup](docs/advanced-setup.md) documentation. This includes setting up the Azure Container Apps environment, using local LLM providers, configuring the services, and deploying the application to Azure.

## Contributing

We welcome contributions to the AI Travel Agents project! If you have suggestions, bug fixes, or new features, please feel free to submit a pull request. For more information on contributing, please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) file.

## Join the Community

We encourage you to join our Azure AI Foundry Developer Community​ to share your experiences, ask questions, and get support:

- [aka.ms/foundry/discord​](https://discord.gg/NcwHpz6bRW) - Join our Discord community for real-time discussions and support.
- [aka.ms/foundry/forum](https://aka.ms/foundry/forum) - Visit our Azure AI Foundry Developer Forum to ask questions and share your knowledge.

<div align="center">
  <img src="./docs/ai-foundry-developer-community-cta.png" alt="Join us on Discord" width="1000px" />
</div>

