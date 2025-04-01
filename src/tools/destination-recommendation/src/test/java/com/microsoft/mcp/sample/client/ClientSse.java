package com.microsoft.mcp.sample.client;

import io.modelcontextprotocol.client.transport.WebFluxSseClientTransport;

import org.springframework.web.reactive.function.client.WebClient;

public class ClientSse {

	public static void main(String[] args) {
		var transport = new WebFluxSseClientTransport(WebClient.builder().baseUrl("http://localhost:8080"));
		new SampleClient(transport).run();
	}

}
