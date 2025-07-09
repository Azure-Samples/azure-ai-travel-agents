namespace AITravelAgent.CustomerQueryServer.Models;

public class CustomerQueryAnalysisResult
{
    public string? CustomerQuery { get; set; }
    public string? Emotion { get; set; }
    public string? Intent { get; set; }
    public string? Requirements { get; set; }
    public string? Preferences { get; set; }
}
