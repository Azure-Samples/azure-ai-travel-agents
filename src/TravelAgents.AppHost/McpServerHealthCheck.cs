using McpDotNet.Client;
using McpDotNet.Configuration;
using McpDotNet.Protocol.Transport;
using McpDotNet.Server;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;

namespace TravelAgents.AppHost;

public class McpServerHealthCheck(IResource resource, ILoggerFactory loggerFactory) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        if (!resource.TryGetEndpoints(out var endpoints))
        {
            return HealthCheckResult.Unhealthy("No endpoints found for MCP server.");
        }

        var endpointReference = endpoints.First();

        if (endpointReference.AllocatedEndpoint is null)
        {
            return HealthCheckResult.Unhealthy("No allocated endpoint found for MCP server.");
        }

        var serverConfig = new McpServerConfig
        {
            Id = resource.Name,
            Name = resource.Name,
            TransportType = TransportTypes.Sse,
            Location = $"{endpointReference.AllocatedEndpoint.UriString}/sse",
        };

        var clientConfig = new McpClientOptions { ClientInfo = new() { Name = "HealthCheck", Version = "1.0.0" } };

        McpClientFactory mcpClient = new([serverConfig], clientConfig, loggerFactory);

        try
        {
            var client = await mcpClient.GetClientAsync(resource.Name, cancellationToken);

            await client.PingAsync(cancellationToken);
            return HealthCheckResult.Healthy("MCP server is healthy");
        }
        catch (McpClientException ex)
        {
            return HealthCheckResult.Unhealthy("MCP server failed to respond to the PING request.", ex);
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Unhandled exception when attempting PING request.", ex);
        }
    }
}
