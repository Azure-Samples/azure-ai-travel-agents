package com.aitravelagent.traveldata;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

/**
 * Service class that provides travel data using MCP protocol
 */
public class TravelDataService {
    private static final Logger logger = LoggerFactory.getLogger(TravelDataService.class);
    
    /**
     * Get information about a travel destination
     * 
     * @param request The destination request
     * @return Destination information
     */
    public DestinationInfo getDestinationInfo(DestinationRequest request) {
        logger.info("Received destination info request for: {}", request.destination);
        
        // Return dummy data based on the destination
        return generateDummyDestinationInfo(request.destination);
    }
    
    /**
     * Get hotel recommendations for a destination
     * 
     * @param request The hotel recommendation request
     * @return List of hotel recommendations
     */
    public HotelRecommendationsResponse getHotelRecommendations(HotelRequest request) {
        logger.info("Received hotel recommendation request for: {}, budget: {}", 
                request.destination, request.budget);
        
        // Return dummy hotel recommendations
        return new HotelRecommendationsResponse(generateDummyHotels(request.destination, request.budget));
    }
    
    /**
     * Get information about local attractions at a destination
     * 
     * @param request The attractions request
     * @return List of local attractions
     */
    public AttractionsResponse getLocalAttractions(AttractionsRequest request) {
        logger.info("Received attractions request for: {}, category: {}", 
                request.destination, request.category);
        
        // Return dummy attractions data
        return new AttractionsResponse(generateDummyAttractions(request.destination, request.category));
    }
    
    // Helper methods to generate dummy data
    
    private DestinationInfo generateDummyDestinationInfo(String destination) {
        Map<String, DestinationInfo> dummyData = new HashMap<>();
        
        // Some predefined dummy data for popular destinations
        dummyData.put("paris", new DestinationInfo(
                "Paris",
                "France",
                "Paris is the capital and most populous city of France. It is known as the 'City of Light' and is famous for its art, fashion, gastronomy, and culture.",
                "Euro (EUR)",
                "French",
                "Moderate to high",
                "GMT+1",
                new String[]{"Spring (April-June)", "Fall (September-October)"},
                new String[]{"Eiffel Tower", "Louvre Museum", "Notre-Dame Cathedral"}
        ));
        
        dummyData.put("tokyo", new DestinationInfo(
                "Tokyo",
                "Japan",
                "Tokyo is Japan's capital and the world's most populous metropolis. It offers a seemingly unlimited choice of shopping, entertainment, culture, and dining.",
                "Japanese Yen (JPY)",
                "Japanese",
                "High",
                "GMT+9",
                new String[]{"Spring (March-May)", "Fall (September-November)"},
                new String[]{"Tokyo Skytree", "Meiji Shrine", "Tsukiji Fish Market"}
        ));
        
        dummyData.put("new york", new DestinationInfo(
                "New York City",
                "United States",
                "New York City comprises 5 boroughs sitting where the Hudson River meets the Atlantic Ocean. It's known for its iconic skyscrapers, Broadway theater, and cultural influences.",
                "US Dollar (USD)",
                "English",
                "High",
                "GMT-5",
                new String[]{"Spring (April-June)", "Fall (September-November)"},
                new String[]{"Times Square", "Central Park", "Statue of Liberty"}
        ));
        
        // Default for any destination not in our predefined list
        String normalizedDestination = destination.toLowerCase().trim();
        return dummyData.getOrDefault(normalizedDestination, new DestinationInfo(
                destination,
                "Unknown",
                "We don't have specific information about this destination yet.",
                "Unknown",
                "Unknown",
                "Unknown",
                "Unknown",
                new String[]{"Unknown"},
                new String[]{"No attractions data available"}
        ));
    }
    
    private List<Hotel> generateDummyHotels(String destination, String budget) {
        List<Hotel> hotels = new ArrayList<>();
        String normalizedDestination = destination.toLowerCase().trim();
        
        // Generate different dummy hotels based on destination and budget
        if (normalizedDestination.contains("paris")) {
            hotels.add(new Hotel("Grand Hotel Paris", 4.7, "Luxury", 350, "City center"));
            hotels.add(new Hotel("Seine River View", 4.2, "Boutique", 250, "River bank"));
            hotels.add(new Hotel("Eiffel Apartments", 4.0, "Mid-range", 150, "7th arrondissement"));
            hotels.add(new Hotel("Budget Stay Paris", 3.5, "Economy", 80, "Outskirts"));
        } else if (normalizedDestination.contains("tokyo")) {
            hotels.add(new Hotel("Imperial Tokyo", 4.8, "Luxury", 400, "Chiyoda"));
            hotels.add(new Hotel("Shinjuku Grand", 4.5, "Business", 280, "Shinjuku"));
            hotels.add(new Hotel("Cherry Blossom Inn", 4.1, "Mid-range", 180, "Shibuya"));
            hotels.add(new Hotel("Tokyo Budget Pods", 3.6, "Economy", 70, "Asakusa"));
        } else if (normalizedDestination.contains("new york")) {
            hotels.add(new Hotel("Manhattan Skyline", 4.6, "Luxury", 450, "Manhattan"));
            hotels.add(new Hotel("Central Park View", 4.4, "Premium", 300, "Upper East Side"));
            hotels.add(new Hotel("Brooklyn Heights", 4.2, "Mid-range", 200, "Brooklyn"));
            hotels.add(new Hotel("Queens Budget Stay", 3.7, "Economy", 100, "Queens"));
        } else {
            // Generic hotels for any destination
            hotels.add(new Hotel("Luxury Stay " + destination, 4.5, "Luxury", 300, "City center"));
            hotels.add(new Hotel("Comfortable Inn", 4.0, "Mid-range", 150, "Near attractions"));
            hotels.add(new Hotel("Budget Lodging", 3.5, "Economy", 75, "Outskirts"));
        }
        
        // Filter by budget if specified
        if (budget != null && !budget.isEmpty()) {
            String normalizedBudget = budget.toLowerCase().trim();
            List<Hotel> filteredHotels = new ArrayList<>();
            
            for (Hotel hotel : hotels) {
                if ((normalizedBudget.contains("luxury") || normalizedBudget.contains("high")) && hotel.type.equals("Luxury")) {
                    filteredHotels.add(hotel);
                } else if ((normalizedBudget.contains("mid") || normalizedBudget.contains("moderate")) && hotel.type.equals("Mid-range")) {
                    filteredHotels.add(hotel);
                } else if ((normalizedBudget.contains("budget") || normalizedBudget.contains("economy") || normalizedBudget.contains("low")) && hotel.type.equals("Economy")) {
                    filteredHotels.add(hotel);
                }
            }
            
            // If no hotels match the budget filter, return all options
            return filteredHotels.isEmpty() ? hotels : filteredHotels;
        }
        
        return hotels;
    }
    
    private List<Attraction> generateDummyAttractions(String destination, String category) {
        List<Attraction> attractions = new ArrayList<>();
        String normalizedDestination = destination.toLowerCase().trim();
        String normalizedCategory = category != null ? category.toLowerCase().trim() : "";
        
        if (normalizedDestination.contains("paris")) {
            attractions.add(new Attraction("Eiffel Tower", "Landmark", "The iconic iron tower on the Champ de Mars.", 4.7, 25));
            attractions.add(new Attraction("Louvre Museum", "Museum", "The world's largest art museum.", 4.8, 15));
            attractions.add(new Attraction("Notre-Dame Cathedral", "Historic", "Medieval Catholic cathedral.", 4.6, 0));
            attractions.add(new Attraction("Disneyland Paris", "Entertainment", "Theme park complex.", 4.5, 60));
            attractions.add(new Attraction("Luxembourg Gardens", "Park", "Beautiful public garden.", 4.5, 0));
        } else if (normalizedDestination.contains("tokyo")) {
            attractions.add(new Attraction("Tokyo Skytree", "Landmark", "Tallest tower in Japan.", 4.6, 20));
            attractions.add(new Attraction("Meiji Shrine", "Historic", "Shinto shrine dedicated to Emperor Meiji.", 4.7, 0));
            attractions.add(new Attraction("Tsukiji Fish Market", "Food", "Historic fish market.", 4.4, 0));
            attractions.add(new Attraction("Tokyo Disneyland", "Entertainment", "Theme park complex.", 4.6, 75));
            attractions.add(new Attraction("Ueno Park", "Park", "Spacious public park.", 4.5, 0));
        } else if (normalizedDestination.contains("new york")) {
            attractions.add(new Attraction("Empire State Building", "Landmark", "Art deco skyscraper.", 4.7, 42));
            attractions.add(new Attraction("Metropolitan Museum of Art", "Museum", "One of the world's largest art museums.", 4.8, 25));
            attractions.add(new Attraction("Statue of Liberty", "Historic", "Colossal neoclassical sculpture.", 4.7, 19));
            attractions.add(new Attraction("Broadway", "Entertainment", "Theater district.", 4.8, 75));
            attractions.add(new Attraction("Central Park", "Park", "Urban park in Manhattan.", 4.9, 0));
        } else {
            // Generic attractions for any destination
            attractions.add(new Attraction(destination + " Museum", "Museum", "Main city museum.", 4.3, 10));
            attractions.add(new Attraction(destination + " Park", "Park", "Central city park.", 4.4, 0));
            attractions.add(new Attraction("Historic " + destination, "Historic", "Historic city center.", 4.5, 5));
            attractions.add(new Attraction(destination + " Tower", "Landmark", "Famous city landmark.", 4.6, 15));
        }
        
        // Filter by category if specified
        if (!normalizedCategory.isEmpty()) {
            List<Attraction> filteredAttractions = new ArrayList<>();
            for (Attraction attraction : attractions) {
                if (attraction.category.toLowerCase().contains(normalizedCategory)) {
                    filteredAttractions.add(attraction);
                }
            }
            
            // If no attractions match the category filter, return all options
            return filteredAttractions.isEmpty() ? attractions : filteredAttractions;
        }
        
        return attractions;
    }
    
    // Request and response classes
    
    public static class DestinationRequest {
        @JsonProperty("destination")
        public String destination;
        
        public DestinationRequest() {}
        
        public DestinationRequest(String destination) {
            this.destination = destination;
        }
    }
    
    public static class DestinationInfo {
        @JsonProperty("name")
        public final String name;
        
        @JsonProperty("country")
        public final String country;
        
        @JsonProperty("description")
        public final String description;
        
        @JsonProperty("currency")
        public final String currency;
        
        @JsonProperty("language")
        public final String language;
        
        @JsonProperty("costLevel")
        public final String costLevel;
        
        @JsonProperty("timeZone")
        public final String timeZone;
        
        @JsonProperty("bestTimeToVisit")
        public final String[] bestTimeToVisit;
        
        @JsonProperty("popularAttractions")
        public final String[] popularAttractions;
        
        public DestinationInfo(String name, String country, String description, String currency,
                              String language, String costLevel, String timeZone,
                              String[] bestTimeToVisit, String[] popularAttractions) {
            this.name = name;
            this.country = country;
            this.description = description;
            this.currency = currency;
            this.language = language;
            this.costLevel = costLevel;
            this.timeZone = timeZone;
            this.bestTimeToVisit = bestTimeToVisit;
            this.popularAttractions = popularAttractions;
        }
    }
    
    public static class HotelRequest {
        @JsonProperty("destination")
        public String destination;
        
        @JsonProperty("budget")
        public String budget;
        
        public HotelRequest() {}
        
        public HotelRequest(String destination, String budget) {
            this.destination = destination;
            this.budget = budget;
        }
    }
    
    public static class Hotel {
        @JsonProperty("name")
        public final String name;
        
        @JsonProperty("rating")
        public final double rating;
        
        @JsonProperty("type")
        public final String type;
        
        @JsonProperty("pricePerNight")
        public final double pricePerNight;
        
        @JsonProperty("location")
        public final String location;
        
        public Hotel(String name, double rating, String type, double pricePerNight, String location) {
            this.name = name;
            this.rating = rating;
            this.type = type;
            this.pricePerNight = pricePerNight;
            this.location = location;
        }
    }
    
    public static class HotelRecommendationsResponse {
        @JsonProperty("hotels")
        public final List<Hotel> hotels;
        
        public HotelRecommendationsResponse(List<Hotel> hotels) {
            this.hotels = hotels;
        }
    }
    
    public static class AttractionsRequest {
        @JsonProperty("destination")
        public String destination;
        
        @JsonProperty("category")
        public String category;
        
        public AttractionsRequest() {}
        
        public AttractionsRequest(String destination, String category) {
            this.destination = destination;
            this.category = category;
        }
    }
    
    public static class Attraction {
        @JsonProperty("name")
        public final String name;
        
        @JsonProperty("category")
        public final String category;
        
        @JsonProperty("description")
        public final String description;
        
        @JsonProperty("rating")
        public final double rating;
        
        @JsonProperty("entranceFee")
        public final double entranceFee;
        
        public Attraction(String name, String category, String description, double rating, double entranceFee) {
            this.name = name;
            this.category = category;
            this.description = description;
            this.rating = rating;
            this.entranceFee = entranceFee;
        }
    }
    
    public static class AttractionsResponse {
        @JsonProperty("attractions")
        public final List<Attraction> attractions;
        
        public AttractionsResponse(List<Attraction> attractions) {
            this.attractions = attractions;
        }
    }
}