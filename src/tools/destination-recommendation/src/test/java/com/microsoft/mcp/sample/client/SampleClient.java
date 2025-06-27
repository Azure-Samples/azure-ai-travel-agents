package com.microsoft.mcp.sample.client;

/**
 * Legacy MCP client using Java SDK (DEPRECATED).
 * 
 * This client is no longer functional as the server has been migrated
 * to use StreamableHTTP transport and the Java MCP SDK dependencies
 * have been removed.
 * 
 * Use ClientStreamableHttp instead for testing the new HTTP-based implementation.
 * 
 * @deprecated Use {@link ClientStreamableHttp} for MCP StreamableHTTP transport
 */
@Deprecated
public class SampleClient {

    public static void main(String[] args) {
        System.err.println("DEPRECATED: Java SDK-based MCP client is no longer supported.");
        System.err.println("The destination-recommendation server now uses StreamableHTTP transport.");
        System.err.println("Please use ClientStreamableHttp instead.");
        System.err.println();
        System.err.println("Example usage:");
        System.err.println("  java com.microsoft.mcp.sample.client.ClientStreamableHttp");
        System.exit(1);
    }
}
