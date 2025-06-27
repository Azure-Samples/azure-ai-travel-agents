# Destination Recommendation MCP Server - StreamableHTTP Migration

This document describes the migration of the destination-recommendation server from SSE (Server-Sent Events) to StreamableHTTP transport as specified in the MCP protocol.

## Overview

The destination-recommendation server has been updated to support the MCP (Model Context Protocol) StreamableHTTP transport. This change:

1. **Adds a new `/mcp` endpoint** that implements the MCP protocol over HTTP
2. **Maintains backward compatibility** with existing functionality
3. **Follows the MCP specification** for StreamableHTTP transport
4. **Deprecates SSE usage** in favor of the more standardized HTTP approach

## Endpoints

### GET /mcp
Returns HTTP 405 Method Not Allowed as per MCP specification.

**Response:**
```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32601,
    "message": "Method not allowed. Use POST for MCP requests."
  },
  "id": null
}
```

### POST /mcp
Handles MCP protocol requests using JSON-RPC 2.0 format.

**Supported Methods:**
- `initialize` - Initialize the MCP session
- `ping` - Health check ping
- `tools/list` - List available tools
- `tools/call` - Call a specific tool

## Available Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `echoMessage` | Echo back input message | `message: string` |
| `getDestinationsByActivity` | Get destinations by activity type | `activityType: string` (BEACH, ADVENTURE, etc.) |
| `getDestinationsByBudget` | Get destinations by budget category | `budget: string` (BUDGET, MODERATE, LUXURY) |
| `getDestinationsBySeason` | Get destinations by season | `season: string` (SPRING, SUMMER, etc.) |
| `getDestinationsByPreferences` | Get destinations by multiple criteria | `activity, budget, season, familyFriendly` |
| `getAllDestinations` | Get all available destinations | (no parameters) |

## Usage Examples

### Initialize Session
```bash
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "init-1",
    "method": "initialize"
  }'
```

### List Tools
```bash
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "tools-1",
    "method": "tools/list"
  }'
```

### Call Tool
```bash
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "call-1",
    "method": "tools/call",
    "params": {
      "name": "getDestinationsByBudget",
      "arguments": {
        "budget": "MODERATE"
      }
    }
  }'
```

## Testing

A test client is provided to validate the StreamableHTTP implementation:

```bash
# Build and run the test client
javac -cp "$(./mvnw dependency:build-classpath -Dmdep.outputFile=/dev/stdout -q):target/classes" \
  src/test.bak/java/com/microsoft/mcp/sample/client/ClientHttp.java -d target/test-classes

java -cp "$(./mvnw dependency:build-classpath -Dmdep.outputFile=/dev/stdout -q):target/classes:target/test-classes" \
  com.microsoft.mcp.sample.client.ClientHttp
```

## Migration from SSE

The previous SSE-based implementation has been replaced with the StreamableHTTP implementation. Key changes:

1. **Removed SSE dependency**: No longer uses Server-Sent Events
2. **Added HTTP endpoint**: Direct HTTP POST endpoint for MCP protocol
3. **JSON-RPC 2.0**: Uses standard JSON-RPC 2.0 format for all communication
4. **Stateless**: Each request is independent (no persistent connections)

## Implementation Details

The StreamableHTTP implementation:

1. **McpController**: Handles `/mcp` endpoint with GET/POST methods
2. **JSON-RPC Protocol**: Implements JSON-RPC 2.0 specification
3. **Tool Integration**: Maps existing `DestinationService` methods to MCP tools
4. **Error Handling**: Proper MCP error responses with standard error codes
5. **Schema Validation**: Tool input schemas for parameter validation

This implementation follows the MCP specification for StreamableHTTP transport and provides a clean, stateless alternative to SSE-based communication.