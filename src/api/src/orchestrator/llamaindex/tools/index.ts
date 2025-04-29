import { McpServerDefinition } from "../../../mcp/mcp-tools.js";

export type McpServerName =
  | "echo-ping"
  | "customer-query"
  | "web-search"
  | "itinerary-planning"
  | "model-inference"
  | "code-evaluation"
  | "destination-recommendation";

export const McpToolsConfig = (): {
  [k in McpServerName]: McpServerDefinition;
} => ({
  "echo-ping": {
    config: {
      url: process.env["TOOL_ECHO_PING_URL"] as string,
      verbose: true,
    },
    id: "echo-ping",
    name: "Echo Test",
  },
  "customer-query": {
    config: {
      url: process.env["TOOL_CUSTOMER_QUERY_URL"] as string,
      verbose: true,
    },
    id: "customer-query",
    name: "Customer Query",
  },
  "web-search": {
    config: {
      url: process.env["TOOL_WEB_SEARCH_URL"] as string,
      verbose: true,
    },
    id: "web-search",
    name: "Web Search",
  },
  "itinerary-planning": {
    config: {
      url: process.env["TOOL_ITINERARY_PLANNING_URL"] as string,
      verbose: true,
    },
    id: "itinerary-planning",
    name: "Itinerary Planning",
  },
  "model-inference": {
    config: {
      url: process.env["TOOL_MODEL_INFERENCE_URL"] as string,
      verbose: true,
    },
    id: "model-inference",
    name: "Model Inference",
  },
  "code-evaluation": {
    config: {
      url: process.env["TOOL_CODE_EVALUATION_URL"] as string,
      verbose: true,
    },
    id: "code-evaluation",
    name: "Code Evaluation",
  },
  "destination-recommendation": {
    config: {
      url: process.env["TOOL_DESTINATION_RECOMMENDATION_URL"] as string,
      verbose: true,
    },
    id: "destination-recommendation",
    name: "Destination Recommendation",
  },
});
