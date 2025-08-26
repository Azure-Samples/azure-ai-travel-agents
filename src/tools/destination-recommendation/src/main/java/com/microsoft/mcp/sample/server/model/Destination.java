package com.microsoft.mcp.sample.server.model;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Represents a travel destination with all its attributes.
 */
public record Destination(
    @JsonProperty("name") String name,
    @JsonProperty("country") String country,
    @JsonProperty("description") String description,
    @JsonProperty("activity") ActivityType activity,
    @JsonProperty("budget") BudgetCategory budget,
    @JsonProperty("season") Season season,
    @JsonProperty("familyFriendly") boolean familyFriendly,
    @JsonProperty("rating") double rating,
    @JsonProperty("imageUrl") String imageUrl,
    @JsonProperty("highlights") String highlights
) {
    
    /**
     * Creates a formatted string representation for display
     */
    public String toFormattedString() {
        return String.format("📍 %s, %s\n⭐️ %s\n🏷️ Activity: %s | Budget: %s | Best Season: %s | Family Friendly: %s | Rating: %.1f\n",
            name, country, description, activity, budget, season, familyFriendly ? "Yes" : "No", rating);
    }
}