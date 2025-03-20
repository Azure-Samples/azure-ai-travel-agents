# The AI Travel Agents

The AI Travel Agents is a robust **enterprise application** that leverages multiple **AI agents** to enhance travel agency operations. The application demonstrates how **five AI agents** collaborate to assist employees in handling customer queries, providing destination recommendations, and planning itineraries.

## Overview of AI Agents

| Agent Name                             | Purpose                                                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Customer Query Understanding Agent** | Extracts key preferences from customer inquiries.                                                      |
| **Destination Recommendation Agent**   | Suggests destinations based on customer preferences.                                                   |
| **Itinerary Planning Agent**           | Creates a detailed itinerary and travel plan.                                                          |
| **Code Evaluation Agent**              | Executes custom logic and scripts if needed.                                                           |
| **Model Inference Agent**              | Runs an **LLM** using **Ollama** on **Azure Container Apps' serverless GPU** for AI-powered responses. |
| **Echo MCP Agent**                     | Echoes back any received input (used as an example).                                                   |

## High-Level Architecture

![High-Level Architecture](docs/ai-travel-agents-architecture-diagram.png)

## Project Structure

```
ai-travel-agents/
│── src/
│   ├── agents/
│   │   ├── customer-query-agent/
│   │   ├── destination-recommendation-agent/
│   │   ├── itinerary-planning-agent/
│   │   ├── code-evaluation-agent/
│   │   ├── model-inference-agent/
│   │   └── echo-mcp-agent/
│   │
│   ├── api/                # API Gateway for backend services
│   └── ui/                 # Frontend application
│
│── infra/                  # azd-related files
│── docs/                   # Documentation files
│
│── README.md              # Project documentation
```

## Prerequisites

Ensure you have the following installed before running the application:

- **[Docker](https://www.docker.com/)**
- **[Docker Compose](https://docs.docker.com/compose/)**

## Run the Entire Application

To run the entire application, use the scripts in the root directory. The scripts will build and run all the services defined in the `docker-compose.yml` file.

```sh
./run.sh
```

> On Windows, you may need to use `run.ps1` instead of `run.sh`.

Alternatively, if you're in VS Code you can use the **Run Task** command (Ctrl+Shift+P) and select the `Run AI Travel Agents` task.

This command will build and start all the services defined in the `docker-compose.yml` file.

Once all services are up and running, you can view the messages (currently logging messages) via the [Aspire Dashboard](https://aspiredashboard.com/) at http://localhost:18888. On `Structured` tab you'll see the logging messages from the **echo-agent** and **api** services. The `Traces` tab will show the traces across the services, such as the call from **api** to **echo-agent**.
