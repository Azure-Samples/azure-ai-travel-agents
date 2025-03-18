using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace TravelAgents.AppHost;

public static class DistributedApplicationBuilderExensions
{
    public static IResourceBuilder<NodeAppResource> WithNodeDefaults(this IResourceBuilder<NodeAppResource> builder) =>
        builder.WithOtlpExporter()
            .WithEnvironment("NODE_ENV", builder.ApplicationBuilder.Environment.IsDevelopment() ? "development" : "production");

    public static IResourceBuilder<T> WithMcpHealthCheck<T>(this IResourceBuilder<T> builder, HealthStatus? failureStatus = null, string[]? tags = null)
        where T : IResourceWithEndpoints
    {
        var app = builder.ApplicationBuilder;

        string healthCheckName = $"{builder.Resource.Name}-health";

        app.Services.AddHealthChecks()
            .Add(new HealthCheckRegistration(healthCheckName,
                                             sp => new McpServerHealthCheck(builder.Resource, sp.GetRequiredService<ILoggerFactory>()),
                                             failureStatus,
                                             tags));

        return builder.WithHealthCheck(healthCheckName);
    }
}
