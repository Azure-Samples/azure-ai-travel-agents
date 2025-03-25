import { log } from "../utils/instrumentation.js";
import { MCPClient } from "./MCPClient.js";

async function executeCustomerQuery() {
  const customerQueryClient = new MCPClient(
    "mcp-client-customer-query",
    "1.0.0"
  );

  await customerQueryClient.connectToServer(
    "http://tool-customer-query:8080/sse"
  );
  log("Connected to customer MCP server");

  const customerQuery = "Hello world from the customer!";
  const customerResult = await customerQueryClient.processQuery(customerQuery);
  log("Customer Result: ", customerResult);
  // await customerQueryClient.cleanup();
}

async function executeEchoQuery() {
  const echoClient = new MCPClient("mcp-client-echo-ping", "1.0.0");
  await echoClient.connectToServer("http://tool-echo-ping:5000/sse");
  log("Connected to echo MCP server");
  const query = "Hello world from the client!";
  const result = await echoClient.processQuery(query);
  log("Result: ", result);
  // await echoClient.cleanup();
}

await executeEchoQuery();
await executeCustomerQuery();
