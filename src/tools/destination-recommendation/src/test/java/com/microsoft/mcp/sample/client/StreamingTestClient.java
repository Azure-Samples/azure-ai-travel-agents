package com.microsoft.mcp.sample.client;

import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

import java.time.Duration;

/**
 * Test client for the streaming destination recommendation service
 */
public class StreamingTestClient {

    private final WebClient webClient;

    public StreamingTestClient(String baseUrl) {
        this.webClient = WebClient.builder()
            .baseUrl(baseUrl)
            .build();
    }

    public static void main(String[] args) {
        StreamingTestClient client = new StreamingTestClient("http://localhost:8080");
        client.runTests();
    }

    public void runTests() {
        System.out.println("=== Starting Streaming Destination Service Tests ===\n");

        // Test 1: Health check
        testHealthCheck();

        // Test 2: Stream all destinations
        testStreamAllDestinations();

        // Test 3: Stream destinations by activity
        testStreamDestinationsByActivity("BEACH");

        // Test 4: Stream destinations by budget
        testStreamDestinationsByBudget("LUXURY");

        // Test 5: Stream destinations by season
        testStreamDestinationsBySeason("WINTER");

        // Test 6: Stream family-friendly destinations
        testStreamFamilyFriendlyDestinations();

        // Test 7: Stream top-rated destinations
        testStreamTopRatedDestinations();

        // Test 8: Stream destinations by preferences
        testStreamDestinationsByPreferences();

        System.out.println("\n=== All streaming tests completed! ===");
    }

    private void testHealthCheck() {
        System.out.println("1. Testing health check endpoint...");
        try {
            String response = webClient.get()
                .uri("/api/destinations/health")
                .retrieve()
                .bodyToMono(String.class)
                .block(Duration.ofSeconds(5));
            System.out.println("Health check response: " + response);
        } catch (Exception e) {
            System.err.println("Health check failed: " + e.getMessage());
        }
        System.out.println();
    }

    private void testStreamAllDestinations() {
        System.out.println("2. Testing stream all destinations...");
        try {
            Flux<String> stream = webClient.get()
                .uri("/api/destinations/stream/all")
                .accept(MediaType.TEXT_EVENT_STREAM)
                .retrieve()
                .bodyToFlux(String.class);

            stream.take(3) // Take only first 3 for demo
                .doOnNext(destination -> System.out.println("Received: " + destination.split("\n")[0]))
                .blockLast(Duration.ofSeconds(10));
        } catch (Exception e) {
            System.err.println("Stream all destinations failed: " + e.getMessage());
        }
        System.out.println();
    }

    private void testStreamDestinationsByActivity(String activity) {
        System.out.println("3. Testing stream destinations by activity: " + activity);
        try {
            Flux<String> stream = webClient.get()
                .uri("/api/destinations/stream/activity/" + activity)
                .accept(MediaType.TEXT_EVENT_STREAM)
                .retrieve()
                .bodyToFlux(String.class);

            stream.doOnNext(destination -> System.out.println("Received: " + destination.split("\n")[0]))
                .blockLast(Duration.ofSeconds(10));
        } catch (Exception e) {
            System.err.println("Stream destinations by activity failed: " + e.getMessage());
        }
        System.out.println();
    }

    private void testStreamDestinationsByBudget(String budget) {
        System.out.println("4. Testing stream destinations by budget: " + budget);
        try {
            Flux<String> stream = webClient.get()
                .uri("/api/destinations/stream/budget/" + budget)
                .accept(MediaType.TEXT_EVENT_STREAM)
                .retrieve()
                .bodyToFlux(String.class);

            stream.doOnNext(destination -> System.out.println("Received: " + destination.split("\n")[0]))
                .blockLast(Duration.ofSeconds(10));
        } catch (Exception e) {
            System.err.println("Stream destinations by budget failed: " + e.getMessage());
        }
        System.out.println();
    }

    private void testStreamDestinationsBySeason(String season) {
        System.out.println("5. Testing stream destinations by season: " + season);
        try {
            Flux<String> stream = webClient.get()
                .uri("/api/destinations/stream/season/" + season)
                .accept(MediaType.TEXT_EVENT_STREAM)
                .retrieve()
                .bodyToFlux(String.class);

            stream.doOnNext(destination -> System.out.println("Received: " + destination.split("\n")[0]))
                .blockLast(Duration.ofSeconds(10));
        } catch (Exception e) {
            System.err.println("Stream destinations by season failed: " + e.getMessage());
        }
        System.out.println();
    }

    private void testStreamFamilyFriendlyDestinations() {
        System.out.println("6. Testing stream family-friendly destinations...");
        try {
            Flux<String> stream = webClient.get()
                .uri("/api/destinations/stream/family-friendly")
                .accept(MediaType.TEXT_EVENT_STREAM)
                .retrieve()
                .bodyToFlux(String.class);

            stream.take(3) // Take only first 3 for demo
                .doOnNext(destination -> System.out.println("Received: " + destination.split("\n")[0]))
                .blockLast(Duration.ofSeconds(10));
        } catch (Exception e) {
            System.err.println("Stream family-friendly destinations failed: " + e.getMessage());
        }
        System.out.println();
    }

    private void testStreamTopRatedDestinations() {
        System.out.println("7. Testing stream top-rated destinations...");
        try {
            Flux<String> stream = webClient.get()
                .uri("/api/destinations/stream/top-rated")
                .accept(MediaType.TEXT_EVENT_STREAM)
                .retrieve()
                .bodyToFlux(String.class);

            stream.take(3) // Take only first 3 for demo
                .doOnNext(destination -> System.out.println("Received: " + destination.split("\n")[0]))
                .blockLast(Duration.ofSeconds(10));
        } catch (Exception e) {
            System.err.println("Stream top-rated destinations failed: " + e.getMessage());
        }
        System.out.println();
    }

    private void testStreamDestinationsByPreferences() {
        System.out.println("8. Testing stream destinations by preferences...");
        try {
            Flux<String> stream = webClient.get()
                .uri("/api/destinations/stream/preferences?activity=CULTURAL&budget=MODERATE&familyFriendly=true")
                .accept(MediaType.TEXT_EVENT_STREAM)
                .retrieve()
                .bodyToFlux(String.class);

            stream.doOnNext(destination -> System.out.println("Received: " + destination.split("\n")[0]))
                .blockLast(Duration.ofSeconds(10));
        } catch (Exception e) {
            System.err.println("Stream destinations by preferences failed: " + e.getMessage());
        }
        System.out.println();
    }
}
