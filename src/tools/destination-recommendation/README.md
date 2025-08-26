# Travel Destination Recommendation Service

This service provides travel destination recommendations based on user preferences using the Spring AI MCP Server Boot Starter with Streamable HTTP transport. It helps users discover travel destinations based on activity preferences, budget constraints, seasonal preferences, and family-friendliness.

For more information, see the [MCP Server Boot Starter](https://docs.spring.io/spring-ai/reference/api/mcp/mcp-server-boot-starter-docs.html) reference documentation.

## Overview

The service showcases:
- Support for Streamable HTTP transport (stateless HTTP requests for streaming)
- Automatic tool registration using Spring AI's `@Tool` annotation
- MCP protocol support with JSON-RPC communication
- Destination recommendation tools:
  - Get destinations by activity type (beach, adventure, cultural, etc.)
  - Get destinations by budget category (budget, moderate, luxury)
  - Get destinations by season (spring, summer, autumn, winter)
  - Get destinations by multiple preference criteria
  - Simple message repeating functionality (retained for compatibility)

## Features

This service offers the following capabilities:

1. **Activity-Based Recommendations**: Find destinations based on preferred activities such as:
   - Beach vacations
   - Adventure trips
   - Cultural experiences
   - Relaxation getaways
   - Urban exploration
   - Nature escapes
   - Winter sports

2. **Budget-Conscious Planning**: Filter destinations by budget category:
   - Budget-friendly options
   - Moderate-priced destinations
   - Luxury experiences

3. **Seasonal Recommendations**: Get destinations best suited for your preferred travel season:
   - Spring
   - Summer
   - Autumn
   - Winter
   - Year-round destinations

4. **Family-Friendly Options**: Identify destinations suitable for family travel

5. **Multi-Criteria Search**: Combine multiple preferences to find your perfect destination match

## MCP Protocol Configuration

The service is configured to use the **Streamable HTTP** transport protocol, which provides:
- Stateless HTTP request/response pattern
- No persistent connections required (unlike WebSockets or SSE)
- Better scalability for distributed systems
- Simplified client implementation

### Configuration (application.yml)

```yaml
spring:
  ai:
    mcp:
      server:
        protocol: STREAMABLE
        name: streamable-mcp-server
        version: 1.0.0
        type: SYNC
        instructions: "This streamable server provides real-time notifications"
        resource-change-notification: true
        tool-change-notification: true
        prompt-change-notification: true
        streamable-http:
          mcp-endpoint: /mcp
          keep-alive-interval: 30s
```

## Using the Service

The service exposes the following API endpoints through the MCP protocol:

- `getDestinationsByActivity`: Get destinations matching a specific activity type
- `getDestinationsByBudget`: Get destinations matching a budget category
- `getDestinationsBySeason`: Get destinations ideal for a specific season
- `getDestinationsByPreferences`: Get destinations matching multiple criteria
- `getAllDestinations`: Get a list of all available destinations

### Additional HTTP Endpoints

- `/health` - Health check endpoint returning service status
- `/info` - Service information including available MCP tools
- `/mcp` - MCP protocol endpoint for JSON-RPC communication

## Testing the Server

### Using MCP Inspector

[MCP Inspector](https://github.com/modelcontextprotocol/inspector) is a web-based tool for testing and debugging MCP servers.

1. **Start the server locally**:
   ```bash
   ./mvnw spring-boot:run
   ```
   The server will start on port 8080 by default.

2. **Open MCP Inspector**:
   - Navigate to the [MCP Inspector](https://inspector.mcphub.com/) web interface
   - Or run it locally if you have it installed

3. **Configure the connection**:
   - **Transport Type**: Select `Streamable HTTP`
   - **URL**: `http://localhost:8080/mcp`
   - **Authentication**: Configure if needed (not required for local testing)

4. **Connect and inspect**:
   - Click "Connect" to establish connection with the server
   - Browse available tools, resources, and prompts
   - Execute tool calls and see responses
   - Monitor server notifications

### Using the Streaming Client Test

The project includes comprehensive streaming tests in `StreamingClientTest.java` that validate:

- Health endpoint accessibility
- Service information retrieval
- Multiple sequential requests (core streamable-http pattern)
- Concurrent request handling
- Backpressure management
- Error recovery
- Keep-alive simulation
- Large response handling
- Connection reuse

Run the tests:
```bash
./mvnw test -Dtest=StreamingClientTest
```

### Using the ClientSse Test Client

The project includes a `ClientSse` class that provides a simple client for testing the server. This utility helps you send requests and receive responses from the MCP server endpoints.

Step 1 - Build and run the server (on port 8080)
Step 2 - Run the ClientSse test

## Test Client

A test client is included in the `com.microsoft.mcp.sample.server.client` package. The `DestinationRecommendationClient` class demonstrates how to interact with the service programmatically.

## Dependencies

The project requires the Spring AI MCP Server Streamable Boot Starter:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-mcp-server-streamable-webmvc</artifactId>
    <version>1.0.0-SNAPSHOT</version>
</dependency>
```

This starter provides:
- Streamable HTTP transport for stateless communication
- Auto-configured MCP endpoints
- JSON-RPC protocol support
- Tool registration and discovery

## Building the Project

Build the project using Maven:
```bash
./mvnw clean install -DskipTests
```

## Running the Server

```bash
java -jar target/destination-server-0.0.1-SNAPSHOT.jar
```

Or using Maven:
```bash
./mvnw spring-boot:run
```

## Development with DevContainer

This project includes a DevContainer configuration for Visual Studio Code, providing a consistent development environment:

1. Install [VS Code](https://code.visualstudio.com/) and the [Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension
2. Open the project folder in VS Code
3. Click "Reopen in Container" when prompted or run the "Dev Containers: Reopen in Container" command
4. The container will build and start

See the `.devcontainer` folder for more details.

## Running with Docker

The project includes a Dockerfile for containerization:

```bash
docker build --pull --rm -f 'Dockerfile' -t 'destination-recommendation:latest' '.'  
docker run -d -p 8080:8080 destination-recommendation:latest
```

## Testing the Server

### Using the ClientSse Test Client

The project includes a `ClientSse` class that provides a simple client for testing the server. This utility helps you send requests and receive streaming responses from the MCP server endpoints.

step 1 - Build and run the docker server (on port 8080)
step 2 - Run the ClientSse test

## Security and Code Quality

### GitHub CodeQL Integration

This project integrates with GitHub CodeQL for automated code scanning and security analysis. CodeQL is GitHub's semantic code analysis engine that helps identify vulnerabilities and coding errors by analyzing your code as if it were data.

Benefits of CodeQL integration:
- Automatically detects common vulnerabilities and coding errors
- Runs on each push and pull request to maintain code quality
- Performs language-specific security analysis for Java code
- Generates detailed security reports with actionable insights
- Helps identify security issues early in the development lifecycle

The CodeQL analysis is configured via GitHub Actions workflow and analyzes the codebase for:
- Security vulnerabilities
- Logic errors
- Coding standard violations
- Potential bugs and anti-patterns

The workflow scans the following Java files:
- All `.java` files in the `src/main/java` directory
- All Java classes including controllers, services, and tools
- Model and data transfer objects
- Configuration classes and utility helpers
- Test files in `src/test/java` are also included in the analysis

The CodeQL integration uses the following configuration files:
- `.github/workflows/codeql-java.yml` - Defines the GitHub Actions workflow for Java code scanning
- `.github/codeql/java-config.yml` - Configures paths to include/exclude and specific queries:
  - Includes: `src/tools/destination-recommendation/**`
  - Excludes: `**/target/**`, `**/build/**`, `**/test/**`, `**/tests/**`, `**/*Test.java`, `**/generated/**`
  - Runs both "security-and-quality" and "security-extended" query suites

The workflow triggers on:
- Pushes and PRs to the main branch that modify Java files or configuration files
- Weekly scheduled scans (Sundays at midnight UTC)
- Manual workflow dispatch

For more information on CodeQL, visit [GitHub's CodeQL documentation](https://codeql.github.com/docs/).

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
