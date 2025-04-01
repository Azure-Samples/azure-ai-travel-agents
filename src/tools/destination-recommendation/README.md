# Spring AI MCP Echo Server Sample with WebFlux Starter

This sample project demonstrates how to create an MCP server using the Spring AI MCP Server Boot Starter with WebFlux transport. It implements a simple echo service that provides text echo functionality.

For more information, see the [MCP Server Boot Starter](https://docs.spring.io/spring-ai/reference/api/mcp/mcp-server-boot-starter-docs.html) reference documentation.

## Overview

The sample showcases:
- Integration with `spring-ai-mcp-server-webflux-spring-boot-starter`
- Support for SSE (Server-Sent Events)
- Automatic tool registration using Spring AI's `@Tool` annotation
- Echo service tools:
  - Echo back messages exactly as received

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
java -jar target/mcp-echo-starter-webflux-server-0.0.1-SNAPSHOT.jar
```

## Development with DevContainer

This project includes a DevContainer configuration for Visual Studio Code, providing a consistent development environment:

1. Install [VS Code](https://code.visualstudio.com/) and the [Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension
2. Open the project folder in VS Code
3. Click "Reopen in Container" when prompted or run the "Dev Containers: Reopen in Container" command
4. The container will build and start with:
   - Java 21 JDK
   - Maven 3.9.6
   - Required VS Code extensions for Spring and Java development
   - All dependencies pre-installed

See the `.devcontainer` folder for more details.

## Running with Docker

The project includes a Dockerfile for containerization:

```bash
docker build --pull --rm -f 'DockerFile' -t 'starterwebfluxserver:latest' '.'  
docker run -d -p 8080:8080 starterwebfluxserver:latest
```

## Testing the Server

### Using the ClientSse Test Client

The project includes a `ClientSse` class that provides a simple client for testing the server. This utility helps you send requests and receive streaming responses from the MCP server endpoints.

step 1 - Build and run the docker server (on port 8080)
step 2 - Run the ClientSse test

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
