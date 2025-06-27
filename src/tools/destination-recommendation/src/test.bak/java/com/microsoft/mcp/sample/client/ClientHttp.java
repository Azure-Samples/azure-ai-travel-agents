package com.microsoft.mcp.sample.client;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Simple HTTP client for testing the StreamableHTTP MCP endpoint.
 * This replaces the SSE-based client with a direct HTTP implementation.
 */
public class ClientHttp {

    private static final String SERVER_URL = "http://localhost:8080/mcp";
    private static final ObjectMapper mapper = new ObjectMapper();
    
    public static void main(String[] args) {
        new ClientHttp().run();
    }
    
    public void run() {
        try {
            HttpClient client = HttpClient.newHttpClient();
            
            // Test initialize
            System.out.println("=== Testing Initialize ===");
            testInitialize(client);
            
            // Test ping
            System.out.println("\n=== Testing Ping ===");
            testPing(client);
            
            // Test list tools
            System.out.println("\n=== Testing List Tools ===");
            testListTools(client);
            
            // Test tool call
            System.out.println("\n=== Testing Tool Call ===");
            testToolCall(client);
            
            System.out.println("\n=== All tests completed successfully! ===");
            
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private void testInitialize(HttpClient client) throws IOException, InterruptedException {
        Map<String, Object> request = Map.of(
            "jsonrpc", "2.0",
            "id", "init-1",
            "method", "initialize"
        );
        
        String response = sendRequest(client, request);
        System.out.println("Initialize Response: " + response);
    }
    
    private void testPing(HttpClient client) throws IOException, InterruptedException {
        Map<String, Object> request = Map.of(
            "jsonrpc", "2.0",
            "id", "ping-1",
            "method", "ping"
        );
        
        String response = sendRequest(client, request);
        System.out.println("Ping Response: " + response);
    }
    
    private void testListTools(HttpClient client) throws IOException, InterruptedException {
        Map<String, Object> request = Map.of(
            "jsonrpc", "2.0",
            "id", "tools-1",
            "method", "tools/list"
        );
        
        String response = sendRequest(client, request);
        System.out.println("List Tools Response: " + response);
    }
    
    private void testToolCall(HttpClient client) throws IOException, InterruptedException {
        Map<String, Object> request = Map.of(
            "jsonrpc", "2.0",
            "id", "call-1",
            "method", "tools/call",
            "params", Map.of(
                "name", "getDestinationsByBudget",
                "arguments", Map.of("budget", "MODERATE")
            )
        );
        
        String response = sendRequest(client, request);
        System.out.println("Tool Call Response: " + response);
    }
    
    private String sendRequest(HttpClient client, Map<String, Object> request) 
            throws IOException, InterruptedException {
        
        String jsonRequest = mapper.writeValueAsString(request);
        
        HttpRequest httpRequest = HttpRequest.newBuilder()
            .uri(URI.create(SERVER_URL))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(jsonRequest))
            .build();
            
        HttpResponse<String> response = client.send(httpRequest, 
            HttpResponse.BodyHandlers.ofString());
            
        return response.body();
    }
}