# Travel Destination Recommendation Service

This service provides travel destination recommendations based on user preferences using **MCP (Model Context Protocol) StreamableHTTP transport**. It helps users discover travel destinations based on activity preferences, budget constraints, seasonal preferences, and family-friendliness.

## 🚀 Migration to StreamableHTTP

**This server has been updated to use MCP StreamableHTTP transport**, replacing the previous SSE-based implementation. The new implementation:

- ✅ Uses standard HTTP POST requests with JSON-RPC 2.0 protocol
- ✅ Follows the [MCP StreamableHTTP specification](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#streamable-http)
- ✅ Provides a stateless, more reliable communication protocol
- ✅ Deprecates SSE (Server-Sent Events) approach

## Overview

The service showcases:
- **StreamableHTTP MCP Protocol**: Uses `/mcp` endpoint with JSON-RPC 2.0
- **Tool Registration**: Direct mapping of Java methods to MCP tools
- **Destination Recommendation Tools**:
  - Get destinations by activity type (beach, adventure, cultural, etc.)
  - Get destinations by budget category (budget, moderate, luxury)
  - Get destinations by season (spring, summer, autumn, winter)
  - Get destinations by multiple preference criteria
  - Echo functionality for testing

## Features

This service offers the following capabilities:

1. **Activity-Based Recommendations**: Find destinations based on preferred activities such as:
   - Beach vacations (BEACH)
   - Adventure trips (ADVENTURE)
   - Cultural experiences (CULTURAL)
   - Relaxation getaways (RELAXATION)
   - Urban exploration (URBAN_EXPLORATION)
   - Nature escapes (NATURE)
   - Winter sports (WINTER_SPORTS)

2. **Budget-Conscious Planning**: Filter destinations by budget category:
   - Budget-friendly options (BUDGET)
   - Moderate-priced destinations (MODERATE)
   - Luxury experiences (LUXURY)

3. **Seasonal Recommendations**: Get destinations best suited for your preferred travel season:
   - Spring (SPRING)
   - Summer (SUMMER)
   - Autumn (AUTUMN)
   - Winter (WINTER)
   - Year-round destinations (ALL_YEAR)

4. **Family-Friendly Options**: Identify destinations suitable for family travel

5. **Multi-Criteria Search**: Combine multiple preferences to find your perfect destination match

## MCP StreamableHTTP API

The service exposes an `/mcp` endpoint that implements the MCP protocol:

### Endpoint
- **URL**: `http://localhost:8080/mcp`
- **Method**: POST (GET returns 405 Method Not Allowed)
- **Content-Type**: `application/json`
- **Protocol**: JSON-RPC 2.0

### Available Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `echoMessage` | Echo back input message | `message: string` |
| `getDestinationsByActivity` | Get destinations by activity type | `activityType: string` |
| `getDestinationsByBudget` | Get destinations by budget category | `budget: string` |
| `getDestinationsBySeason` | Get destinations by season | `season: string` |
| `getDestinationsByPreferences` | Get destinations by multiple criteria | `activity?, budget?, season?, familyFriendly?` |
| `getAllDestinations` | Get all available destinations | (no parameters) |

### Usage Examples

#### List Tools
```bash
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "1",
    "method": "tools/list"
  }'
```

#### Call Tool
```bash
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "2",
    "method": "tools/call",
    "params": {
      "name": "getDestinationsByBudget",
      "arguments": {
        "budget": "MODERATE"
      }
    }
  }'
```

## Test Clients

### StreamableHTTP Client (Recommended)
Use the new `ClientStreamableHttp` class to test the MCP endpoint:

```bash
# Compile and run the test client
javac -cp "$(./mvnw dependency:build-classpath -Dmdep.outputFile=/dev/stdout -q):target/classes" \
  src/test/java/com/microsoft/mcp/sample/client/ClientStreamableHttp.java -d target/test-classes

java -cp "$(./mvnw dependency:build-classpath -Dmdep.outputFile=/dev/stdout -q):target/classes:target/test-classes" \
  com.microsoft.mcp.sample.client.ClientStreamableHttp
```

### Legacy Clients (Deprecated)
- `ClientSse` - SSE-based client (no longer functional)
- `SampleClient` - Java SDK client (no longer functional)

## Building the Project

Build the project using Maven:
```bash
./mvnw clean compile
```

## Running the Server

```bash
./mvnw spring-boot:run
```

The server will start on port 8080 and display:
```
 _____            _   _             _   _                 
|  __ \          | | (_)           | | (_)                
| |  | | ___  ___| |_ _ _ __   __ _| |_ _  ___  _ __  ___ 
| |  | |/ _ \/ __| __| | '_ \ / _` | __| |/ _ \| '_ \/ __|
| |__| |  __/\__ \ |_| | | | | (_| | |_| | (_) | | | \__ \
|_____/ \___||___/\__|_|_| |_|\__,_|\__|_|\___/|_| |_|___/
                                                           
Recommendation Service v1.0
Spring AI MCP-enabled Travel Assistant
```

## Dependencies

The project uses standard Spring Boot dependencies:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

**Note**: The previous Spring AI MCP WebFlux dependency has been replaced with a direct StreamableHTTP implementation.

## Running with Docker

The project includes a Dockerfile for containerization:

```bash
docker build --pull --rm -f 'Dockerfile' -t 'destination-recommendation:latest' '.'  
docker run -d -p 8080:8080 destination-recommendation:latest
```

## Development

### Requirements
- Java 17
- Maven 3.6+

### Development with DevContainer
This project includes a DevContainer configuration for Visual Studio Code, providing a consistent development environment.

## Migration Notes

For detailed information about the migration from SSE to StreamableHTTP, see:
- [STREAMABLE-HTTP-MIGRATION.md](STREAMABLE-HTTP-MIGRATION.md) - Detailed migration documentation
- [MCP Specification](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#streamable-http) - Official StreamableHTTP specification

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.