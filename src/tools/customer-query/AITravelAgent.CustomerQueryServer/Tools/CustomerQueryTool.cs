using System.ComponentModel;

using AITravelAgent.CustomerQueryServer.Models;

using ModelContextProtocol.Server;

namespace AITravelAgent.CustomerQueryServer.Tools;

[McpServerToolType]
public class CustomerQueryTool(ILogger<CustomerQueryTool> logger)
{
    private static readonly string[] emotions = [ "happy", "sad", "angry", "neutral" ];
    private static readonly string[] intents = [ "book_flight", "cancel_flight", "change_flight", "inquire", "complaint" ];
    private static readonly string[] requirements = [ "business", "economy", "first_class" ];
    private static readonly string[] preferences = [ "window", "aisle", "extra_legroom" ];
    private static readonly Random random = Random.Shared;

    [McpServerTool(Name = "analyze_customer_query", Title = "Analyze Customer Query")]
    [Description("Analyzes the customer query and provides a response.")]
    public async Task<CustomerQueryAnalysisResult> AnalyzeCustomerQueryAsync(
        [Description("The customer query to analyze")] string customerQuery)
    {
        // Simulate some processing time
        await Task.Delay(1000);

        // Log the received customer query
        logger.LogInformation("Received customer query: {customerQuery}", customerQuery);

        // Return a simple response for demonstration purposes
        var result = new CustomerQueryAnalysisResult
        {
            CustomerQuery = customerQuery,
            Emotion = emotions[random.Next(emotions.Length)],
            Intent = intents[random.Next(intents.Length)],
            Requirements = requirements[random.Next(requirements.Length)],
            Preferences = preferences[random.Next(preferences.Length)]
        };

        return result;
    }
}
