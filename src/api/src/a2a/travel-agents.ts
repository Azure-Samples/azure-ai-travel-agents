/**
 * A2A Travel Agent Implementation
 * 
 * Adapts existing travel agents to the A2A protocol
 */

import { 
  A2AAgent, 
  AgentCard, 
  AgentCapability, 
  AgentEndpoint,
  A2A_PROTOCOL_VERSION 
} from "./types.js";
import { agent } from "llamaindex";

/**
 * Base A2A Travel Agent that wraps LlamaIndex agents
 */
export class A2ATravelAgent implements A2AAgent {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly capabilities: AgentCapability[];
  
  private llamaAgent: any; // Using any for now due to LlamaIndex type complexity
  private endpoints: AgentEndpoint[];
  private isInitialized: boolean = false;

  constructor(
    id: string,
    name: string,
    description: string,
    capabilities: AgentCapability[],
    llamaAgent: any, // Using any for now due to LlamaIndex type complexity
    baseUrl?: string
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.capabilities = capabilities;
    this.llamaAgent = llamaAgent;
    this.endpoints = baseUrl ? [{
      type: "http",
      url: `${baseUrl}/a2a`,
      methods: ["POST"],
      authentication: { type: "none" }
    }] : [];
  }

  public getCard(): AgentCard {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      version: A2A_PROTOCOL_VERSION,
      capabilities: this.capabilities,
      endpoints: this.endpoints,
      metadata: {
        type: "travel-agent",
        framework: "llamaindex",
        created: new Date().toISOString()
      }
    };
  }

  public async execute(capability: string, input: any, context?: Record<string, any>): Promise<any> {
    if (!this.isInitialized) {
      throw new Error(`Agent ${this.id} is not initialized`);
    }

    const supportedCapability = this.capabilities.find(cap => cap.name === capability);
    if (!supportedCapability) {
      throw new Error(`Capability '${capability}' not supported by agent '${this.id}'`);
    }

    try {
      // Convert A2A input to LlamaIndex chat format
      let message: string;
      
      if (typeof input === 'string') {
        message = input;
      } else if (input && typeof input === 'object') {
        if (input.message) {
          message = input.message;
        } else if (input.query) {
          message = input.query;
        } else {
          message = JSON.stringify(input);
        }
      } else {
        message = String(input);
      }

      // Add context to the message if provided
      if (context) {
        message += `\n\nContext: ${JSON.stringify(context)}`;
      }

      // Execute using LlamaIndex agent
      const response = await this.llamaAgent.chat({ message });
      
      return {
        message: response.message.content,
        metadata: {
          capability,
          agent_id: this.id,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Agent execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async getStatus(): Promise<{ status: string; message?: string; load?: number }> {
    return {
      status: this.isInitialized ? "active" : "inactive",
      message: this.isInitialized ? "Agent is ready" : "Agent not initialized",
      load: 0.1 // TODO: Implement actual load calculation
    };
  }

  public async initialize(): Promise<void> {
    // No specific initialization needed for LlamaIndex agents
    this.isInitialized = true;
  }

  public async shutdown(): Promise<void> {
    this.isInitialized = false;
  }
}

/**
 * Factory for creating A2A-compatible travel agents
 */
export class TravelAgentFactory {
  
  /**
   * Create a Triage Agent for A2A
   */
  public static createTriageAgent(llamaAgent: any, baseUrl?: string): A2ATravelAgent {
    const capabilities: AgentCapability[] = [
      {
        type: "text",
        name: "triage",
        description: "Analyze user queries and determine the best course of action",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "User's travel query" },
            context: { type: "object", description: "Additional context" }
          },
          required: ["query"]
        },
        outputSchema: {
          type: "object",
          properties: {
            message: { type: "string", description: "Response message" },
            next_agent: { type: "string", description: "Recommended next agent" },
            confidence: { type: "number", description: "Confidence score" }
          }
        }
      }
    ];

    return new A2ATravelAgent(
      "triage-agent",
      "Triage Agent",
      "Central coordinator that analyzes queries and routes them to appropriate specialized agents",
      capabilities,
      llamaAgent,
      baseUrl
    );
  }

  /**
   * Create a Customer Query Agent for A2A
   */
  public static createCustomerQueryAgent(llamaAgent: any, baseUrl?: string): A2ATravelAgent {
    const capabilities: AgentCapability[] = [
      {
        type: "text",
        name: "extract_preferences",
        description: "Extract travel preferences from customer inquiries",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Customer's travel inquiry" }
          },
          required: ["query"]
        },
        outputSchema: {
          type: "object",
          properties: {
            preferences: {
              type: "object",
              properties: {
                destination: { type: "string" },
                budget: { type: "number" },
                dates: { type: "object" },
                activities: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      }
    ];

    return new A2ATravelAgent(
      "customer-query-agent",
      "Customer Query Agent",
      "Extracts and structures customer travel preferences from natural language queries",
      capabilities,
      llamaAgent,
      baseUrl
    );
  }

  /**
   * Create a Destination Recommendation Agent for A2A
   */
  public static createDestinationAgent(llamaAgent: any, baseUrl?: string): A2ATravelAgent {
    const capabilities: AgentCapability[] = [
      {
        type: "text",
        name: "recommend_destinations",
        description: "Provide destination recommendations based on preferences",
        inputSchema: {
          type: "object",
          properties: {
            preferences: {
              type: "object",
              properties: {
                budget: { type: "number" },
                season: { type: "string" },
                activities: { type: "array", items: { type: "string" } },
                duration: { type: "number" }
              }
            }
          },
          required: ["preferences"]
        },
        outputSchema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  destination: { type: "string" },
                  score: { type: "number" },
                  reasons: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      }
    ];

    return new A2ATravelAgent(
      "destination-agent",
      "Destination Recommendation Agent",
      "Provides personalized destination recommendations based on customer preferences",
      capabilities,
      llamaAgent,
      baseUrl
    );
  }

  /**
   * Create an Itinerary Planning Agent for A2A
   */
  public static createItineraryAgent(llamaAgent: any, baseUrl?: string): A2ATravelAgent {
    const capabilities: AgentCapability[] = [
      {
        type: "text",
        name: "create_itinerary",
        description: "Create detailed travel itineraries",
        inputSchema: {
          type: "object",
          properties: {
            destination: { type: "string" },
            duration: { type: "number" },
            preferences: { type: "object" },
            budget: { type: "number" }
          },
          required: ["destination", "duration"]
        },
        outputSchema: {
          type: "object",
          properties: {
            itinerary: {
              type: "object",
              properties: {
                days: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      day: { type: "number" },
                      activities: { type: "array", items: { type: "string" } },
                      accommodation: { type: "string" },
                      meals: { type: "array", items: { type: "string" } }
                    }
                  }
                },
                total_cost: { type: "number" }
              }
            }
          }
        }
      }
    ];

    return new A2ATravelAgent(
      "itinerary-agent",
      "Itinerary Planning Agent",
      "Creates detailed travel itineraries with activities, accommodations, and cost estimates",
      capabilities,
      llamaAgent,
      baseUrl
    );
  }

  /**
   * Create a Web Search Agent for A2A
   */
  public static createWebSearchAgent(llamaAgent: any, baseUrl?: string): A2ATravelAgent {
    const capabilities: AgentCapability[] = [
      {
        type: "text",
        name: "search_travel_info",
        description: "Search for current travel information",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
            location: { type: "string", description: "Location filter" },
            type: { type: "string", enum: ["flights", "hotels", "activities", "weather", "general"] }
          },
          required: ["query"]
        },
        outputSchema: {
          type: "object",
          properties: {
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  url: { type: "string" },
                  relevance: { type: "number" }
                }
              }
            }
          }
        }
      }
    ];

    return new A2ATravelAgent(
      "web-search-agent",
      "Web Search Agent",
      "Searches the web for up-to-date travel information using Bing Search",
      capabilities,
      llamaAgent,
      baseUrl
    );
  }
}