import { log, tracer, meter } from "./instrumentation.js";

interface SearchOptions {
  count?: number;
  offset?: number;
  market?: string;
  freshness?: string;
}

interface TravelInfo {
  priceIndicators: string[];
  locationMentions: string[];
  activityTypes: string[];
  ratings: string[];
}

interface ProcessedResult {
  title: string;
  url: string;
  snippet: string;
  dateLastCrawled?: string;
  displayUrl: string;
  travelRelevance: number;
  extractedInfo: TravelInfo;
}

interface SearchResult {
  query: string;
  results: ProcessedResult[];
  totalEstimatedMatches: number;
  metadata: {
    searchTime: number;
    market?: string;
    freshness?: string;
  };
}

export const WebSearchTools = [
  {
    name: "search_travel",
    description: "Search for travel-related information using Bing Search with travel-specific enhancement and scoring",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query for travel information"
        },
        count: {
          type: "number",
          description: "Number of results to return (default: 10, max: 50)",
          minimum: 1,
          maximum: 50
        },
        market: {
          type: "string",
          description: "Market code for search results (e.g., 'en-US', 'en-GB')",
          default: "en-US"
        },
        freshness: {
          type: "string",
          description: "Freshness of search results",
          enum: ["Day", "Week", "Month"],
          default: "Month"
        }
      },
      required: ["query"]
    },
    outputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        results: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              url: { type: "string" },
              snippet: { type: "string" },
              displayUrl: { type: "string" },
              travelRelevance: { type: "number" },
              extractedInfo: {
                type: "object",
                properties: {
                  priceIndicators: { type: "array", items: { type: "string" } },
                  locationMentions: { type: "array", items: { type: "string" } },
                  activityTypes: { type: "array", items: { type: "string" } },
                  ratings: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        },
        totalEstimatedMatches: { type: "number" },
        metadata: {
          type: "object",
          properties: {
            searchTime: { type: "number" },
            market: { type: "string" },
            freshness: { type: "string" }
          }
        }
      }
    },
    async execute(args: { query: string; count?: number; market?: string; freshness?: string }): Promise<SearchResult> {
      return tracer.startActiveSpan("search_travel", async (span) => {
        try {
          log("Received search_travel request", { query: args.query, count: args.count });
          
          // Import WebSearchService dynamically to avoid circular dependencies
          const { WebSearchService } = await import('./web-search-service.js');
          const webSearchService = new WebSearchService();
          
          const result = await webSearchService.searchTravel(args.query, {
            count: args.count || 10,
            market: args.market || 'en-US',
            freshness: args.freshness || 'Month'
          });

          span.addEvent("search_travel_completed", { 
            resultsCount: result.results.length,
            totalMatches: result.totalEstimatedMatches 
          });
          span.end();
          
          return result;
        } catch (error) {
          span.recordException(error as Error);
          span.end();
          throw error;
        }
      });
    },
  },
  {
    name: "search_destinations", 
    description: "Search for travel destinations with enhanced travel context",
    inputSchema: {
      type: "object",
      properties: {
        destination: {
          type: "string",
          description: "The destination to search for"
        },
        travelType: {
          type: "string",
          description: "Type of travel (e.g., 'vacation', 'business', 'adventure')",
          enum: ["vacation", "business", "adventure", "cultural", "family", "romantic"],
          default: "vacation"
        },
        count: {
          type: "number",
          description: "Number of results to return (default: 5)",
          minimum: 1,
          maximum: 20
        }
      },
      required: ["destination"]
    },
    outputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        results: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              url: { type: "string" },
              snippet: { type: "string" },
              displayUrl: { type: "string" },
              travelRelevance: { type: "number" }
            }
          }
        }
      }
    },
    async execute(args: { destination: string; travelType?: string; count?: number }): Promise<SearchResult> {
      return tracer.startActiveSpan("search_destinations", async (span) => {
        try {
          log("Received search_destinations request", { destination: args.destination, travelType: args.travelType });
          
          // Construct travel-specific query
          const travelType = args.travelType || 'vacation';
          const query = `${args.destination} ${travelType} travel attractions things to do visit`;
          
          // Import WebSearchService dynamically to avoid circular dependencies
          const { WebSearchService } = await import('./web-search-service.js');
          const webSearchService = new WebSearchService();
          
          const result = await webSearchService.searchTravel(query, {
            count: args.count || 5,
            market: 'en-US',
            freshness: 'Month'
          });

          span.addEvent("search_destinations_completed", { 
            destination: args.destination,
            resultsCount: result.results.length 
          });
          span.end();
          
          return result;
        } catch (error) {
          span.recordException(error as Error);
          span.end();
          throw error;
        }
      });
    },
  }
];