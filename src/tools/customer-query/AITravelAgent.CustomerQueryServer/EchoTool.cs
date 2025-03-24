using ModelContextProtocol.Server;
using System.ComponentModel;

namespace AITravelAgent.CustomerQueryServer;

[McpToolType]
public static class EchoTool
{
    [McpTool("echo"), Description("Echoes the message back to the client.")]
    public static string Echo(string message) => $"hello from .NET: {message}";
}
