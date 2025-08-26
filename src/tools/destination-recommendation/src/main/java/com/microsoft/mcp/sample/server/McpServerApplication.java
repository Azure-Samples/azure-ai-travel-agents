package com.microsoft.mcp.sample.server;

import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import com.microsoft.mcp.sample.server.service.StreamingDestinationService;

@SpringBootApplication
public class McpServerApplication {

	public static void main(String[] args) {
		SpringApplication.run(McpServerApplication.class, args);
	}

	/**
	 * Register the StreamingDestinationService tools for reactive streaming
	 */
	@Bean
	public ToolCallbackProvider streamingDestinationTools(StreamingDestinationService streamingDestinationService) {
		return MethodToolCallbackProvider.builder().toolObjects(streamingDestinationService).build();
	}
}
