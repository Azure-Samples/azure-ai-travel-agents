package com.microsoft.mcp.sample.server.service;

import com.microsoft.mcp.sample.server.model.ActivityType;
import com.microsoft.mcp.sample.server.model.BudgetCategory;
import com.microsoft.mcp.sample.server.model.Destination;
import com.microsoft.mcp.sample.server.model.Season;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.function.Predicate;

/**
 * Streaming version of the DestinationService that provides reactive travel destination recommendations.
 */
@Service
public class StreamingDestinationService {

    private final List<Destination> allDestinations = Arrays.asList(
        new Destination("Bali", "Indonesia", "Beautiful beaches with vibrant culture and lush landscapes", 
                       ActivityType.BEACH, BudgetCategory.MODERATE, Season.SUMMER, true, 4.8, 
                       "https://example.com/bali.jpg", "Temples, Rice Terraces, Surfing"),
        
        new Destination("Cancun", "Mexico", "White sandy beaches with crystal clear waters and vibrant nightlife", 
                       ActivityType.BEACH, BudgetCategory.MODERATE, Season.WINTER, true, 4.6, 
                       "https://example.com/cancun.jpg", "Beaches, Mayan Ruins, Cenotes"),
        
        new Destination("Maldives", "Maldives", "Luxurious overwater bungalows and pristine beaches perfect for relaxation", 
                       ActivityType.BEACH, BudgetCategory.LUXURY, Season.ALL_YEAR, true, 4.9, 
                       "https://example.com/maldives.jpg", "Overwater Villas, Diving, Spas"),
        
        new Destination("Kyoto", "Japan", "Ancient temples, traditional gardens, and rich cultural heritage", 
                       ActivityType.CULTURAL, BudgetCategory.MODERATE, Season.SPRING, true, 4.7, 
                       "https://example.com/kyoto.jpg", "Temples, Gardens, Tea Ceremony"),
        
        new Destination("Rome", "Italy", "Historic city with ancient ruins, art, and delicious cuisine", 
                       ActivityType.CULTURAL, BudgetCategory.MODERATE, Season.SPRING, true, 4.5, 
                       "https://example.com/rome.jpg", "Colosseum, Vatican, Italian Cuisine"),
        
        new Destination("Prague", "Czech Republic", "Historic architecture, affordable dining, and rich cultural experiences", 
                       ActivityType.CULTURAL, BudgetCategory.BUDGET, Season.SPRING, true, 4.4, 
                       "https://example.com/prague.jpg", "Architecture, Beer, Castle"),
        
        new Destination("Santorini", "Greece", "Beautiful sunsets, white-washed buildings, and Mediterranean cuisine", 
                       ActivityType.RELAXATION, BudgetCategory.LUXURY, Season.SUMMER, true, 4.6, 
                       "https://example.com/santorini.jpg", "Sunsets, Wine, Beaches"),
        
        new Destination("Aspen", "USA", "World-class skiing, snowboarding, and luxurious alpine village", 
                       ActivityType.WINTER_SPORTS, BudgetCategory.LUXURY, Season.WINTER, false, 4.3, 
                       "https://example.com/aspen.jpg", "Skiing, Snowboarding, Luxury"),
        
        new Destination("Chamonix", "France", "Epic skiing and snowboarding with stunning Mont Blanc views", 
                       ActivityType.WINTER_SPORTS, BudgetCategory.LUXURY, Season.WINTER, true, 4.5, 
                       "https://example.com/chamonix.jpg", "Skiing, Mont Blanc, Alpine Culture"),
        
        new Destination("New York City", "USA", "Iconic skyline, diverse neighborhoods, world-class museums, and entertainment", 
                       ActivityType.URBAN_EXPLORATION, BudgetCategory.LUXURY, Season.ALL_YEAR, true, 4.2, 
                       "https://example.com/nyc.jpg", "Skyline, Museums, Broadway"),
        
        new Destination("Banff", "Canada", "Stunning mountain landscapes, pristine lakes, and outdoor adventures", 
                       ActivityType.NATURE, BudgetCategory.MODERATE, Season.SUMMER, true, 4.8, 
                       "https://example.com/banff.jpg", "Mountains, Lakes, Wildlife"),
        
        new Destination("Costa Rica", "Costa Rica", "Diverse ecosystems, adventure activities, and wildlife viewing", 
                       ActivityType.ADVENTURE, BudgetCategory.MODERATE, Season.ALL_YEAR, true, 4.6, 
                       "https://example.com/costarica.jpg", "Rainforest, Zip-lining, Wildlife")
    );

    /**
     * Stream all destinations with a delay for demonstration
     */
    @Tool(description = "Stream all available travel destinations in real-time")
    public Flux<String> streamAllDestinations() {
        return Flux.fromIterable(allDestinations)
            .delayElements(Duration.ofMillis(500)) // Simulate streaming delay
            .map(Destination::toFormattedString)
            .doOnNext(destination -> System.out.println("Streaming destination: " + destination.split("\n")[0]));
    }

    /**
     * Stream destinations by activity type
     */
    @Tool(description = "Stream travel destination recommendations based on preferred activity type")
    public Flux<String> streamDestinationsByActivity(String activityType) {
        try {
            ActivityType activity = ActivityType.valueOf(activityType.toUpperCase());
            return streamDestinationsWithFilter(dest -> dest.activity() == activity)
                .switchIfEmpty(Mono.just("No destinations found for activity type: " + activityType).flux());
        } catch (IllegalArgumentException e) {
            return Mono.just("Invalid activity type. Please use one of: " + Arrays.toString(ActivityType.values())).flux();
        }
    }

    /**
     * Stream destinations by budget category
     */
    @Tool(description = "Stream travel destination recommendations based on budget category")
    public Flux<String> streamDestinationsByBudget(String budget) {
        try {
            BudgetCategory budgetCategory = BudgetCategory.valueOf(budget.toUpperCase());
            return streamDestinationsWithFilter(dest -> dest.budget() == budgetCategory)
                .switchIfEmpty(Mono.just("No destinations found for budget category: " + budget).flux());
        } catch (IllegalArgumentException e) {
            return Mono.just("Invalid budget category. Please use one of: " + Arrays.toString(BudgetCategory.values())).flux();
        }
    }

    /**
     * Stream destinations by season
     */
    @Tool(description = "Stream travel destination recommendations based on preferred season")
    public Flux<String> streamDestinationsBySeason(String season) {
        try {
            Season preferredSeason = Season.valueOf(season.toUpperCase());
            return streamDestinationsWithFilter(dest -> dest.season() == preferredSeason || dest.season() == Season.ALL_YEAR)
                .switchIfEmpty(Mono.just("No destinations found for season: " + season).flux());
        } catch (IllegalArgumentException e) {
            return Mono.just("Invalid season. Please use one of: " + Arrays.toString(Season.values())).flux();
        }
    }

    /**
     * Stream destinations based on multiple criteria
     */
    @Tool(description = "Stream travel destination recommendations based on multiple criteria")
    public Flux<String> streamDestinationsByPreferences(String activity, String budget, String season, Boolean familyFriendly) {
        Predicate<Destination> filter = dest -> true;

        try {
            if (activity != null && !activity.isEmpty()) {
                ActivityType activityType = ActivityType.valueOf(activity.toUpperCase());
                filter = filter.and(dest -> dest.activity() == activityType);
            }

            if (budget != null && !budget.isEmpty()) {
                BudgetCategory budgetCategory = BudgetCategory.valueOf(budget.toUpperCase());
                filter = filter.and(dest -> dest.budget() == budgetCategory);
            }

            if (season != null && !season.isEmpty()) {
                Season preferredSeason = Season.valueOf(season.toUpperCase());
                filter = filter.and(dest -> dest.season() == preferredSeason || dest.season() == Season.ALL_YEAR);
            }

            if (familyFriendly != null) {
                filter = filter.and(dest -> dest.familyFriendly() == familyFriendly);
            }

            return streamDestinationsWithFilter(filter)
                .switchIfEmpty(Mono.just("No destinations found matching your criteria").flux());

        } catch (IllegalArgumentException e) {
            return Mono.just("Invalid input parameters. Please check your values and try again.").flux();
        }
    }

    /**
     * Stream destinations that are family-friendly
     */
    @Tool(description = "Stream family-friendly travel destinations")
    public Flux<String> streamFamilyFriendlyDestinations() {
        return streamDestinationsWithFilter(Destination::familyFriendly);
    }

    /**
     * Stream top-rated destinations (rating >= 4.5)
     */
    @Tool(description = "Stream top-rated travel destinations with high ratings")
    public Flux<String> streamTopRatedDestinations() {
        return streamDestinationsWithFilter(dest -> dest.rating() >= 4.5)
            .sort((a, b) -> {
                // Extract rating from the formatted string for sorting (simple approach)
                return b.compareTo(a); // Reverse order for highest rating first
            });
    }

    /**
     * Helper method to stream destinations with a filter
     */
    private Flux<String> streamDestinationsWithFilter(Predicate<Destination> filter) {
        return Flux.fromIterable(allDestinations)
            .filter(filter)
            .delayElements(Duration.ofMillis(300)) // Simulate streaming delay
            .map(Destination::toFormattedString)
            .doOnNext(destination -> System.out.println("Streaming filtered destination: " + destination.split("\n")[0]));
    }

    /**
     * Get destination count for a specific activity (non-streaming utility method)
     */
    @Tool(description = "Get count of destinations available for a specific activity")
    public Mono<String> getDestinationCountByActivity(String activityType) {
        try {
            ActivityType activity = ActivityType.valueOf(activityType.toUpperCase());
            long count = allDestinations.stream()
                .filter(dest -> dest.activity() == activity)
                .count();
            return Mono.just("Found " + count + " destinations for " + activity + " activities");
        } catch (IllegalArgumentException e) {
            return Mono.just("Invalid activity type. Please use one of: " + Arrays.toString(ActivityType.values()));
        }
    }

    /**
     * Echo back the input message (keeping for compatibility)
     */
    @Tool(description = "Echo back the input message exactly as received")
    public Mono<String> echoMessage(String message) {
        return Mono.just(message)
            .delayElement(Duration.ofMillis(100)); // Small delay to demonstrate reactive nature
    }
}
