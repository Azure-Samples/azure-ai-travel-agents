package com.microsoft.mcp.sample.client;

import java.util.Map;

import io.modelcontextprotocol.client.McpClient;
import io.modelcontextprotocol.spec.McpClientTransport;
import io.modelcontextprotocol.spec.McpSchema.CallToolRequest;
import io.modelcontextprotocol.spec.McpSchema.CallToolResult;
import io.modelcontextprotocol.spec.McpSchema.ListToolsResult;

public class SampleClient {

	private final McpClientTransport transport;

	public SampleClient(McpClientTransport transport) {
		this.transport = transport;
	}

	public void run() {

		var client = McpClient.sync(this.transport).build();
		client.initialize();

		client.ping();

		// List and demonstrate streaming tools
		ListToolsResult toolsList = client.listTools();
		System.out.println("Available Streaming Tools = " + toolsList);
		
		// Call the streaming tools
		CallToolResult streamingResult = client.callTool(new CallToolRequest("streamDestinationsByBudget", 
				Map.of("budget", "MODERATE")));
		System.out.println("Stream Destinations By Budget Result: " + streamingResult);

		// Test streaming by activity
		CallToolResult activityResult = client.callTool(new CallToolRequest("streamDestinationsByActivity", 
				Map.of("activityType", "BEACH")));
		System.out.println("Stream Beach Destinations Result: " + activityResult);

		// Test echo with streaming
		CallToolResult echoResult = client.callTool(new CallToolRequest("echoMessage", 
				Map.of("message", "Testing streaming echo!")));
		System.out.println("Streaming Echo Result: " + echoResult);

		client.closeGracefully();
	}
}
