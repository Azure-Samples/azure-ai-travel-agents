# Creating a Java Customer Query Agent with Spring Boot 3 and LangChain4j MCP

## Project Structure
Here's how to structure your Spring Boot application:
```
customer-query-java/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── aitra/
│   │   │           └── customerquery/
│   │   │               ├── CustomerQueryApplication.java
│   │   │               ├── controller/
│   │   │               │   └── McpController.java
│   │   │               ├── service/
│   │   │               │   └── CustomerQueryService.java
│   │   │               └── config/
│   │   │                   └── AppConfig.java
│   │   └── resources/
│   │       └── application.properties
│   └── test/
│       └── java/
│           └── com/
│               └── aitra/
│                   └── customerquery/
│                       └── CustomerQueryApplicationTests.java
├── Dockerfile
├── pom.xml
└── README.md
```

## Setup Steps
1. Create a Spring Boot project
Use Spring Initializer (https://start.spring.io/) with:
- Project: Maven
- Spring Boot: 3.2.0 or newer
- Dependencies: Spring Web, Actuator

2. Add LangChain4j MCP dependencies
Add these to your pom.xml:
```xml
<!-- LangChain4j Core -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j</artifactId>
    <version>0.26.1</version>
</dependency>
<!-- LangChain4j MCP -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-mcp</artifactId>
    <version>0.26.1</version>
</dependency>
```

3. Create the MCP Controller
```java
package com.aitra.customerquery.controller;

import com.aitra.customerquery.service.CustomerQueryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/v1")
public class McpController {

    @Autowired
    private CustomerQueryService customerQueryService;

    @PostMapping("/mcp")
    public ResponseEntity<Map<String, Object>> processMcpRequest(@RequestBody Map<String, Object> request) {
        // Log the incoming request
        System.out.println("Received MCP request: " + request);
        
        // Extract the user's query from the MCP request
        String userQuery = extractUserQuery(request);
        
        // Process the query using the service
        Map<String, Object> preferences = customerQueryService.extractPreferences(userQuery);
        
        // Format the response according to MCP protocol
        Map<String, Object> response = formatMcpResponse(preferences);
        
        return ResponseEntity.ok(response);
    }
    
    private String extractUserQuery(Map<String, Object> request) {
        // Extract the query from the MCP request structure
        // This is simplified - you'll need to adapt based on actual MCP request format
        try {
            Map<String, Object> inputs = (Map<String, Object>) request.get("inputs");
            return (String) inputs.get("query");
        } catch (Exception e) {
            return "No query provided";
        }
    }
    
    private Map<String, Object> formatMcpResponse(Map<String, Object> preferences) {
        // Create a response that follows the MCP protocol
        // This is simplified - adapt based on MCP specs
        return Map.of(
            "results", Map.of(
                "preferences", preferences,
                "metadata", Map.of("confidence", 0.9)
            ),
            "status", "success"
        );
    }
}
```

4. Create the service to extract preferences
```java
package com.aitra.customerquery.service;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.input.Prompt;
import dev.langchain4j.model.output.Response;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class CustomerQueryService {

    @Autowired
    private ChatLanguageModel chatModel;
    
    public Map<String, Object> extractPreferences(String userQuery) {
        // For demo purposes, extracting preferences with a simple prompt
        String systemPrompt = """
            Extract travel preferences from the user's query. 
            The response should be in JSON format with these fields:
            - destination: where they want to go (if mentioned)
            - duration: how long they want to travel (if mentioned)
            - budget: budget constraints (if mentioned)
            - activities: preferred activities (if mentioned)
            - accommodation: preferred accommodation (if mentioned)
            - transportation: preferred transportation (if mentioned)
            """;
        
        // In a real implementation, we'd use proper JSON parsing
        // This is just a simplified example
        String prompt = systemPrompt + "\nUser query: " + userQuery;
        
        Response<String> response = chatModel.generate(Prompt.of(prompt));
        String responseText = response.content();
        
        // In a real implementation, parse the JSON response
        // For now, just return a simplified map
        Map<String, Object> preferences = new HashMap<>();
        preferences.put("rawResponse", responseText);
        preferences.put("extractedFromQuery", userQuery);
        
        return preferences;
    }
}
```

5. Configure the application
```java
package com.aitra.customerquery.config;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.mcp.client.McpChatLanguageModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AppConfig {

    @Value("${mcp.model.url:http://localhost:8080}")
    private String mcpModelUrl;

    @Bean
    public ChatLanguageModel chatLanguageModel() {
        return McpChatLanguageModel.builder()
            .serviceUrl(mcpModelUrl)
            .build();
    }
}
```

6. Main application class
```java
package com.aitra.customerquery;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CustomerQueryApplication {
    public static void main(String[] args) {
        SpringApplication.run(CustomerQueryApplication.class, args);
    }
}
```

7. Application properties
```
server.port=8080
spring.application.name=customer-query-java
mcp.model.url=http://model-inference:8080/v1/mcp
```

8. Dockerfile
```
FROM openjdk:17-jdk-slim

WORKDIR /app

COPY target/customer-query-java.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
```

9. Build script
```bash
#!/bin/bash
mvn clean package -DskipTests
docker build -t customer-query-java .
```

## Running the Service
Once you have everything set up, you can test locally:
1. Build the JAR: `mvn clean package`
2. Run locally: `java -jar target/customer-query-java.jar`
3. Test with a curl command:
```bash
curl -X POST http://localhost:8080/v1/mcp \
-H "Content-Type: application/json" \
-d '{
  "inputs": {
    "query": "I want to go to Paris for 5 days with my family, budget around $3000"
  }
}'
```