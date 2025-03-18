using Microsoft.Extensions.Hosting;

namespace TravelAgents.AppHost;

public static class DistributedApplicationBuilderExensions
{
    public static IResourceBuilder<NodeAppResource> WithNodeDefaults(this IResourceBuilder<NodeAppResource> builder) =>
        builder.WithOtlpExporter()
            .WithEnvironment("NODE_ENV", builder.ApplicationBuilder.Environment.IsDevelopment() ? "development" : "production");
}
