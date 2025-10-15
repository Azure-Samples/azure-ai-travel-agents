import { McpServerDefinition } from "../../../mcp/mcp-tools.js";

export type McpServerName =
  | "echo-ping"
  | "customer-query"
  | "web-search"
  | "itinerary-planning"
  | "model-inference"
  | "code-evaluation"
  | "destination-recommendation";

const MCP_API_SSE_PATH = "/sse";
const MCP_API_HTTP_PATH = "/mcp";

export const McpToolsConfig = (): {
  [k in McpServerName]: McpServerDefinition;
} => ({
  "echo-ping": {
    config: {
      url: process.env["MCP_ECHO_PING_URL"] + MCP_API_HTTP_PATH,
      type: "http",
      verbose: true,
      requestInit: {
          headers: {
              "Authorization": "Bearer " + process.env["MCP_ECHO_PING_ACCESS_TOKEN"],
          }
      },
      useSSETransport: false
    },
    id: "echo-ping",
    name: "Echo Test",
  },
  "customer-query": {
    config: {
      url: process.env["MCP_CUSTOMER_QUERY_URL"] + MCP_API_HTTP_PATH,
      type: "http",
      verbose: true,
      useSSETransport: false
    },
    id: "customer-query",
    name: "Customer Query",
  },
  "web-search": {
    config: {
      url: process.env["MCP_WEB_SEARCH_URL"] + MCP_API_SSE_PATH,
      type: "sse",
      verbose: true,
      useSSETransport: true
    },
    id: "web-search",
    name: "Web Search",
  },
  "itinerary-planning": {
    config: {
      url: process.env["MCP_ITINERARY_PLANNING_URL"] + MCP_API_HTTP_PATH,
      type: "http",
      verbose: true,
      useSSETransport: false
    },
    id: "itinerary-planning",
    name: "Itinerary Planning",
  },
  "model-inference": {
    config: {
      url: process.env["MCP_MODEL_INFERENCE_URL"] + MCP_API_SSE_PATH,
      type: "sse",
      verbose: true,
      useSSETransport: true
    },
    id: "model-inference",
    name: "Model Inference",
  },
  "code-evaluation": {
    config: {
      url: process.env["MCP_CODE_EVALUATION_URL"] + MCP_API_SSE_PATH,
      type: "sse",
      verbose: true,
      useSSETransport: true
    },
    id: "code-evaluation",
    name: "Code Evaluation",
  },
  "destination-recommendation": {
    config: {
      url: process.env["MCP_DESTINATION_RECOMMENDATION_URL"] + MCP_API_HTTP_PATH,
      type: "http",
      verbose: true,
      useSSETransport: false
    },
    id: "destination-recommendation",
    name: "Destination Recommendation",
  },
});