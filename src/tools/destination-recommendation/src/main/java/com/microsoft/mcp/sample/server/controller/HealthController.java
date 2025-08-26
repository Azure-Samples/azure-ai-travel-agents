package com.microsoft.mcp.sample.server.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Controller for health check and information endpoints.
 */
@RestController
public class HealthController {

    /**
     * Simple health check endpoint.
     * 
     * @return Health status information
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("service", "Destination Recommendation Streaming Service");
        
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
        response.put("service", "Destination Recommendation Streaming Service");
        response.put("version", "2.0.0-STREAMING");
        response.put("endpoint", "/mcp");
        response.put("protocol", "STREAMABLE");
        
        Map<String, String> tools = new HashMap<>();
        tools.put("streamAllDestinations", "Stream all destinations in real-time");
        tools.put("streamDestinationsByActivity", "Stream destinations by activity type (BEACH, ADVENTURE, etc.)");
        tools.put("streamDestinationsByBudget", "Stream destinations by budget (BUDGET, MODERATE, LUXURY)");
        tools.put("streamDestinationsBySeason", "Stream destinations by season (SPRING, SUMMER, etc.)");
        tools.put("streamDestinationsByPreferences", "Stream destinations matching multiple criteria");
        tools.put("streamFamilyFriendlyDestinations", "Stream family-friendly destinations");
        tools.put("streamTopRatedDestinations", "Stream top-rated destinations");
        tools.put("getDestinationCountByActivity", "Get count of destinations by activity");
        tools.put("echoMessage", "Echo back input message");
        response.put("availableStreamingTools", tools);
        
        Map<String, String> endpoints = new HashMap<>();
        endpoints.put("/api/destinations/stream/all", "SSE stream of all destinations");
        endpoints.put("/api/destinations/stream/activity/{type}", "SSE stream by activity");
        endpoints.put("/api/destinations/stream/budget/{budget}", "SSE stream by budget");
        endpoints.put("/api/destinations/stream/season/{season}", "SSE stream by season");
        endpoints.put("/api/destinations/stream/family-friendly", "SSE stream family-friendly");
        endpoints.put("/api/destinations/stream/top-rated", "SSE stream top-rated");
        endpoints.put("/index.html", "Interactive streaming demo");
        response.put("streamingEndpoints", endpoints);
        
        return ResponseEntity.ok(response);
    }
}
