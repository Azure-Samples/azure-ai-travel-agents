import { McpServerDefinition } from "../../../mcp/mcp-tools.js";

export type McpServerName =
  | "echo-ping"
  | "customer-query"
  | "web-search"
  | "itinerary-planning"
  | "model-inference"
  | "code-evaluation";

export const McpToolsConfig = (): {
  [k in McpServerName]: McpServerDefinition;
} => ({
  "echo-ping": {
    serverUrl: process.env["TOOL_ECHO_PING_URL"] as string,
    serverName: "echo-ping",
  },
  "customer-query": {
    serverUrl: process.env["TOOL_CUSTOMER_QUERY_URL"] as string,
    serverName: "customer-query",
  },
  "web-search": {
    serverUrl: process.env["TOOL_WEB_SEARCH_URL"] as string,
    serverName: "web-search",
  },
  "itinerary-planning": {
    serverUrl: process.env["TOOL_ITINERARY_PLANNING_URL"] as string,
    serverName: "itinerary-planning",
  },
  "model-inference": {
    serverUrl: process.env["TOOL_MODEL_INFERENCE_URL"] as string,
    serverName: "model-inference",
  },
  "code-evaluation": {
    serverUrl: process.env["TOOL_CODE_EVALUATION_URL"] as string,
    serverName: "code-evaluation",
  },
});
