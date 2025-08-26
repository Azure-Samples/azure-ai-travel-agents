package com.microsoft.mcp.sample.server.controller;

import com.microsoft.mcp.sample.server.service.StreamingDestinationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * REST Controller for streaming destination recommendations via Server-Sent Events (SSE).
 */
@RestController
@RequestMapping("/api/destinations")
@CrossOrigin(origins = "*") // Allow CORS for frontend integration
public class StreamingDestinationController {

    private final StreamingDestinationService streamingDestinationService;

    @Autowired
    public StreamingDestinationController(StreamingDestinationService streamingDestinationService) {
        this.streamingDestinationService = streamingDestinationService;
    }

    /**
     * Stream all destinations via SSE
     */
    @GetMapping(value = "/stream/all", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamAllDestinations() {
        return streamingDestinationService.streamAllDestinations();
    }

    /**
     * Stream destinations by activity type via SSE
     */
    @GetMapping(value = "/stream/activity/{activityType}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamDestinationsByActivity(@PathVariable String activityType) {
        return streamingDestinationService.streamDestinationsByActivity(activityType);
    }

    /**
     * Stream destinations by budget category via SSE
     */
    @GetMapping(value = "/stream/budget/{budget}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamDestinationsByBudget(@PathVariable String budget) {
        return streamingDestinationService.streamDestinationsByBudget(budget);
    }

    /**
     * Stream destinations by season via SSE
     */
    @GetMapping(value = "/stream/season/{season}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamDestinationsBySeason(@PathVariable String season) {
        return streamingDestinationService.streamDestinationsBySeason(season);
    }

    /**
     * Stream destinations based on multiple criteria via SSE
     */
    @GetMapping(value = "/stream/preferences", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamDestinationsByPreferences(
            @RequestParam(required = false) String activity,
            @RequestParam(required = false) String budget,
            @RequestParam(required = false) String season,
            @RequestParam(required = false) Boolean familyFriendly) {
        return streamingDestinationService.streamDestinationsByPreferences(activity, budget, season, familyFriendly);
    }

    /**
     * Stream family-friendly destinations via SSE
     */
    @GetMapping(value = "/stream/family-friendly", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamFamilyFriendlyDestinations() {
        return streamingDestinationService.streamFamilyFriendlyDestinations();
    }

    /**
     * Stream top-rated destinations via SSE
     */
    @GetMapping(value = "/stream/top-rated", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamTopRatedDestinations() {
        return streamingDestinationService.streamTopRatedDestinations();
    }

    /**
     * Get destination count (non-streaming)
     */
    @GetMapping("/count/activity/{activityType}")
    public Mono<String> getDestinationCountByActivity(@PathVariable String activityType) {
        return streamingDestinationService.getDestinationCountByActivity(activityType);
    }

    /**
     * Echo endpoint for testing
     */
    @PostMapping("/echo")
    public Mono<String> echo(@RequestBody String message) {
        return streamingDestinationService.echoMessage(message);
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public Mono<String> health() {
        return Mono.just("Streaming Destination Service is running!");
    }
}
