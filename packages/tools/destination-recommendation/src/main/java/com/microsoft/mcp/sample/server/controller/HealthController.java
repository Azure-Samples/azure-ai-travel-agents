package com.microsoft.mcp.sample.server.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.microsoft.mcp.sample.server.service.DestinationService;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Controller for health check and information endpoints.
 */
@RestController
public class HealthController {
    
    private final DestinationService destinationService;
    
    @Autowired
    public HealthController(DestinationService destinationService) {
        this.destinationService = destinationService;
    }    /**
     * Simple health check endpoint.
     * 
     * @return Health status information
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("service", "Destination Recommendation Service");
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Information endpoint about the service.
     * 
     * @return Service information
     */
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> serviceInfo() {
        Map<String, Object> response = new HashMap<>();
        response.put("service", "Destination Recommendation Service");
        response.put("version", "1.0.0");
        response.put("endpoint", "/v1/tools");
        
        Map<String, String> tools = new HashMap<>();
        tools.put("getDestinationsByActivity", "Get destinations by activity type (BEACH, ADVENTURE, etc.)");
        tools.put("getDestinationsByBudget", "Get destinations by budget (BUDGET, MODERATE, LUXURY)");
        tools.put("getDestinationsBySeason", "Get destinations by season (SPRING, SUMMER, etc.)");
        tools.put("getDestinationsByPreferences", "Get destinations matching multiple criteria");
        tools.put("getAllDestinations", "Get all available destinations");
        response.put("availableTools", tools);
        
        return ResponseEntity.ok(response);
    }
}
