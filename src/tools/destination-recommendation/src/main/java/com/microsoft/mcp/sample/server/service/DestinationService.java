package com.microsoft.mcp.sample.server.service;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Service;

/**
 * Service for providing travel destination recommendations.
 */
@Service
public class DestinationService {

    // Constants for activity types
    public static final String BEACH = "BEACH";
    public static final String ADVENTURE = "ADVENTURE";
    public static final String CULTURAL = "CULTURAL";
    public static final String RELAXATION = "RELAXATION";
    public static final String URBAN_EXPLORATION = "URBAN_EXPLORATION";
    public static final String NATURE = "NATURE";
    public static final String WINTER_SPORTS = "WINTER_SPORTS";
    
    // Constants for budget categories
    public static final String BUDGET = "BUDGET";
    public static final String MODERATE = "MODERATE";
    public static final String LUXURY = "LUXURY";
    
    // Constants for seasons
    public static final String SPRING = "SPRING";
    public static final String SUMMER = "SUMMER";
    public static final String AUTUMN = "AUTUMN";
    public static final String WINTER = "WINTER";
    public static final String ALL_YEAR = "ALL_YEAR";

    /**
     * Echo back the input message
     * @param message The message to echo
     * @return The original message
     */
    @Tool(description = "Echo back the input message exactly as received")
    public String echoMessage(String message) {
        return message;
    }

    /**
     * Recommend destinations based on activity type
     * @param activityType The preferred activity type (BEACH, ADVENTURE, CULTURAL, RELAXATION, URBAN_EXPLORATION, NATURE, WINTER_SPORTS)
     * @return A list of recommended destinations
     */
    @Tool(description = "Get travel destination recommendations based on preferred activity type")
    public String getDestinationsByActivity(String activityType) {
        try {
            String activity = activityType.toUpperCase();
            // Validate activity type
            if (!isValidActivityType(activity)) {
                return "Invalid activity type. Please use one of: BEACH, ADVENTURE, CULTURAL, RELAXATION, URBAN_EXPLORATION, NATURE, WINTER_SPORTS";
            }
            
            return getDestinationsByPreference(activity, null, null, null);
        } catch (Exception e) {
            return "Invalid activity type. Please use one of: BEACH, ADVENTURE, CULTURAL, RELAXATION, URBAN_EXPLORATION, NATURE, WINTER_SPORTS";
        }
    }
    
    // Helper method to validate activity types
    private boolean isValidActivityType(String activityType) {
        return activityType.equals(BEACH) ||
               activityType.equals(ADVENTURE) ||
               activityType.equals(CULTURAL) ||
               activityType.equals(RELAXATION) ||
               activityType.equals(URBAN_EXPLORATION) ||
               activityType.equals(NATURE) ||
               activityType.equals(WINTER_SPORTS);
    }

    /**
     * Recommend destinations based on budget category
     * @param budget The budget category (BUDGET, MODERATE, LUXURY)
     * @return A list of recommended destinations
     */
    @Tool(description = "Get travel destination recommendations based on budget category")
    public String getDestinationsByBudget(String budget) {
        try {
            String budgetCategory = budget.toUpperCase();
            // Validate budget category
            if (!isValidBudgetCategory(budgetCategory)) {
                return "Invalid budget category. Please use one of: BUDGET, MODERATE, LUXURY";
            }
            
            return getDestinationsByPreference(null, budgetCategory, null, null);
        } catch (Exception e) {
            return "Invalid budget category. Please use one of: BUDGET, MODERATE, LUXURY";
        }
    }
    
    // Helper method to validate budget categories
    private boolean isValidBudgetCategory(String budgetCategory) {
        return budgetCategory.equals(BUDGET) ||
               budgetCategory.equals(MODERATE) ||
               budgetCategory.equals(LUXURY);
    }

    /**
     * Recommend destinations based on season
     * @param season The preferred season (SPRING, SUMMER, AUTUMN, WINTER, ALL_YEAR)
     * @return A list of recommended destinations
     */
    @Tool(description = "Get travel destination recommendations based on preferred season")
    public String getDestinationsBySeason(String season) {
        try {
            String preferredSeason = season.toUpperCase();
            // Validate season
            if (!isValidSeason(preferredSeason)) {
                return "Invalid season. Please use one of: SPRING, SUMMER, AUTUMN, WINTER, ALL_YEAR";
            }
            
            return getDestinationsByPreference(null, null, preferredSeason, null);
        } catch (Exception e) {
            return "Invalid season. Please use one of: SPRING, SUMMER, AUTUMN, WINTER, ALL_YEAR";
        }
    }
    
    // Helper method to validate seasons
    private boolean isValidSeason(String season) {
        return season.equals(SPRING) ||
               season.equals(SUMMER) ||
               season.equals(AUTUMN) ||
               season.equals(WINTER) ||
               season.equals(ALL_YEAR);
    }

    /**
     * Recommend destinations based on multiple preferences
     * @param activity The preferred activity type
     * @param budget The budget category
     * @param season The preferred season
     * @param familyFriendly Whether the destination needs to be family-friendly
     * @return A list of recommended destinations
     */
    @Tool(description = "Get travel destination recommendations based on multiple criteria")
    public String getDestinationsByPreferences(String activity, String budget, String season, Boolean familyFriendly) {
        try {
            // Set preferences if provided
            if (activity != null && !activity.isEmpty()) {
                String activityUpper = activity.toUpperCase();
                if (!isValidActivityType(activityUpper)) {
                    return "Invalid activity type. Please use one of: BEACH, ADVENTURE, CULTURAL, RELAXATION, URBAN_EXPLORATION, NATURE, WINTER_SPORTS";
                }
            }
            
            if (budget != null && !budget.isEmpty()) {
                String budgetUpper = budget.toUpperCase();
                if (!isValidBudgetCategory(budgetUpper)) {
                    return "Invalid budget category. Please use one of: BUDGET, MODERATE, LUXURY";
                }
            }
            
            if (season != null && !season.isEmpty()) {
                String seasonUpper = season.toUpperCase();
                if (!isValidSeason(seasonUpper)) {
                    return "Invalid season. Please use one of: SPRING, SUMMER, AUTUMN, WINTER, ALL_YEAR";
                }
            }
            
            return getDestinationsByPreference(activity, budget, season, familyFriendly);
        } catch (Exception e) {
            return "Invalid input. Please check your parameters and try again.\n" + 
                   "Activity types: BEACH, ADVENTURE, CULTURAL, RELAXATION, URBAN_EXPLORATION, NATURE, WINTER_SPORTS\n" +
                   "Budget categories: BUDGET, MODERATE, LUXURY\n" +
                   "Seasons: SPRING, SUMMER, AUTUMN, WINTER, ALL_YEAR";
        }
    }
    
    /**
     * Get all available destinations
     * @return A list of all destinations
     */
    @Tool(description = "Get a list of all available travel destinations")
    public String getAllDestinations() {
        return "Here are some popular travel destinations:\n\n" +
               "📍 Bali, Indonesia\n" +
               "⭐️ Beautiful beaches with vibrant culture and lush landscapes.\n" +
               "🏷️ Activity: BEACH | Budget: MODERATE | Best Season: SUMMER | Family Friendly: Yes\n\n" +
               "📍 Cancun, Mexico\n" +
               "⭐️ White sandy beaches with crystal clear waters and vibrant nightlife.\n" +
               "🏷️ Activity: BEACH | Budget: MODERATE | Best Season: WINTER | Family Friendly: Yes\n\n" +
               "📍 Maldives, Maldives\n" +
               "⭐️ Luxurious overwater bungalows and pristine beaches perfect for relaxation.\n" +
               "🏷️ Activity: BEACH | Budget: LUXURY | Best Season: ALL_YEAR | Family Friendly: Yes";
    }
    
    /**
     * Helper method to get destinations based on preference
     */
    private String getDestinationsByPreference(String activity, String budget, String season, Boolean familyFriendly) {
        // We'll return some hardcoded results based on the preferences
        if (activity != null && activity.equals(BEACH)) {
            return "Here are some beach destinations for you:\n\n" +
                   "📍 Bali, Indonesia\n" +
                   "⭐️ Beautiful beaches with vibrant culture and lush landscapes.\n" +
                   "🏷️ Activity: BEACH | Budget: MODERATE | Best Season: SUMMER | Family Friendly: Yes\n\n" +
                   "📍 Cancun, Mexico\n" +
                   "⭐️ White sandy beaches with crystal clear waters and vibrant nightlife.\n" +
                   "🏷️ Activity: BEACH | Budget: MODERATE | Best Season: WINTER | Family Friendly: Yes\n\n" +
                   "📍 Maldives, Maldives\n" +
                   "⭐️ Luxurious overwater bungalows and pristine beaches perfect for relaxation.\n" +
                   "🏷️ Activity: BEACH | Budget: LUXURY | Best Season: ALL_YEAR | Family Friendly: Yes";
        } else if (activity != null && activity.equals(CULTURAL)) {
            return "Here are some cultural destinations for you:\n\n" +
                   "📍 Kyoto, Japan\n" +
                   "⭐️ Ancient temples, traditional gardens, and rich cultural heritage.\n" +
                   "🏷️ Activity: CULTURAL | Budget: MODERATE | Best Season: SPRING | Family Friendly: Yes\n\n" +
                   "📍 Rome, Italy\n" +
                   "⭐️ Historic city with ancient ruins, art, and delicious cuisine.\n" +
                   "🏷️ Activity: CULTURAL | Budget: MODERATE | Best Season: SPRING | Family Friendly: Yes\n\n" +
                   "📍 Prague, Czech Republic\n" +
                   "⭐️ Historic architecture, affordable dining, and rich cultural experiences.\n" +
                   "🏷️ Activity: CULTURAL | Budget: BUDGET | Best Season: SPRING | Family Friendly: Yes";
        } else if (budget != null && budget.equals(LUXURY)) {
            return "Here are some luxury destinations for you:\n\n" +
                   "📍 Maldives, Maldives\n" +
                   "⭐️ Luxurious overwater bungalows and pristine beaches perfect for relaxation.\n" +
                   "🏷️ Activity: BEACH | Budget: LUXURY | Best Season: ALL_YEAR | Family Friendly: Yes\n\n" +
                   "📍 Santorini, Greece\n" +
                   "⭐️ Beautiful sunsets, white-washed buildings, and Mediterranean cuisine.\n" +
                   "🏷️ Activity: RELAXATION | Budget: LUXURY | Best Season: SUMMER | Family Friendly: Yes\n\n" +
                   "📍 Aspen, USA\n" +
                   "⭐️ World-class skiing, snowboarding, and luxurious alpine village.\n" +
                   "🏷️ Activity: WINTER_SPORTS | Budget: LUXURY | Best Season: WINTER | Family Friendly: No";
        } else if (season != null && season.equals(WINTER)) {
            return "Here are some winter destinations for you:\n\n" +
                   "📍 Aspen, USA\n" +
                   "⭐️ World-class skiing, snowboarding, and luxurious alpine village.\n" +
                   "🏷️ Activity: WINTER_SPORTS | Budget: LUXURY | Best Season: WINTER | Family Friendly: No\n\n" +
                   "📍 Chamonix, France\n" +
                   "⭐️ Epic skiing and snowboarding with stunning Mont Blanc views.\n" +
                   "🏷️ Activity: WINTER_SPORTS | Budget: LUXURY | Best Season: WINTER | Family Friendly: Yes\n\n" +
                   "📍 Cancun, Mexico\n" +
                   "⭐️ White sandy beaches with crystal clear waters and vibrant nightlife.\n" +
                   "🏷️ Activity: BEACH | Budget: MODERATE | Best Season: WINTER | Family Friendly: Yes";
        } else if (familyFriendly != null && familyFriendly) {
            return "Here are some family-friendly destinations for you:\n\n" +
                   "📍 Bali, Indonesia\n" +
                   "⭐️ Beautiful beaches with vibrant culture and lush landscapes.\n" +
                   "🏷️ Activity: BEACH | Budget: MODERATE | Best Season: SUMMER | Family Friendly: Yes\n\n" +
                   "📍 Cancun, Mexico\n" +
                   "⭐️ White sandy beaches with crystal clear waters and vibrant nightlife.\n" +
                   "🏷️ Activity: BEACH | Budget: MODERATE | Best Season: WINTER | Family Friendly: Yes\n\n" +
                   "📍 Kyoto, Japan\n" +
                   "⭐️ Ancient temples, traditional gardens, and rich cultural heritage.\n" +
                   "🏷️ Activity: CULTURAL | Budget: MODERATE | Best Season: SPRING | Family Friendly: Yes";
        } else {
            return "Here are some popular travel destinations:\n\n" +
                   "📍 Bali, Indonesia\n" +
                   "⭐️ Beautiful beaches with vibrant culture and lush landscapes.\n" +
                   "🏷️ Activity: BEACH | Budget: MODERATE | Best Season: SUMMER | Family Friendly: Yes\n\n" +
                   "📍 Kyoto, Japan\n" +
                   "⭐️ Ancient temples, traditional gardens, and rich cultural heritage.\n" +
                   "🏷️ Activity: CULTURAL | Budget: MODERATE | Best Season: SPRING | Family Friendly: Yes\n\n" +
                   "📍 New York City, USA\n" +
                   "⭐️ Iconic skyline, diverse neighborhoods, world-class museums, and entertainment.\n" +
                   "🏷️ Activity: URBAN_EXPLORATION | Budget: LUXURY | Best Season: ALL_YEAR | Family Friendly: Yes";
        }
    }
}