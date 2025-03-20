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

You should see an output similar to this:

```
code-evaluation-agent-1             | Hello from code-evaluation-agent!
itinerary-planning-agent-1          | Hello from itinerary-planning-agent!
customer-query-agent-1              | Hello from customer-query-agent!
destination-recommendation-agent-1  | Hello from destination-recommendation-agent!
model-inference-agent-1             | Hello from model-inference-agent!
echo-agent-1                        | Server started and listening for requests...
echo-agent-1                        | You can connect to it using the SSEClientTransport.
echo-agent-1                        | For example: new SSEClientTransport(new URL('http://0.0.0.0:5000/sse'))
code-evaluation-agent-1 exited with code 0
destination-recommendation-agent-1 exited with code 0
itinerary-planning-agent-1 exited with code 0
customer-query-agent-1 exited with code 0
model-inference-agent-1 exited with code 0
api-1                               | Tools:  {
api-1                               |   tools: [
api-1                               |     {
api-1                               |       name: 'echo',
api-1                               |       description: 'Echo back the input values',
api-1                               |       inputSchema: [Object]
api-1                               |     }
api-1                               |   ]
api-1                               | }
api-1                               | Connected to MCP server
api-1                               | Tools:  [
api-1                               |   {
api-1                               |     "name": "echo",
api-1                               |     "description": "Echo back the input values",
api-1                               |     "inputSchema": {
api-1                               |       "type": "object",
api-1                               |       "properties": {
api-1                               |         "text": {
api-1                               |           "type": "string"
api-1                               |         }
api-1                               |       },
api-1                               |       "required": [
api-1                               |         "text"
api-1                               |       ],
api-1                               |       "additionalProperties": false,
api-1                               |       "$schema": "http://json-schema.org/draft-07/schema#"
api-1                               |     }
api-1                               |   }
api-1                               | ]
echo-agent-1                        | Received request to echo: { args: { text: 'Hello world from the client!' } }
api-1                               | Result:  {
api-1                               |   content: [
api-1                               |     {
api-1                               |       type: 'text',
api-1                               |       text: 'Echoed text: Hello world from the client! - from the server at 2025-03-14T21:57:35.397Z'
api-1                               |     }
api-1                               |   ]
api-1                               | }
ui-1                                | Hello from customer-query-agent!
ui-1 exited with code 0
```
