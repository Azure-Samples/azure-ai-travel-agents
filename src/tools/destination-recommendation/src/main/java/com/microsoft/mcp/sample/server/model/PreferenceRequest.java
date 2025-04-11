package com.microsoft.mcp.sample.server.model;

/**
 * Class representing user preferences for destination recommendations.
 * Using String types instead of enum references to avoid compilation issues.
 */
public class PreferenceRequest {
    private String preferredActivity;  // Changed from ActivityType to String
    private String budgetCategory;     // Changed from BudgetCategory to String
    private String preferredSeason;    // Changed from Season to String
    private Boolean familyFriendly;
    private Integer numberOfDestinations;

    // Default constructor
    public PreferenceRequest() {
        this.numberOfDestinations = 3; // Default to returning 3 destinations
    }

    // Constructor
    public PreferenceRequest(String preferredActivity, String budgetCategory, 
                          String preferredSeason, Boolean familyFriendly, Integer numberOfDestinations) {
        this.preferredActivity = preferredActivity;
        this.budgetCategory = budgetCategory;
        this.preferredSeason = preferredSeason;
        this.familyFriendly = familyFriendly;
        this.numberOfDestinations = numberOfDestinations != null ? numberOfDestinations : 3;
    }

    // Getters and setters
    public String getPreferredActivity() {
        return preferredActivity;
    }

    public void setPreferredActivity(String preferredActivity) {
        this.preferredActivity = preferredActivity;
    }

    public String getBudgetCategory() {
        return budgetCategory;
    }

    public void setBudgetCategory(String budgetCategory) {
        this.budgetCategory = budgetCategory;
    }

    public String getPreferredSeason() {
        return preferredSeason;
    }

    public void setPreferredSeason(String preferredSeason) {
        this.preferredSeason = preferredSeason;
    }

    public Boolean getFamilyFriendly() {
        return familyFriendly;
    }

    public void setFamilyFriendly(Boolean familyFriendly) {
        this.familyFriendly = familyFriendly;
    }

    public Integer getNumberOfDestinations() {
        return numberOfDestinations;
    }

    public void setNumberOfDestinations(Integer numberOfDestinations) {
        this.numberOfDestinations = numberOfDestinations != null ? numberOfDestinations : 3;
    }
}
