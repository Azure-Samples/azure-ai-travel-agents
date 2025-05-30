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

export const McpToolsConfig = (): {
  [k in McpServerName]: McpServerDefinition;
} => ({
  "echo-ping": {
    config: {
      url: process.env["MCP_ECHO_PING_URL"] + MCP_API_SSE_PATH,
      verbose: true,
    },
    id: "echo-ping",
    name: "Echo Test",
  },
  "customer-query": {
    config: {
      url: process.env["MCP_CUSTOMER_QUERY_URL"] + MCP_API_SSE_PATH,
      verbose: true,
    },
    id: "customer-query",
    name: "Customer Query",
  },
  "web-search": {
    config: {
      url: process.env["MCP_WEB_SEARCH_URL"] + MCP_API_SSE_PATH,
      verbose: true,
    },
    id: "web-search",
    name: "Web Search",
  },
  "itinerary-planning": {
    config: {
      url: process.env["MCP_ITINERARY_PLANNING_URL"] + MCP_API_SSE_PATH,
      verbose: true,
    },
    id: "itinerary-planning",
    name: "Itinerary Planning",
  },
  "model-inference": {
    config: {
      url: process.env["MCP_MODEL_INFERENCE_URL"] + MCP_API_SSE_PATH,
      verbose: true,
    },
    id: "model-inference",
    name: "Model Inference",
  },
  "code-evaluation": {
    config: {
      url: process.env["MCP_CODE_EVALUATION_URL"] + MCP_API_SSE_PATH,
      verbose: true,
    },
    id: "code-evaluation",
    name: "Code Evaluation",
  },
  "destination-recommendation": {
    config: {
      url: process.env["MCP_DESTINATION_RECOMMENDATION_URL"] + MCP_API_SSE_PATH,
      verbose: true,
    },
    id: "destination-recommendation",
    name: "Destination Recommendation",
  },
});
