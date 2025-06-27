package com.microsoft.mcp.sample.server.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.microsoft.mcp.sample.server.service.DestinationService;

import java.util.*;

/**
 * MCP (Model Context Protocol) Controller for StreamableHTTP transport.
 * Provides an /mcp endpoint that implements the MCP protocol over HTTP.
 */
@RestController
@RequestMapping("/mcp")
public class McpController {
    
    private final DestinationService destinationService;
    
    @Autowired
    public McpController(DestinationService destinationService) {
        this.destinationService = destinationService;
    }
    
    /**
     * GET /mcp - Returns method not allowed as per MCP StreamableHTTP specification
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getMcp() {
        Map<String, Object> error = new HashMap<>();
        error.put("jsonrpc", "2.0");
        error.put("error", Map.of(
            "code", -32601,
            "message", "Method not allowed. Use POST for MCP requests."
        ));
        error.put("id", null);
        
        return ResponseEntity.status(405).body(error);
    }
    
    /**
     * POST /mcp - Handles MCP protocol requests
     */
    @PostMapping
    public ResponseEntity<Object> postMcp(@RequestBody Map<String, Object> request) {
        try {
            // Extract method from the JSON-RPC request
            String method = (String) request.get("method");
            String id = (String) request.get("id");
            
            if (method == null) {
                return ResponseEntity.badRequest().body(createErrorResponse(
                    -32600, "Invalid Request", "Missing method field", id));
            }
            
            switch (method) {
                case "tools/list":
                    return ResponseEntity.ok(handleListTools(id));
                    
                case "tools/call":
                    @SuppressWarnings("unchecked")
                    Map<String, Object> params = (Map<String, Object>) request.get("params");
                    return ResponseEntity.ok(handleCallTool(params, id));
                    
                case "initialize":
                    return ResponseEntity.ok(handleInitialize(id));
                    
                case "ping":
                    return ResponseEntity.ok(handlePing(id));
                    
                default:
                    return ResponseEntity.badRequest().body(createErrorResponse(
                        -32601, "Method not found", "Unknown method: " + method, id));
            }
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(createErrorResponse(
                -32603, "Internal error", e.getMessage(), null));
        }
    }
    
    private Map<String, Object> handleInitialize(String id) {
        Map<String, Object> response = new HashMap<>();
        response.put("jsonrpc", "2.0");
        response.put("id", id);
        response.put("result", Map.of(
            "protocolVersion", "2024-11-05",
            "capabilities", Map.of(
                "tools", Map.of()
            ),
            "serverInfo", Map.of(
                "name", "destination-recommendation-server",
                "version", "1.0.0"
            )
        ));
        return response;
    }
    
    private Map<String, Object> handlePing(String id) {
        Map<String, Object> response = new HashMap<>();
        response.put("jsonrpc", "2.0");
        response.put("id", id);
        response.put("result", Map.of());
        return response;
    }
    
    private Map<String, Object> handleListTools(String id) {
        List<Map<String, Object>> tools = Arrays.asList(
            createToolDefinition("echoMessage", 
                "Echo back the input message exactly as received",
                Map.of("message", Map.of(
                    "type", "string",
                    "description", "The message to echo"
                ))),
            createToolDefinition("getDestinationsByActivity", 
                "Get travel destination recommendations based on preferred activity type",
                Map.of("activityType", Map.of(
                    "type", "string",
                    "description", "The preferred activity type (BEACH, ADVENTURE, CULTURAL, RELAXATION, URBAN_EXPLORATION, NATURE, WINTER_SPORTS)"
                ))),
            createToolDefinition("getDestinationsByBudget", 
                "Get travel destination recommendations based on budget category",
                Map.of("budget", Map.of(
                    "type", "string",
                    "description", "The budget category (BUDGET, MODERATE, LUXURY)"
                ))),
            createToolDefinition("getDestinationsBySeason", 
                "Get travel destination recommendations based on preferred season",
                Map.of("season", Map.of(
                    "type", "string",
                    "description", "The preferred season (SPRING, SUMMER, AUTUMN, WINTER, ALL_YEAR)"
                ))),
            createToolDefinition("getDestinationsByPreferences", 
                "Get travel destination recommendations based on multiple criteria",
                Map.of(
                    "activity", Map.of(
                        "type", "string",
                        "description", "The preferred activity type"
                    ),
                    "budget", Map.of(
                        "type", "string", 
                        "description", "The budget category"
                    ),
                    "season", Map.of(
                        "type", "string",
                        "description", "The preferred season"
                    ),
                    "familyFriendly", Map.of(
                        "type", "boolean",
                        "description", "Whether the destination needs to be family-friendly"
                    )
                )),
            createToolDefinition("getAllDestinations", 
                "Get a list of all available travel destinations", 
                Map.of())
        );
        
        Map<String, Object> response = new HashMap<>();
        response.put("jsonrpc", "2.0");
        response.put("id", id);
        response.put("result", Map.of("tools", tools));
        return response;
    }
    
    private Map<String, Object> createToolDefinition(String name, String description, Map<String, Object> properties) {
        Map<String, Object> tool = new HashMap<>();
        tool.put("name", name);
        tool.put("description", description);
        
        Map<String, Object> inputSchema = new HashMap<>();
        inputSchema.put("type", "object");
        inputSchema.put("properties", properties);
        tool.put("inputSchema", inputSchema);
        
        return tool;
    }
    
    private Map<String, Object> handleCallTool(Map<String, Object> params, String id) {
        if (params == null) {
            return createErrorResponse(-32602, "Invalid params", "Missing params", id);
        }
        
        String toolName = (String) params.get("name");
        @SuppressWarnings("unchecked")
        Map<String, Object> arguments = (Map<String, Object>) params.get("arguments");
        
        if (toolName == null) {
            return createErrorResponse(-32602, "Invalid params", "Missing tool name", id);
        }
        
        try {
            String result = callDestinationServiceTool(toolName, arguments);
            
            Map<String, Object> response = new HashMap<>();
            response.put("jsonrpc", "2.0");
            response.put("id", id);
            response.put("result", Map.of(
                "content", Arrays.asList(Map.of(
                    "type", "text",
                    "text", result
                ))
            ));
            return response;
            
        } catch (Exception e) {
            return createErrorResponse(-32603, "Internal error", 
                "Error executing tool " + toolName + ": " + e.getMessage(), id);
        }
    }
    
    private String callDestinationServiceTool(String toolName, Map<String, Object> arguments) {
        switch (toolName) {
            case "echoMessage":
                return destinationService.echoMessage((String) arguments.get("message"));
                
            case "getDestinationsByActivity":
                return destinationService.getDestinationsByActivity((String) arguments.get("activityType"));
                
            case "getDestinationsByBudget":
                return destinationService.getDestinationsByBudget((String) arguments.get("budget"));
                
            case "getDestinationsBySeason":
                return destinationService.getDestinationsBySeason((String) arguments.get("season"));
                
            case "getDestinationsByPreferences":
                return destinationService.getDestinationsByPreferences(
                    (String) arguments.get("activity"),
                    (String) arguments.get("budget"),
                    (String) arguments.get("season"),
                    (Boolean) arguments.get("familyFriendly")
                );
                
            case "getAllDestinations":
                return destinationService.getAllDestinations();
                
            default:
                throw new IllegalArgumentException("Unknown tool: " + toolName);
        }
    }
    
    private Map<String, Object> createErrorResponse(int code, String message, String data, String id) {
        Map<String, Object> error = new HashMap<>();
        error.put("code", code);
        error.put("message", message);
        if (data != null) {
            error.put("data", data);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("jsonrpc", "2.0");
        response.put("error", error);
        response.put("id", id);
        return response;
    }
}