# Travel Destination Recommendation Service

This service provides travel destination recommendations based on user preferences using the Spring AI MCP Server Boot Starter with WebFlux transport. It helps users discover travel destinations based on activity preferences, budget constraints, seasonal preferences, and family-friendliness.

For more information, see the [MCP Server Boot Starter](https://docs.spring.io/spring-ai/reference/api/mcp/mcp-server-boot-starter-docs.html) reference documentation.

## Overview

The service showcases:
- Support for SSE (Server-Sent Events)
- Automatic tool registration using Spring AI's `@Tool` annotation
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

## Using the Service

The service exposes the following API endpoints through the MCP protocol:

- `getDestinationsByActivity`: Get destinations matching a specific activity type
- `getDestinationsByBudget`: Get destinations matching a budget category
- `getDestinationsBySeason`: Get destinations ideal for a specific season
- `getDestinationsByPreferences`: Get destinations matching multiple criteria
- `getAllDestinations`: Get a list of all available destinations

## Test Client

A test client is included in the `com.microsoft.mcp.sample.server.client` package. The `DestinationRecommendationClient` class demonstrates how to interact with the service programmatically.

## Dependencies

The project requires the Spring AI MCP Server WebFlux Boot Starter:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-mcp-server-webflux-spring-boot-starter</artifactId>
</dependency>
```

This starter provides:
- Reactive transport using Spring WebFlux (`WebFluxSseServerTransport`)
- Auto-configured reactive SSE endpoints
- Included `spring-boot-starter-webflux` and `mcp-spring-webflux` dependencies

## Building the Project

Build the project using Maven:
```bash
./mvnw clean install -DskipTests
```

## Running the Server

```bash
java -jar target/destination-server-0.0.1-SNAPSHOT.jar
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
