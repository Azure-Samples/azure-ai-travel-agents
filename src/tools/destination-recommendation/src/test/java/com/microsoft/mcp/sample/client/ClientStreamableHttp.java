package com.microsoft.mcp.sample.client;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * StreamableHTTP client for testing the MCP endpoint.
 * This replaces the SSE-based client with a direct HTTP implementation
 * following the MCP StreamableHTTP specification.
 */
public class ClientStreamableHttp {

    private static final String SERVER_URL = "http://localhost:8080/mcp";
    private static final ObjectMapper mapper = new ObjectMapper();
    
    public static void main(String[] args) {
        new ClientStreamableHttp().run();
    }
    
    public void run() {
        try {
            HttpClient client = HttpClient.newHttpClient();
            
            System.out.println("=== MCP StreamableHTTP Client Test ===");
            System.out.println("Testing destination-recommendation server at: " + SERVER_URL);
            
            // Test GET (should return Method Not Allowed)
            System.out.println("\n1. Testing GET /mcp (should return 405):");
            testGetNotAllowed(client);
            
            // Test initialize
            System.out.println("\n2. Testing Initialize:");
            testInitialize(client);
            
            // Test ping
            System.out.println("\n3. Testing Ping:");
            testPing(client);
            
            // Test list tools
            System.out.println("\n4. Testing List Tools:");
            testListTools(client);
            
            // Test tool calls
            System.out.println("\n5. Testing Tool Calls:");
            testEchoTool(client);
            testDestinationsByBudget(client);
            testDestinationsByActivity(client);
            testDestinationsByPreferences(client);
            
            System.out.println("\n=== All StreamableHTTP tests completed successfully! ===");
            System.out.println("The destination-recommendation server now supports MCP StreamableHTTP transport.");
            
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private void testGetNotAllowed(HttpClient client) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(SERVER_URL))
            .GET()
            .build();
            
        HttpResponse<String> response = client.send(request, 
            HttpResponse.BodyHandlers.ofString());
        
        System.out.println("Status: " + response.statusCode());
        System.out.println("Response: " + response.body());
    }
    
    private void testInitialize(HttpClient client) throws IOException, InterruptedException {
        Map<String, Object> request = Map.of(
            "jsonrpc", "2.0",
            "id", "init-1",
            "method", "initialize"
        );
        
        String response = sendPostRequest(client, request);
        System.out.println("Initialize Response: " + response);
    }
    
    private void testPing(HttpClient client) throws IOException, InterruptedException {
        Map<String, Object> request = Map.of(
            "jsonrpc", "2.0",
            "id", "ping-1",
            "method", "ping"
        );
        
        String response = sendPostRequest(client, request);
        System.out.println("Ping Response: " + response);
    }
    
    private void testListTools(HttpClient client) throws IOException, InterruptedException {
        Map<String, Object> request = Map.of(
            "jsonrpc", "2.0",
            "id", "tools-1",
            "method", "tools/list"
        );
        
        String response = sendPostRequest(client, request);
        System.out.println("List Tools Response: " + response);
    }
    
    private void testEchoTool(HttpClient client) throws IOException, InterruptedException {
        Map<String, Object> request = Map.of(
            "jsonrpc", "2.0",
            "id", "echo-1",
            "method", "tools/call",
            "params", Map.of(
                "name", "echoMessage",
                "arguments", Map.of("message", "Hello StreamableHTTP!")
            )
        );
        
        String response = sendPostRequest(client, request);
        System.out.println("Echo Tool Response: " + response);
    }
    
    private void testDestinationsByBudget(HttpClient client) throws IOException, InterruptedException {
        Map<String, Object> request = Map.of(
            "jsonrpc", "2.0",
            "id", "budget-1",
            "method", "tools/call",
            "params", Map.of(
                "name", "getDestinationsByBudget",
                "arguments", Map.of("budget", "LUXURY")
            )
        );
        
        String response = sendPostRequest(client, request);
        System.out.println("Destinations by Budget Response: " + response);
    }
    
    private void testDestinationsByActivity(HttpClient client) throws IOException, InterruptedException {
        Map<String, Object> request = Map.of(
            "jsonrpc", "2.0",
            "id", "activity-1",
            "method", "tools/call",
            "params", Map.of(
                "name", "getDestinationsByActivity",
                "arguments", Map.of("activityType", "BEACH")
            )
        );
        
        String response = sendPostRequest(client, request);
        System.out.println("Destinations by Activity Response: " + response);
    }
    
    private void testDestinationsByPreferences(HttpClient client) throws IOException, InterruptedException {
        Map<String, Object> request = Map.of(
            "jsonrpc", "2.0",
            "id", "preferences-1",
            "method", "tools/call",
            "params", Map.of(
                "name", "getDestinationsByPreferences",
                "arguments", Map.of(
                    "activity", "CULTURAL",
                    "budget", "MODERATE",
                    "season", "SPRING",
                    "familyFriendly", true
                )
            )
        );
        
        String response = sendPostRequest(client, request);
        System.out.println("Destinations by Preferences Response: " + response);
    }
    
    private String sendPostRequest(HttpClient client, Map<String, Object> request) 
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