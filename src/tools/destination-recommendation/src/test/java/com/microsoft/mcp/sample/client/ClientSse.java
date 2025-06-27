package com.microsoft.mcp.sample.client;

/**
 * Legacy SSE-based MCP client (DEPRECATED).
 * 
 * This client is no longer functional as the server has been migrated
 * to use StreamableHTTP transport instead of SSE.
 * 
 * Use ClientStreamableHttp instead for testing the new implementation.
 * 
 * @deprecated Use {@link ClientStreamableHttp} for MCP StreamableHTTP transport
 */
@Deprecated
public class ClientSse {

    public static void main(String[] args) {
        System.err.println("DEPRECATED: SSE-based MCP client is no longer supported.");
        System.err.println("The destination-recommendation server now uses StreamableHTTP transport.");
        System.err.println("Please use ClientStreamableHttp instead.");
        System.err.println();
        System.err.println("Example usage:");
        System.err.println("  java com.microsoft.mcp.sample.client.ClientStreamableHttp");
        System.exit(1);
    }
}
