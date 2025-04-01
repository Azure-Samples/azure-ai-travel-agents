package com.microsoft.mcp.sample.server;

import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Service;

@Service
public class EchoService {

    /**
     * Echo back the input message
     * @param message The message to echo
     * @return The original message
     */
    @Tool(description = "Echo back the input message exactly as received")
    public String echoMessage(String message) {
        return message;
    }

}