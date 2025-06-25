---
title: mcp-servers
createTime: 2025/06/06 13:07:02
permalink: /article/6rbv3t1r/
---
# MCP Server Implementation Guide

This document provides comprehensive technical documentation for each Model Context Protocol (MCP) server in the Azure AI Travel Agents system, organized by programming language and including detailed implementation examples.

## Table of Contents

1. [MCP Overview](#mcp-overview)
2. [Multi-Language Server Implementations](#multi-language-server-implementations)
3. [TypeScript/Node.js Servers](#typescriptnodejs-servers)
4. [C#/.NET Servers](#cnet-servers)
5. [Java/Spring Boot Servers](#javaspring-boot-servers)
6. [Python Servers](#python-servers)
7. [Communication Protocols](#communication-protocols)
8. [Development Patterns](#development-patterns)
9. [Testing and Deployment](#testing-and-deployment)

## MCP Overview

### What is Model Context Protocol (MCP)?

Model Context Protocol is a standardized communication protocol that enables AI models to securely access external tools and data sources. In the Azure AI Travel Agents system, MCP serves as the bridge between the LlamaIndex.TS orchestrator and specialized service implementations.

### Key MCP Concepts

- **Server**: Provides tools and resources to AI models
- **Client**: Consumes tools and resources from servers  
- **Tool**: A function that can be called by AI models
- **Resource**: Data or content that can be accessed by AI models
- **Protocol**: HTTP/SSE-based communication standard

### MCP in Azure AI Travel Agents

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ LlamaIndex.TS   │    │   MCP Client    │    │   MCP Server    │
│ Agent           │    │                 │    │                 │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ - Tool calling  │    │ - Protocol      │    │ - Tool impl.    │
│ - Response      │    │   handling      │    │ - Business      │
│   processing    │    │ - Error mgmt    │    │   logic         │
│ - Agent logic   │    │ - Retry logic   │    │ - External APIs │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Multi-Language Server Implementations

The Azure AI Travel Agents system demonstrates MCP server implementations across four different programming languages, each showcasing different aspects of the protocol and various technology stacks.

### Implementation Overview

| Server | Language | Framework | Purpose | Port |
|--------|----------|-----------|---------|------|
| Echo Ping | TypeScript | Node.js/Express | Testing & Validation | 5007 |
| Web Search | TypeScript | Node.js/Express | Real-time Search | 5006 |
| Customer Query | C#/.NET | ASP.NET Core | NLP Processing | 5001 |
| Destination Recommendation | Java | Spring Boot | ML Recommendations | 5002 |
| Itinerary Planning | Python | FastAPI | Trip Planning | 5003 |
| Code Evaluation | Python | FastAPI | Code Execution | 5004 |
| Model Inference | Python | FastAPI/vLLM | AI Model Inference | 5005 |

### Language-Specific Advantages

- **TypeScript/Node.js**: Rapid prototyping, JavaScript ecosystem, real-time features
- **C#/.NET**: Strong typing, enterprise integration, Azure services
- **Java/Spring Boot**: Enterprise reliability, mature ecosystem, scalability
- **Python**: ML/AI libraries, data science tools, scientific computing

## TypeScript/Node.js Servers

### 1. Echo Ping Server

**Purpose**: Testing and validation of MCP communication patterns
**Technology Stack**: TypeScript, Express.js, MCP SDK, OpenTelemetry

#### Project Structure
```
src/tools/echo-ping/
├── src/
│   ├── index.ts           # Main server entry point
│   ├── tools/
│   │   ├── echo.ts        # Echo tool implementation
│   │   └── ping.ts        # Ping tool implementation
│   └── server.ts          # MCP server setup
├── package.json
├── tsconfig.json
└── Dockerfile
```

#### Implementation Details

```typescript
// src/index.ts - Server Setup
import { McpServer } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const server = new McpServer({
  name: "echo-ping-server",
  version: "1.0.0"
});

// Tool definitions
const TOOLS = [
  {
    name: "echo",
    description: "Echoes back the input string",
    inputSchema: {
      type: "object",
      properties: {
        input: { type: "string", description: "Text to echo back" }
      },
      required: ["input"]
    }
  },
  {
    name: "ping",
    description: "Simple connectivity test",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    }
  }
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS
}));

// Tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case "echo":
      return {
        content: [{
          type: "text",
          text: args.input || "No input provided"
        }]
      };
    
    case "ping":
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            status: "pong",
            timestamp: Date.now(),
            server: "echo-ping-server"
          })
        }]
      };
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});
```

#### HTTP Server Implementation

```typescript
// src/server.ts - HTTP/SSE Server
import express from 'express';
import cors from 'cors';
import { trace, SpanStatusCode } from '@opentelemetry/api';

const app = express();
const tracer = trace.getTracer('echo-ping-server');

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: Date.now() });
});

// MCP tool execution endpoint
app.post('/mcp', async (req, res) => {
  const span = tracer.startSpan('mcp_tool_call');
  
  try {
    const { method, params } = req.body;
    
    span.setAttributes({
      'mcp.method': method,
      'mcp.tool': params?.name || 'unknown'
    });
    
    // Process MCP request
    const result = await processMcpRequest(method, params);
    
    span.setStatus({ code: SpanStatusCode.OK });
    res.json(result);
    
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    res.status(500).json({ error: error.message });
  } finally {
    span.end();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Echo-Ping MCP Server running on port ${PORT}`);
});
```

#### Monitoring and Observability

```typescript
// OpenTelemetry configuration
import { NodeSDK } from '@opentelemetry/auto-instrumentations-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'echo-ping-server',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
  }),
  instrumentations: [getNodeAutoInstrumentations()]
});

sdk.start();
```

### 2. Web Search Server

**Purpose**: Real-time web search integration using Bing Search API
**Technology Stack**: TypeScript, Express.js, Bing Search API, Axios

#### Implementation Highlights

```typescript
// Web search tool implementation
import axios from 'axios';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  datePublished?: string;
}

export async function performWebSearch(query: string): Promise<SearchResult[]> {
  const endpoint = 'https://api.bing.microsoft.com/v7.0/search';
  
  const response = await axios.get(endpoint, {
    headers: {
      'Ocp-Apim-Subscription-Key': process.env.BING_SEARCH_API_KEY
    },
    params: {
      q: query,
      count: 10,
      offset: 0,
      mkt: 'en-US',
      responseFilter: 'Webpages'
    }
  });
  
  return response.data.webPages?.value?.map(item => ({
    title: item.name,
    url: item.url,
    snippet: item.snippet,
    datePublished: item.datePublished
  })) || [];
}
```

## C#/.NET Servers

### Customer Query Server

**Purpose**: Natural language processing and query understanding
**Technology Stack**: .NET 8, ASP.NET Core, Azure AI Services, Entity Framework

#### Project Structure
```
src/tools/customer-query/
├── Controllers/
│   └── McpController.cs      # MCP API endpoints
├── Services/
│   ├── NlpService.cs         # Natural language processing
│   ├── QueryAnalyzer.cs      # Query analysis logic
│   └── McpService.cs         # MCP protocol handling
├── Models/
│   ├── McpModels.cs          # MCP data models
│   └── QueryModels.cs        # Domain models
├── Program.cs                # Application entry point
├── Dockerfile
└── customer-query.csproj
```

#### MCP Controller Implementation

```csharp
// Controllers/McpController.cs
using Microsoft.AspNetCore.Mvc;
using CustomerQuery.Services;
using CustomerQuery.Models;

[ApiController]
[Route("mcp")]
public class McpController : ControllerBase
{
    private readonly IMcpService _mcpService;
    private readonly ILogger<McpController> _logger;

    public McpController(IMcpService mcpService, ILogger<McpController> logger)
    {
        _mcpService = mcpService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> ProcessMcpRequest([FromBody] McpRequest request)
    {
        using var activity = McpTelemetry.StartActivity("ProcessMcpRequest");
        activity?.SetTag("mcp.method", request.Method);
        activity?.SetTag("mcp.tool", request.Params?.Name);

        try
        {
            var result = request.Method switch
            {
                "tools/list" => await _mcpService.ListToolsAsync(),
                "tools/call" => await _mcpService.CallToolAsync(request.Params),
                _ => throw new NotSupportedException($"Method {request.Method} not supported")
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing MCP request");
            activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("health")]
    public IActionResult Health()
    {
        return Ok(new { status = "healthy", timestamp = DateTimeOffset.UtcNow });
    }
}
```

#### Natural Language Processing Service

```csharp
// Services/NlpService.cs
using Azure.AI.TextAnalytics;
using CustomerQuery.Models;

public class NlpService : INlpService
{
    private readonly TextAnalyticsClient _textAnalyticsClient;
    private readonly ILogger<NlpService> _logger;

    public NlpService(TextAnalyticsClient textAnalyticsClient, ILogger<NlpService> logger)
    {
        _textAnalyticsClient = textAnalyticsClient;
        _logger = logger;
    }

    public async Task<QueryAnalysis> AnalyzeQueryAsync(string query)
    {
        using var activity = McpTelemetry.StartActivity("AnalyzeQuery");
        activity?.SetTag("query.length", query.Length);

        // Extract key phrases
        var keyPhrasesResponse = await _textAnalyticsClient.ExtractKeyPhrasesAsync(query);
        var keyPhrases = keyPhrasesResponse.Value.ToList();

        // Analyze sentiment
        var sentimentResponse = await _textAnalyticsClient.AnalyzeSentimentAsync(query);
        var sentiment = sentimentResponse.Value;

        // Extract entities
        var entitiesResponse = await _textAnalyticsClient.RecognizeEntitiesAsync(query);
        var entities = entitiesResponse.Value.Select(entity => new EntityInfo
        {
            Text = entity.Text,
            Category = entity.Category.ToString(),
            ConfidenceScore = entity.ConfidenceScore
        }).ToList();

        return new QueryAnalysis
        {
            OriginalQuery = query,
            KeyPhrases = keyPhrases,
            Sentiment = sentiment.Sentiment.ToString(),
            SentimentScore = sentiment.ConfidenceScores.Positive,
            Entities = entities,
            Intent = DetermineIntent(keyPhrases, entities)
        };
    }

    private string DetermineIntent(List<string> keyPhrases, List<EntityInfo> entities)
    {
        // Simple intent classification based on keywords
        var travelKeywords = new[] { "travel", "trip", "vacation", "hotel", "flight", "destination" };
        var planningKeywords = new[] { "plan", "itinerary", "schedule", "book", "reserve" };
        var searchKeywords = new[] { "find", "search", "look", "recommend", "suggest" };

        if (keyPhrases.Any(phrase => travelKeywords.Any(keyword => 
            phrase.Contains(keyword, StringComparison.OrdinalIgnoreCase))))
        {
            if (keyPhrases.Any(phrase => planningKeywords.Any(keyword => 
                phrase.Contains(keyword, StringComparison.OrdinalIgnoreCase))))
                return "trip_planning";
            
            if (keyPhrases.Any(phrase => searchKeywords.Any(keyword => 
                phrase.Contains(keyword, StringComparison.OrdinalIgnoreCase))))
                return "destination_search";
                
            return "travel_inquiry";
        }

        return "general_query";
    }
}
```

#### Configuration and Dependency Injection

```csharp
// Program.cs
using Azure.AI.TextAnalytics;
using CustomerQuery.Services;
using Microsoft.Extensions.Azure;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddLogging();

// Azure AI Services
builder.Services.AddAzureClients(clientBuilder =>
{
    clientBuilder.AddTextAnalyticsClient(
        new Uri(builder.Configuration["AzureAI:Endpoint"]),
        new AzureKeyCredential(builder.Configuration["AzureAI:ApiKey"]));
});

// MCP Services
builder.Services.AddScoped<IMcpService, McpService>();
builder.Services.AddScoped<INlpService, NlpService>();
builder.Services.AddScoped<IQueryAnalyzer, QueryAnalyzer>();

// OpenTelemetry
builder.Services.AddOpenTelemetry()
    .WithTracing(builder => builder
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddOtlpExporter());

var app = builder.Build();

// Configure middleware
app.UseRouting();
app.MapControllers();

app.Run();
```

## Java/Spring Boot Servers

### Destination Recommendation Server

**Purpose**: AI-powered destination recommendations based on user preferences
**Technology Stack**: Java 21, Spring Boot 3, Spring WebFlux, Jackson, OpenAPI

#### Project Structure
```
src/tools/destination-recommendation/
├── src/main/java/com/azure/ai/travel/destination/
│   ├── DestinationRecommendationApplication.java
│   ├── controller/
│   │   └── McpController.java
│   ├── service/
│   │   ├── McpService.java
│   │   ├── RecommendationService.java
│   │   └── PreferenceAnalysisService.java
│   ├── model/
│   │   ├── McpRequest.java
│   │   ├── Destination.java
│   │   └── UserPreferences.java
│   └── config/
│       └── WebConfig.java
├── pom.xml
└── Dockerfile
```

#### Spring Boot MCP Controller

```java
// controller/McpController.java
package com.azure.ai.travel.destination.controller;

import com.azure.ai.travel.destination.model.*;
import com.azure.ai.travel.destination.service.McpService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import io.micrometer.tracing.annotation.NewSpan;

@RestController
@RequestMapping("/mcp")
@CrossOrigin(origins = "*")
public class McpController {

    @Autowired
    private McpService mcpService;

    @PostMapping
    @NewSpan("mcp-request")
    public Mono<ResponseEntity<?>> processMcpRequest(@RequestBody McpRequest request) {
        return switch (request.getMethod()) {
            case "tools/list" -> mcpService.listTools()
                    .map(ResponseEntity::ok);
            case "tools/call" -> mcpService.callTool(request.getParams())
                    .map(ResponseEntity::ok)
                    .onErrorReturn(ResponseEntity.internalServerError().build());
            default -> Mono.just(ResponseEntity.badRequest()
                    .body(Map.of("error", "Unsupported method: " + request.getMethod())));
        };
    }

    @GetMapping("/health")
    public Mono<ResponseEntity<Map<String, Object>>> health() {
        return Mono.just(ResponseEntity.ok(Map.of(
                "status", "healthy",
                "timestamp", System.currentTimeMillis(),
                "service", "destination-recommendation"
        )));
    }
}
```

#### Recommendation Service Implementation

```java
// service/RecommendationService.java
package com.azure.ai.travel.destination.service;

import com.azure.ai.travel.destination.model.*;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Flux;
import java.util.List;
import java.util.Map;

@Service
public class RecommendationService {

    private final PreferenceAnalysisService preferenceAnalysisService;
    private final DestinationDatabase destinationDatabase;

    public RecommendationService(PreferenceAnalysisService preferenceAnalysisService,
                                DestinationDatabase destinationDatabase) {
        this.preferenceAnalysisService = preferenceAnalysisService;
        this.destinationDatabase = destinationDatabase;
    }

    public Mono<List<DestinationRecommendation>> recommendDestinations(
            String userPreferencesText, int maxRecommendations) {
        
        return preferenceAnalysisService.analyzePreferences(userPreferencesText)
                .flatMap(preferences -> generateRecommendations(preferences, maxRecommendations))
                .collectList();
    }

    private Flux<DestinationRecommendation> generateRecommendations(
            UserPreferences preferences, int maxRecommendations) {
        
        return destinationDatabase.findDestinations()
                .map(destination -> calculateCompatibilityScore(destination, preferences))
                .filter(scored -> scored.getScore() > 0.6) // Minimum compatibility threshold
                .sort((a, b) -> Double.compare(b.getScore(), a.getScore()))
                .take(maxRecommendations)
                .map(this::createRecommendation);
    }

    private ScoredDestination calculateCompatibilityScore(Destination destination, 
                                                         UserPreferences preferences) {
        double score = 0.0;
        
        // Climate preference matching
        if (preferences.getClimatePreferences().contains(destination.getClimate())) {
            score += 0.3;
        }
        
        // Activity preference matching
        double activityMatch = destination.getAvailableActivities().stream()
                .mapToDouble(activity -> preferences.getActivityPreferences().contains(activity) ? 1.0 : 0.0)
                .average().orElse(0.0);
        score += activityMatch * 0.4;
        
        // Budget compatibility
        if (destination.getAverageCost() <= preferences.getBudgetRange().getMax() &&
            destination.getAverageCost() >= preferences.getBudgetRange().getMin()) {
            score += 0.2;
        }
        
        // Cultural interest alignment
        if (preferences.getCulturalInterests().stream()
                .anyMatch(interest -> destination.getCulturalHighlights().contains(interest))) {
            score += 0.1;
        }
        
        return new ScoredDestination(destination, score);
    }

    private DestinationRecommendation createRecommendation(ScoredDestination scored) {
        return DestinationRecommendation.builder()
                .destination(scored.getDestination())
                .compatibilityScore(scored.getScore())
                .reasonForRecommendation(generateReasonForRecommendation(scored))
                .estimatedBudget(scored.getDestination().getAverageCost())
                .bestTimeToVisit(scored.getDestination().getBestSeasons())
                .build();
    }

    private String generateReasonForRecommendation(ScoredDestination scored) {
        StringBuilder reason = new StringBuilder();
        Destination dest = scored.getDestination();
        
        reason.append("Recommended because: ");
        reason.append(dest.getName()).append(" offers ");
        reason.append(String.join(", ", dest.getAvailableActivities().subList(0, 
                Math.min(3, dest.getAvailableActivities().size()))));
        reason.append(" and has ").append(dest.getClimate()).append(" climate.");
        
        return reason.toString();
    }
}
```

#### Configuration and Monitoring

```java
// config/WebConfig.java
package com.azure.ai.travel.destination.config;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.config.WebFluxConfigurer;

@Configuration
public class WebConfig implements WebFluxConfigurer {

    @Bean
    public Timer mcpRequestTimer(MeterRegistry meterRegistry) {
        return Timer.builder("mcp.request.duration")
                .description("Duration of MCP requests")
                .register(meterRegistry);
    }
}
```

## Python Servers

Python servers in the system demonstrate three different aspects: trip planning, code execution, and AI model inference.

### 1. Itinerary Planning Server

**Purpose**: Comprehensive trip planning and scheduling
**Technology Stack**: Python 3.11, FastAPI, Pydantic, AsyncIO, SQLAlchemy

#### Project Structure
```
src/tools/itinerary-planning/
├── app/
│   ├── main.py               # FastAPI application
│   ├── models/
│   │   ├── mcp_models.py     # MCP protocol models
│   │   └── domain_models.py  # Business domain models
│   ├── services/
│   │   ├── mcp_service.py    # MCP protocol handling
│   │   ├── planning_service.py # Trip planning logic
│   │   └── optimization_service.py # Route optimization
│   └── utils/
│       ├── date_utils.py     # Date/time utilities
│       └── geo_utils.py      # Geographic calculations
├── requirements.txt
├── Dockerfile
└── tests/
```

#### FastAPI MCP Implementation

```python
# app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List
import logging
from opentelemetry import trace
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

from .services.mcp_service import McpService
from .services.planning_service import PlanningService
from .models.mcp_models import McpRequest, McpResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize tracer
tracer = trace.get_tracer(__name__)

app = FastAPI(title="Itinerary Planning MCP Server", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
mcp_service = McpService()
planning_service = PlanningService()

@app.post("/mcp")
async def process_mcp_request(request: McpRequest) -> McpResponse:
    """Process MCP protocol requests"""
    with tracer.start_as_current_span("process_mcp_request") as span:
        span.set_attribute("mcp.method", request.method)
        
        try:
            if request.method == "tools/list":
                return await mcp_service.list_tools()
            elif request.method == "tools/call":
                span.set_attribute("mcp.tool", request.params.name)
                return await mcp_service.call_tool(request.params)
            else:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Unsupported method: {request.method}"
                )
        except Exception as e:
            logger.error(f"Error processing MCP request: {e}")
            span.record_exception(e)
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "service": "itinerary-planning"
    }

# Initialize OpenTelemetry instrumentation
FastAPIInstrumentor.instrument_app(app)
```

#### Planning Service Implementation

```python
# app/services/planning_service.py
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import asyncio
from geopy.distance import geodesic
from ..models.domain_models import Itinerary, Activity, Location, TimeSlot
from ..utils.optimization_service import RouteOptimizer
from ..utils.date_utils import DateTimeUtils

class PlanningService:
    """Comprehensive trip planning service"""
    
    def __init__(self):
        self.route_optimizer = RouteOptimizer()
        self.date_utils = DateTimeUtils()
    
    async def create_itinerary(
        self,
        destination: str,
        start_date: str,
        end_date: str,
        preferences: Dict[str, Any],
        budget: Optional[float] = None
    ) -> Itinerary:
        """Create a comprehensive travel itinerary"""
        
        # Parse dates
        start_dt = datetime.fromisoformat(start_date)
        end_dt = datetime.fromisoformat(end_date)
        
        # Get destination information
        location_info = await self._get_destination_info(destination)
        
        # Find activities based on preferences
        activities = await self._find_activities(
            location_info, preferences, budget
        )
        
        # Optimize route and schedule
        optimized_schedule = await self._optimize_schedule(
            activities, start_dt, end_dt, preferences
        )
        
        # Generate day-by-day itinerary
        daily_plans = await self._generate_daily_plans(
            optimized_schedule, start_dt, end_dt
        )
        
        return Itinerary(
            destination=destination,
            start_date=start_dt,
            end_date=end_dt,
            daily_plans=daily_plans,
            total_estimated_cost=sum(plan.estimated_cost for plan in daily_plans),
            preferences_matched=preferences
        )
    
    async def _find_activities(
        self,
        location: Location,
        preferences: Dict[str, Any],
        budget: Optional[float]
    ) -> List[Activity]:
        """Find activities based on user preferences"""
        
        activities = []
        
        # Categories based on preferences
        categories = preferences.get('interests', ['sightseeing', 'culture', 'food'])
        
        for category in categories:
            category_activities = await self._get_activities_by_category(
                location, category, budget
            )
            activities.extend(category_activities)
        
        # Filter by budget if specified
        if budget:
            activities = [a for a in activities if a.cost <= budget * 0.1]  # 10% of budget per activity
        
        # Sort by rating and relevance
        activities.sort(key=lambda a: (a.rating, a.relevance_score), reverse=True)
        
        return activities[:20]  # Limit to top 20 activities
    
    async def _optimize_schedule(
        self,
        activities: List[Activity],
        start_date: datetime,
        end_date: datetime,
        preferences: Dict[str, Any]
    ) -> List[TimeSlot]:
        """Optimize activity scheduling considering time, location, and preferences"""
        
        trip_duration = (end_date - start_date).days
        
        # Create time slots for each day
        time_slots = []
        current_date = start_date
        
        while current_date < end_date:
            # Morning slot (9 AM - 12 PM)
            time_slots.append(TimeSlot(
                start_time=current_date.replace(hour=9, minute=0),
                end_time=current_date.replace(hour=12, minute=0),
                slot_type="morning"
            ))
            
            # Afternoon slot (2 PM - 5 PM)
            time_slots.append(TimeSlot(
                start_time=current_date.replace(hour=14, minute=0),
                end_time=current_date.replace(hour=17, minute=0),
                slot_type="afternoon"
            ))
            
            # Evening slot (7 PM - 10 PM)
            time_slots.append(TimeSlot(
                start_time=current_date.replace(hour=19, minute=0),
                end_time=current_date.replace(hour=22, minute=0),
                slot_type="evening"
            ))
            
            current_date += timedelta(days=1)
        
        # Use optimization algorithm to assign activities to time slots
        optimized_slots = await self.route_optimizer.optimize_schedule(
            activities, time_slots, preferences
        )
        
        return optimized_slots
    
    async def _generate_daily_plans(
        self,
        time_slots: List[TimeSlot],
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict[str, Any]]:
        """Generate detailed daily plans"""
        
        daily_plans = []
        current_date = start_date
        
        while current_date < end_date:
            # Get slots for current day
            day_slots = [
                slot for slot in time_slots 
                if slot.start_time.date() == current_date.date()
            ]
            
            # Calculate daily cost
            daily_cost = sum(
                slot.activity.cost for slot in day_slots 
                if slot.activity
            )
            
            # Generate transportation recommendations
            transport_info = await self._generate_transport_info(day_slots)
            
            daily_plan = {
                "date": current_date.isoformat(),
                "activities": [
                    {
                        "time": f"{slot.start_time.strftime('%H:%M')} - {slot.end_time.strftime('%H:%M')}",
                        "activity": slot.activity.name if slot.activity else "Free time",
                        "location": slot.activity.location.name if slot.activity else None,
                        "description": slot.activity.description if slot.activity else None,
                        "cost": slot.activity.cost if slot.activity else 0,
                        "duration_hours": (slot.end_time - slot.start_time).seconds / 3600
                    }
                    for slot in day_slots
                ],
                "estimated_cost": daily_cost,
                "transportation": transport_info,
                "notes": await self._generate_daily_notes(day_slots)
            }
            
            daily_plans.append(daily_plan)
            current_date += timedelta(days=1)
        
        return daily_plans
    
    async def _generate_transport_info(self, day_slots: List[TimeSlot]) -> Dict[str, Any]:
        """Generate transportation recommendations for the day"""
        
        locations = [
            slot.activity.location for slot in day_slots 
            if slot.activity and slot.activity.location
        ]
        
        if len(locations) < 2:
            return {"method": "walking", "estimated_cost": 0}
        
        # Calculate total distance
        total_distance = 0
        for i in range(len(locations) - 1):
            distance = geodesic(
                (locations[i].latitude, locations[i].longitude),
                (locations[i+1].latitude, locations[i+1].longitude)
            ).kilometers
            total_distance += distance
        
        # Recommend transportation method
        if total_distance < 3:
            return {
                "method": "walking",
                "estimated_cost": 0,
                "total_distance_km": round(total_distance, 2)
            }
        elif total_distance < 10:
            return {
                "method": "public_transport",
                "estimated_cost": 15,
                "total_distance_km": round(total_distance, 2)
            }
        else:
            return {
                "method": "taxi_uber",
                "estimated_cost": round(total_distance * 2.5),
                "total_distance_km": round(total_distance, 2)
            }
```

### 2. Code Evaluation Server

**Purpose**: Safe execution of Python code for complex calculations and data processing
**Technology Stack**: Python 3.11, FastAPI, RestrictedPython, Docker Sandboxing

#### Secure Code Execution

```python
# app/services/code_execution_service.py
import ast
import sys
import io
import contextlib
import traceback
from typing import Dict, Any, Optional
from RestrictedPython import compile_restricted, safe_globals
from RestrictedPython.Guards import safe_builtins

class CodeExecutionService:
    """Secure Python code execution service"""
    
    def __init__(self):
        self.safe_globals = {
            '__builtins__': safe_builtins,
            '_getattr_': getattr,
            '_getitem_': lambda obj, key: obj[key],
            '_getiter_': iter,
            '_iter_unpack_sequence_': iter,
            # Math operations
            'abs': abs, 'round': round, 'min': min, 'max': max,
            'sum': sum, 'len': len, 'range': range,
            # Safe imports
            'math': __import__('math'),
            'datetime': __import__('datetime'),
            'json': __import__('json'),
        }
    
    async def execute_code(
        self,
        code: str,
        inputs: Optional[Dict[str, Any]] = None,
        timeout: int = 30
    ) -> Dict[str, Any]:
        """Execute Python code safely with restrictions"""
        
        try:
            # Compile with restrictions
            compiled_code = compile_restricted(code, '<string>', 'exec')
            
            if compiled_code is None:
                return {
                    "success": False,
                    "error": "Code compilation failed - potentially unsafe code detected"
                }
            
            # Setup execution namespace
            exec_namespace = self.safe_globals.copy()
            if inputs:
                exec_namespace.update(inputs)
            
            # Capture output
            output_buffer = io.StringIO()
            result = None
            
            with contextlib.redirect_stdout(output_buffer):
                # Execute with timeout protection
                exec(compiled_code, exec_namespace)
                
                # Extract result if available
                if 'result' in exec_namespace:
                    result = exec_namespace['result']
            
            return {
                "success": True,
                "result": result,
                "output": output_buffer.getvalue(),
                "namespace_vars": {
                    k: v for k, v in exec_namespace.items() 
                    if not k.startswith('_') and k not in self.safe_globals
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "error_type": type(e).__name__,
                "traceback": traceback.format_exc()
            }
```

### 3. Model Inference Server

**Purpose**: Local AI model inference using vLLM and ONNX Runtime
**Technology Stack**: Python 3.11, FastAPI, vLLM, ONNX Runtime, Transformers

#### vLLM Integration

```python
# app/services/model_inference_service.py
from vllm import LLM, SamplingParams
from transformers import AutoTokenizer
from typing import List, Dict, Any, Optional
import torch

class ModelInferenceService:
    """Local model inference using vLLM"""
    
    def __init__(self, model_name: str = "microsoft/DialoGPT-small"):
        self.model_name = model_name
        self.llm = None
        self.tokenizer = None
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the vLLM model and tokenizer"""
        try:
            # Initialize vLLM engine
            self.llm = LLM(
                model=self.model_name,
                tensor_parallel_size=1,
                max_model_len=2048,
                gpu_memory_utilization=0.8
            )
            
            # Initialize tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            
            print(f"Model {self.model_name} initialized successfully")
            
        except Exception as e:
            print(f"Error initializing model: {e}")
            # Fallback to CPU-only inference
            self._initialize_cpu_fallback()
    
    async def generate_response(
        self,
        prompt: str,
        max_tokens: int = 150,
        temperature: float = 0.7,
        top_p: float = 0.9
    ) -> Dict[str, Any]:
        """Generate response using the local model"""
        
        try:
            # Configure sampling parameters
            sampling_params = SamplingParams(
                temperature=temperature,
                top_p=top_p,
                max_tokens=max_tokens,
                stop=["</s>", "<|endoftext|>"]
            )
            
            # Generate response
            outputs = self.llm.generate([prompt], sampling_params)
            
            generated_text = outputs[0].outputs[0].text.strip()
            
            return {
                "success": True,
                "generated_text": generated_text,
                "prompt": prompt,
                "model": self.model_name,
                "parameters": {
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                    "top_p": top_p
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "model": self.model_name
            }
```

## Communication Protocols

### HTTP-based MCP vs SSE-based MCP

The system uses two different communication patterns:

#### HTTP-based MCP (Echo-Ping Server)
- **Use Case**: Simple request-response operations
- **Protocol**: Standard HTTP POST requests
- **Response**: Synchronous JSON responses
- **Best For**: Testing, validation, simple operations

```typescript
// Client configuration for HTTP MCP
const client = new MCPHTTPClient(
    "client-id",
    "http://server:port/mcp",
    "access-token"
);

// Tool execution
const result = await client.callTool("tool_name", parameters);
```

#### SSE-based MCP (All Other Servers)
- **Use Case**: Streaming responses, real-time updates
- **Protocol**: Server-Sent Events over HTTP
- **Response**: Asynchronous streaming data
- **Best For**: Long-running operations, real-time data

```typescript
// Client configuration for SSE MCP
const client = new MCPSSEClient(
    "client-id", 
    "http://server:port/sse",
    "access-token"
);

// Streaming tool execution
const stream = client.callToolStream("tool_name", parameters);
for await (const chunk of stream) {
    console.log(chunk);
}
```

## Development Patterns 

### Common MCP Implementation Pattern

All servers follow a consistent pattern regardless of programming language:

1. **Tool Registration**: Define available tools with schemas
2. **Request Handling**: Process MCP protocol requests
3. **Tool Execution**: Implement business logic for each tool
4. **Response Formatting**: Return properly formatted MCP responses
5. **Error Handling**: Consistent error reporting across languages
6. **Monitoring**: OpenTelemetry integration for observability

### Cross-Language Consistency

Despite different programming languages, all servers maintain:
- **Same MCP Protocol**: Consistent request/response format
- **Similar Tool Structure**: Predictable tool definitions
- **Unified Monitoring**: OpenTelemetry tracing across all services
- **Common Configuration**: Environment-based configuration
- **Consistent Error Handling**: Standardized error response format

## Testing and Deployment

### Testing Strategies by Language

#### TypeScript/Node.js
```bash
# Unit tests with Jest
npm test

# Integration tests
npm run test:integration

# MCP protocol tests
npm run test:mcp
```

#### C#/.NET
```bash
# Unit tests with xUnit
dotnet test

# Integration tests
dotnet test --filter Category=Integration

# MCP protocol tests
dotnet test --filter Category=MCP
```

#### Java/Spring Boot
```bash
# Unit tests with JUnit
mvn test

# Integration tests
mvn verify -P integration-tests

# MCP protocol tests
mvn test -Dtest=McpProtocolTest
```

#### Python
```bash
# Unit tests with pytest
pytest tests/unit/

# Integration tests
pytest tests/integration/

# MCP protocol tests
pytest tests/mcp/
```

### Docker Deployment

All servers are containerized with multi-stage builds:

```dockerfile
# Example multi-stage Dockerfile pattern
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

This comprehensive guide demonstrates how MCP servers can be implemented across multiple programming languages while maintaining protocol consistency and following established patterns for enterprise-grade applications.
              server: "echo-ping"
            })
          }
        ]
      };
      
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});
```

#### OpenTelemetry Integration

```typescript
import { trace, metrics } from '@opentelemetry/api';

const tracer = trace.getTracer('echo-ping-server');
const meter = metrics.getMeter('echo-ping-server');

const toolCallCounter = meter.createCounter('mcp_tool_calls_total');
const toolCallDuration = meter.createHistogram('mcp_tool_call_duration_ms');

// Tool call with tracing
const span = tracer.startSpan(`tool_call_${toolName}`);
const startTime = Date.now();

try {
  const result = await executeToolLogic(args);
  toolCallCounter.add(1, { tool: toolName, status: 'success' });
  span.setStatus({ code: SpanStatusCode.OK });
  return result;
} catch (error) {
  toolCallCounter.add(1, { tool: toolName, status: 'error' });
  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
  throw error;
} finally {
  toolCallDuration.record(Date.now() - startTime, { tool: toolName });
  span.end();
}
```

### 2. Customer Query Server (C#/.NET)

**Purpose**: Natural language processing of customer inquiries
**Port**: 5001 (8080 internal)
**Technology**: .NET 8, ASP.NET Core, Azure AI Services

#### Architecture

```csharp
// Program.cs
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using MCP.Server;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddMcpServer();
builder.Services.AddAzureAIServices();
builder.Services.AddOpenTelemetry();

var app = builder.Build();

app.UseRouting();
app.UseMcpServer();
app.Run();
```

#### Available Tools

| Tool Name | Description | Input Schema | Output |
|-----------|-------------|--------------|---------|
| `extract_preferences` | Extract travel preferences from natural language | `{query: string}` | `{preferences: PreferenceObject}` |
| `understand_intent` | Determine user intent and required actions | `{message: string}` | `{intent: string, confidence: number, entities: object[]}` |
| `parse_constraints` | Parse travel constraints (budget, dates, etc.) | `{text: string}` | `{constraints: ConstraintObject}` |

#### Tool Implementation Example

```csharp
[HttpPost("/mcp/call")]
public async Task<IActionResult> CallTool([FromBody] ToolCallRequest request)
{
    var tracer = _telemetry.GetTracer("CustomerQueryServer");
    using var span = tracer.StartSpan($"tool_call_{request.Name}");
    
    try
    {
        var result = request.Name switch
        {
            "extract_preferences" => await ExtractPreferences(request.Arguments),
            "understand_intent" => await UnderstandIntent(request.Arguments),
            "parse_constraints" => await ParseConstraints(request.Arguments),
            _ => throw new ArgumentException($"Unknown tool: {request.Name}")
        };
        
        span.SetStatus(SpanStatusCode.Ok);
        return Ok(new ToolCallResponse { Content = result });
    }
    catch (Exception ex)
    {
        span.SetStatus(SpanStatusCode.Error, ex.Message);
        return BadRequest(new { error = ex.Message });
    }
}

private async Task<object> ExtractPreferences(Dictionary<string, object> args)
{
    var query = args["query"].ToString();
    
    // Use Azure AI Language service
    var response = await _languageClient.AnalyzeTextAsync(new
    {
        Kind = "EntityRecognition",
        AnalysisInput = new { Documents = new[] { new { Id = "1", Text = query } } }
    });
    
    var preferences = new PreferenceObject
    {
        Budget = ExtractBudget(response),
        Destinations = ExtractDestinations(response),
        Activities = ExtractActivities(response),
        Duration = ExtractDuration(response),
        TravelDates = ExtractDates(response)
    };
    
    return preferences;
}
```

#### Data Models

```csharp
public class PreferenceObject
{
    public string? Budget { get; set; }
    public string[]? Destinations { get; set; }
    public string[]? Activities { get; set; }
    public string? Duration { get; set; }
    public DateRange? TravelDates { get; set; }
    public int? GroupSize { get; set; }
    public string? AccommodationType { get; set; }
}

public class ConstraintObject
{
    public decimal? MaxBudget { get; set; }
    public decimal? MinBudget { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string[]? MustInclude { get; set; }
    public string[]? MustExclude { get; set; }
}
```

### 3. Destination Recommendation Server (Java)

**Purpose**: Travel destination suggestions based on user preferences
**Port**: 5002 (8080 internal)
**Technology**: Java 21, Spring Boot, Azure AI Services

#### Architecture

```java
@SpringBootApplication
@EnableWebMvc
public class DestinationRecommendationApplication {
    public static void main(String[] args) {
        SpringApplication.run(DestinationRecommendationApplication.class, args);
    }
}

@RestController
@RequestMapping("/mcp")
public class McpController {
    
    private final DestinationService destinationService;
    private final Tracer tracer;
    
    @PostMapping("/call")
    public ResponseEntity<ToolCallResponse> callTool(
            @RequestBody ToolCallRequest request) {
        
        Span span = tracer.nextSpan()
            .name("tool_call_" + request.getName())
            .start();
            
        try (Tracer.SpanInScope ws = tracer.withSpanInScope(span)) {
            Object result = switch (request.getName()) {
                case "recommend_destinations" -> 
                    destinationService.recommend(request.getArguments());
                case "filter_destinations" -> 
                    destinationService.filter(request.getArguments());
                case "rank_destinations" -> 
                    destinationService.rank(request.getArguments());
                default -> 
                    throw new IllegalArgumentException("Unknown tool: " + request.getName());
            };
            
            span.tag("tool.success", "true");
            return ResponseEntity.ok(new ToolCallResponse(result));
            
        } catch (Exception ex) {
            span.tag("tool.error", ex.getMessage());
            return ResponseEntity.badRequest()
                .body(new ToolCallResponse(Map.of("error", ex.getMessage())));
        } finally {
            span.end();
        }
    }
}
```

#### Available Tools

| Tool Name | Description | Input Schema | Output |
|-----------|-------------|--------------|---------|
| `recommend_destinations` | Get destination recommendations | `{preferences: object, limit?: number}` | `{destinations: Destination[], metadata: object}` |
| `filter_destinations` | Filter destinations by criteria | `{destinations: Destination[], filters: object}` | `{filtered: Destination[]}` |
| `rank_destinations` | Rank destinations by preference match | `{destinations: Destination[], preferences: object}` | `{ranked: RankedDestination[]}` |

#### Service Implementation

```java
@Service
public class DestinationService {
    
    private final AzureAIClient aiClient;
    private final DestinationRepository repository;
    
    public RecommendationResult recommend(Map<String, Object> preferences) {
        // Extract preference criteria
        var criteria = PreferenceExtractor.extract(preferences);
        
        // Get base destination set
        var candidates = repository.findDestinationsByCriteria(criteria);
        
        // Use AI for intelligent ranking
        var prompt = buildRecommendationPrompt(criteria, candidates);
        var aiResponse = aiClient.complete(prompt);
        
        // Parse and rank results
        var rankedDestinations = parseAIRecommendations(aiResponse, candidates);
        
        return new RecommendationResult(
            rankedDestinations,
            new RecommendationMetadata(criteria, candidates.size(), aiResponse.getUsage())
        );
    }
    
    private String buildRecommendationPrompt(PreferenceCriteria criteria, 
                                           List<Destination> candidates) {
        return """
            Given the following travel preferences:
            Budget: %s
            Activities: %s
            Duration: %s
            Group Size: %d
            
            Rank these destinations from 1-10 based on fit:
            %s
            
            Consider cultural fit, cost effectiveness, and activity availability.
            Return JSON with destination_id and score fields.
            """.formatted(
                criteria.getBudget(),
                String.join(", ", criteria.getActivities()),
                criteria.getDuration(),
                criteria.getGroupSize(),
                formatDestinationsForPrompt(candidates)
            );
    }
}
```

#### Data Models

```java
public record Destination(
    String id,
    String name,
    String country,
    String region,
    List<String> activities,
    BudgetRange budgetRange,
    Climate climate,
    List<String> languages,
    double rating,
    Map<String, Object> metadata
) {}

public record RankedDestination(
    Destination destination,
    double score,
    String reasoning,
    List<String> matchingFactors
) {}

public class PreferenceCriteria {
    private String budget;
    private List<String> activities;
    private String duration;
    private int groupSize;
    private List<String> mustHave;
    private List<String> mustAvoid;
    // getters/setters
}
```

### 4. Itinerary Planning Server (Python)

**Purpose**: Detailed travel itinerary creation and optimization
**Port**: 5003 (8000 internal)
**Technology**: Python 3.11, FastAPI, Azure AI Services

#### Architecture

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import opentelemetry.trace as trace
from azure.ai.ml import MLClient

app = FastAPI(title="Itinerary Planning MCP Server")
tracer = trace.get_tracer("itinerary-planning-server")

@app.post("/mcp/call")
async def call_tool(request: ToolCallRequest) -> ToolCallResponse:
    with tracer.start_as_current_span(f"tool_call_{request.name}") as span:
        try:
            result = await route_tool_call(request.name, request.arguments)
            span.set_status(trace.Status(trace.StatusCode.OK))
            return ToolCallResponse(content=result)
        except Exception as e:
            span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))
            raise HTTPException(status_code=400, detail=str(e))

async def route_tool_call(tool_name: str, args: Dict[str, Any]) -> Any:
    match tool_name:
        case "plan_itinerary":
            return await plan_itinerary(args)
        case "optimize_route":
            return await optimize_route(args)
        case "schedule_activities":
            return await schedule_activities(args)
        case "estimate_costs":
            return await estimate_costs(args)
        case _:
            raise ValueError(f"Unknown tool: {tool_name}")
```

#### Available Tools

| Tool Name | Description | Input Schema | Output |
|-----------|-------------|--------------|---------|
| `plan_itinerary` | Create complete day-by-day itinerary | `{destinations: object[], preferences: object, duration: number}` | `{itinerary: ItineraryPlan}` |
| `optimize_route` | Optimize travel routes between locations | `{locations: object[], constraints: object}` | `{optimized_route: RouteOptimization}` |
| `schedule_activities` | Schedule activities within time constraints | `{activities: object[], timeframe: object}` | `{schedule: ActivitySchedule}` |
| `estimate_costs` | Estimate total trip costs | `{itinerary: object, preferences: object}` | `{cost_breakdown: CostEstimate}` |

#### Service Implementation

```python
class ItineraryPlanningService:
    def __init__(self):
        self.ai_client = AzureOpenAIClient()
        self.maps_client = AzureMapsClient()
        self.cost_estimator = CostEstimator()
    
    async def plan_itinerary(self, args: Dict[str, Any]) -> ItineraryPlan:
        destinations = args["destinations"]
        preferences = args["preferences"]
        duration = args["duration"]
        
        # Phase 1: Generate base itinerary structure
        with tracer.start_as_current_span("generate_base_structure"):
            base_structure = await self._generate_base_structure(
                destinations, duration, preferences
            )
        
        # Phase 2: Optimize for travel efficiency
        with tracer.start_as_current_span("optimize_travel"):
            optimized_route = await self._optimize_travel_route(
                base_structure, preferences
            )
        
        # Phase 3: Schedule detailed activities
        with tracer.start_as_current_span("schedule_activities"):
            detailed_schedule = await self._schedule_activities(
                optimized_route, preferences
            )
        
        # Phase 4: Add logistics and recommendations
        with tracer.start_as_current_span("add_logistics"):
            final_itinerary = await self._add_logistics(
                detailed_schedule, preferences
            )
        
        return final_itinerary
    
    async def _generate_base_structure(
        self, 
        destinations: List[Dict], 
        duration: int, 
        preferences: Dict
    ) -> BaseItinerary:
        prompt = f"""
        Create a {duration}-day travel itinerary for these destinations:
        {json.dumps(destinations, indent=2)}
        
        Travel preferences:
        {json.dumps(preferences, indent=2)}
        
        Return a JSON structure with:
        - Daily themes and focus areas
        - Major destinations per day
        - Travel time between locations
        - Recommended time allocation
        
        Consider:
        - Logical geographic flow
        - Activity intensity variation
        - Weather and seasonal factors
        - Local events and festivals
        """
        
        response = await self.ai_client.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=2000
        )
        
        return BaseItinerary.parse_from_ai_response(response)
    
    async def _optimize_travel_route(
        self, 
        base: BaseItinerary, 
        preferences: Dict
    ) -> OptimizedRoute:
        # Use Azure Maps for route optimization
        locations = base.extract_locations()
        
        route_matrix = await self.maps_client.calculate_route_matrix(
            origins=locations,
            destinations=locations,
            travel_mode=preferences.get("transport_mode", "driving")
        )
        
        # Apply traveling salesman optimization
        optimized_order = self._optimize_location_order(
            locations, route_matrix, base.daily_themes
        )
        
        return OptimizedRoute(
            locations=optimized_order,
            travel_times=route_matrix,
            total_distance=sum(route_matrix.distances),
            recommendations=self._generate_route_recommendations(optimized_order)
        )
```

#### Data Models

```python
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime, time

class ItineraryPlan(BaseModel):
    id: str
    title: str
    duration_days: int
    destinations: List[str]
    daily_plans: List[DailyPlan]
    cost_estimate: CostEstimate
    metadata: Dict[str, Any]

class DailyPlan(BaseModel):
    day: int
    date: Optional[datetime]
    theme: str
    location: str
    activities: List[Activity]
    meals: List[MealRecommendation]
    accommodation: Optional[AccommodationRecommendation]
    transportation: List[TransportationSegment]
    estimated_cost: float
    notes: List[str]

class Activity(BaseModel):
    name: str
    description: str
    location: str
    start_time: time
    duration_minutes: int
    cost: float
    booking_required: bool
    difficulty_level: str
    weather_dependent: bool
    alternatives: List[str]

class CostEstimate(BaseModel):
    accommodation: float
    transportation: float
    activities: float
    meals: float
    miscellaneous: float
    total: float
    currency: str
    confidence_level: float
```

### 5. Code Evaluation Server (Python)

**Purpose**: Dynamic code execution and evaluation for complex travel calculations
**Port**: 5004 (5000 internal)
**Technology**: Python 3.11, FastAPI, Sandboxed execution environment

#### Architecture

```python
from fastapi import FastAPI, HTTPException
import ast
import sys
import io
import contextlib
import traceback
from typing import Dict, Any
import opentelemetry.trace as trace

app = FastAPI(title="Code Evaluation MCP Server")
tracer = trace.get_tracer("code-evaluation-server")

class SafeCodeExecutor:
    ALLOWED_MODULES = {
        'math', 'datetime', 'json', 'statistics', 
        'itertools', 'functools', 'collections'
    }
    
    FORBIDDEN_NAMES = {
        'exec', 'eval', 'compile', 'open', 'file',
        'input', 'raw_input', '__import__', 'reload',
        'vars', 'locals', 'globals', 'dir'
    }
    
    def __init__(self):
        self.global_namespace = self._create_safe_namespace()
    
    def _create_safe_namespace(self) -> Dict[str, Any]:
        # Create restricted namespace with safe built-ins
        safe_builtins = {
            'abs', 'all', 'any', 'bool', 'dict', 'enumerate',
            'filter', 'float', 'int', 'len', 'list', 'map',
            'max', 'min', 'range', 'round', 'sorted', 'str',
            'sum', 'tuple', 'zip'
        }
        
        namespace = {name: getattr(__builtins__, name) 
                    for name in safe_builtins if hasattr(__builtins__, name)}
        
        # Add safe modules
        for module_name in self.ALLOWED_MODULES:
            try:
                namespace[module_name] = __import__(module_name)
            except ImportError:
                pass
        
        return namespace
    
    def execute_code(self, code: str, inputs: Dict[str, Any] = None) -> Dict[str, Any]:
        # Validate code safety
        self._validate_code_safety(code)
        
        # Create execution namespace
        exec_namespace = self.global_namespace.copy()
        if inputs:
            exec_namespace.update(inputs)
        
        # Capture output
        output_buffer = io.StringIO()
        result = None
        
        try:
            with contextlib.redirect_stdout(output_buffer):
                # Execute code
                compiled_code = compile(code, '<string>', 'exec')
                exec(compiled_code, exec_namespace)
                
                # Extract result if available
                if 'result' in exec_namespace:
                    result = exec_namespace['result']
            
            return {
                'success': True,
                'result': result,
                'output': output_buffer.getvalue(),
                'namespace_vars': {k: v for k, v in exec_namespace.items() 
                                 if not k.startswith('_') and k not in self.global_namespace}
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'error_type': type(e).__name__,
                'traceback': traceback.format_exc()
            }
    
    def _validate_code_safety(self, code: str) -> None:
        # Parse AST and check for forbidden operations
        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            raise ValueError(f"Syntax error in code: {e}")
        
        for node in ast.walk(tree):
            if isinstance(node, ast.Name) and node.id in self.FORBIDDEN_NAMES:
                raise ValueError(f"Forbidden operation: {node.id}")
            elif isinstance(node, ast.Import):
                for alias in node.names:
                    if alias.name not in self.ALLOWED_MODULES:
                        raise ValueError(f"Module not allowed: {alias.name}")
```

#### Available Tools

| Tool Name | Description | Input Schema | Output |
|-----------|-------------|--------------|---------|
| `execute_python` | Execute Python code safely | `{code: string, inputs?: object}` | `{result: any, output: string, success: boolean}` |
| `calculate_travel_metrics` | Calculate travel-specific metrics | `{calculation_type: string, data: object}` | `{metrics: object}` |
| `data_analysis` | Perform data analysis on travel data | `{data: object[], analysis_type: string}` | `{analysis_results: object}` |

#### Tool Implementation

```python
@app.post("/mcp/call")
async def call_tool(request: ToolCallRequest) -> ToolCallResponse:
    with tracer.start_as_current_span(f"tool_call_{request.name}") as span:
        try:
            result = await route_tool_call(request.name, request.arguments)
            span.set_status(trace.Status(trace.StatusCode.OK))
            return ToolCallResponse(content=result)
        except Exception as e:
            span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))
            raise HTTPException(status_code=400, detail=str(e))

async def route_tool_call(tool_name: str, args: Dict[str, Any]) -> Any:
    executor = SafeCodeExecutor()
    
    match tool_name:
        case "execute_python":
            return executor.execute_code(
                args["code"], 
                args.get("inputs", {})
            )
        
        case "calculate_travel_metrics":
            return await calculate_travel_metrics(
                args["calculation_type"],
                args["data"]
            )
        
        case "data_analysis":
            return await perform_data_analysis(
                args["data"],
                args["analysis_type"]
            )
        
        case _:
            raise ValueError(f"Unknown tool: {tool_name}")

async def calculate_travel_metrics(calc_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate travel-specific metrics using safe code execution."""
    
    calculation_templates = {
        "cost_per_day": """
import statistics
costs = data['daily_costs']
result = {
    'average': statistics.mean(costs),
    'median': statistics.median(costs),
    'total': sum(costs),
    'min': min(costs),
    'max': max(costs)
}
""",
        "travel_efficiency": """
import math
distances = data['distances']
times = data['travel_times']
efficiency_scores = [d/t if t > 0 else 0 for d, t in zip(distances, times)]
result = {
    'scores': efficiency_scores,
    'average_efficiency': sum(efficiency_scores) / len(efficiency_scores),
    'total_distance': sum(distances),
    'total_time': sum(times)
}
""",
        "budget_optimization": """
import itertools
activities = data['activities']
budget = data['budget']

# Find optimal activity combination within budget
combinations = []
for r in range(1, len(activities) + 1):
    for combo in itertools.combinations(activities, r):
        total_cost = sum(activity['cost'] for activity in combo)
        total_value = sum(activity['value_score'] for activity in combo)
        if total_cost <= budget:
            combinations.append({
                'activities': [a['name'] for a in combo],
                'cost': total_cost,
                'value': total_value,
                'efficiency': total_value / total_cost if total_cost > 0 else 0
            })

result = sorted(combinations, key=lambda x: x['efficiency'], reverse=True)[:5]
"""
    }
    
    if calc_type not in calculation_templates:
        raise ValueError(f"Unknown calculation type: {calc_type}")
    
    executor = SafeCodeExecutor()
    return executor.execute_code(
        calculation_templates[calc_type],
        {"data": data}
    )
```

### 6. Model Inference Server (Python)

**Purpose**: Local LLM inference using ONNX and vLLM for specialized AI processing
**Port**: 5005 (5000 internal)
**Technology**: Python 3.11, FastAPI, ONNX Runtime, vLLM, GPU acceleration

#### Architecture

```python
from fastapi import FastAPI, HTTPException
import torch
import onnxruntime as ort
from transformers import AutoTokenizer
from typing import Dict, Any, List
import opentelemetry.trace as trace

app = FastAPI(title="Model Inference MCP Server")
tracer = trace.get_tracer("model-inference-server")

class ModelInferenceService:
    def __init__(self):
        self.models = {}
        self.tokenizers = {}
        self.load_models()
    
    def load_models(self):
        """Load pre-configured models for travel-specific tasks."""
        
        # Load travel classification model
        self.models['travel_classifier'] = ort.InferenceSession(
            "models/travel_classifier.onnx",
            providers=['CUDAExecutionProvider', 'CPUExecutionProvider']
        )
        self.tokenizers['travel_classifier'] = AutoTokenizer.from_pretrained(
            "travel-classifier-tokenizer"
        )
        
        # Load sentiment analysis model
        self.models['sentiment'] = ort.InferenceSession(
            "models/sentiment_analysis.onnx",
            providers=['CUDAExecutionProvider', 'CPUExecutionProvider']
        )
        self.tokenizers['sentiment'] = AutoTokenizer.from_pretrained(
            "sentiment-tokenizer"
        )
    
    async def classify_travel_query(self, text: str) -> Dict[str, Any]:
        """Classify travel query into categories."""
        with tracer.start_as_current_span("classify_travel_query"):
            tokenizer = self.tokenizers['travel_classifier']
            model = self.models['travel_classifier']
            
            # Tokenize input
            inputs = tokenizer(
                text,
                return_tensors="np",
                padding=True,
                truncation=True,
                max_length=512
            )
            
            # Run inference
            outputs = model.run(None, {
                'input_ids': inputs['input_ids'],
                'attention_mask': inputs['attention_mask']
            })
            
            # Process results
            logits = outputs[0]
            probabilities = torch.softmax(torch.from_numpy(logits), dim=-1)
            
            categories = [
                'destination_inquiry', 'accommodation_search', 
                'activity_planning', 'transportation', 'budget_planning'
            ]
            
            results = {
                'categories': {
                    cat: float(prob) 
                    for cat, prob in zip(categories, probabilities[0])
                },
                'primary_category': categories[probabilities.argmax()],
                'confidence': float(probabilities.max())
            }
            
            return results
    
    async def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment of travel-related text."""
        with tracer.start_as_current_span("analyze_sentiment"):
            tokenizer = self.tokenizers['sentiment']
            model = self.models['sentiment']
            
            inputs = tokenizer(
                text,
                return_tensors="np",
                padding=True,
                truncation=True,
                max_length=512
            )
            
            outputs = model.run(None, {
                'input_ids': inputs['input_ids'],
                'attention_mask': inputs['attention_mask']
            })
            
            logits = outputs[0]
            probabilities = torch.softmax(torch.from_numpy(logits), dim=-1)
            
            sentiment_labels = ['negative', 'neutral', 'positive']
            
            return {
                'sentiment': sentiment_labels[probabilities.argmax()],
                'confidence': float(probabilities.max()),
                'scores': {
                    label: float(score)
                    for label, score in zip(sentiment_labels, probabilities[0])
                }
            }
```

#### Available Tools

| Tool Name | Description | Input Schema | Output |
|-----------|-------------|--------------|---------|
| `classify_text` | Classify travel-related text | `{text: string, model?: string}` | `{classification: object, confidence: number}` |
| `analyze_sentiment` | Analyze sentiment of text | `{text: string}` | `{sentiment: string, confidence: number, scores: object}` |
| `generate_embeddings` | Generate text embeddings | `{texts: string[]}` | `{embeddings: number[][]}` |
| `custom_inference` | Run custom model inference | `{model_name: string, inputs: object}` | `{outputs: object}` |

### 7. Web Search Server (TypeScript)

**Purpose**: Real-time web search for travel information using Bing Search API
**Port**: 5006 (5000 internal)
**Technology**: TypeScript, Express.js, Bing Search API, Azure AI Grounding

#### Architecture

```typescript
import express from 'express';
import { BingSearchClient } from '@azure/cognitiveservices-websearch';
import { DefaultAzureCredential } from '@azure/identity';
import { trace, metrics } from '@opentelemetry/api';

const app = express();
const tracer = trace.getTracer('web-search-server');
const meter = metrics.getMeter('web-search-server');

class WebSearchService {
    private bingClient: BingSearchClient;
    private searchCounter = meter.createCounter('web_searches_total');
    private searchDuration = meter.createHistogram('web_search_duration_ms');
    
    constructor() {
        this.bingClient = new BingSearchClient(
            new DefaultAzureCredential(),
            process.env.BING_SEARCH_ENDPOINT!
        );
    }
    
    async searchTravel(query: string, options: SearchOptions = {}): Promise<SearchResult> {
        const span = tracer.startSpan('search_travel');
        const startTime = Date.now();
        
        try {
            // Enhance query with travel context
            const enhancedQuery = this.enhanceQueryForTravel(query);
            
            // Perform Bing search
            const searchResponse = await this.bingClient.web.search(enhancedQuery, {
                count: options.count || 10,
                offset: options.offset || 0,
                market: options.market || 'en-US',
                safeSearch: 'Moderate',
                freshness: options.freshness || 'Month'
            });
            
            // Process and filter results
            const processedResults = this.processSearchResults(searchResponse, query);
            
            // Apply travel-specific scoring
            const scoredResults = this.scoreForTravelRelevance(processedResults);
            
            this.searchCounter.add(1, { status: 'success', type: 'travel' });
            span.setStatus({ code: SpanStatusCode.OK });
            
            return {
                query: enhancedQuery,
                results: scoredResults,
                totalEstimatedMatches: searchResponse.webPages?.totalEstimatedMatches || 0,
                metadata: {
                    searchTime: Date.now() - startTime,
                    market: options.market,
                    freshness: options.freshness
                }
            };
            
        } catch (error) {
            this.searchCounter.add(1, { status: 'error', type: 'travel' });
            span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            throw error;
        } finally {
            this.searchDuration.record(Date.now() - startTime);
            span.end();
        }
    }
    
    private enhanceQueryForTravel(query: string): string {
        // Add travel-specific context to improve results
        const travelKeywords = [
            'travel', 'tourism', 'vacation', 'trip', 'visit',
            'destination', 'attractions', 'hotels', 'flights'
        ];
        
        const hasTravel = travelKeywords.some(keyword => 
            query.toLowerCase().includes(keyword)
        );
        
        if (!hasTravel) {
            return `${query} travel tourism vacation`;
        }
        
        return query;
    }
    
    private processSearchResults(searchResponse: any, originalQuery: string): ProcessedResult[] {
        const results = searchResponse.webPages?.value || [];
        
        return results.map((result: any) => ({
            title: result.name,
            url: result.url,
            snippet: result.snippet,
            dateLastCrawled: result.dateLastCrawled,
            displayUrl: result.displayUrl,
            travelRelevance: this.calculateTravelRelevance(result, originalQuery),
            extractedInfo: this.extractTravelInfo(result)
        }));
    }
    
    private calculateTravelRelevance(result: any, query: string): number {
        let score = 0;
        
        // Travel domain indicators
        const travelDomains = [
            'tripadvisor', 'booking.com', 'expedia', 'airbnb',
            'hotels.com', 'kayak', 'skyscanner', 'lonelyplanet'
        ];
        
        if (travelDomains.some(domain => result.url.includes(domain))) {
            score += 0.3;
        }
        
        // Travel keywords in title/snippet
        const travelTerms = [
            'hotel', 'flight', 'destination', 'attraction', 'restaurant',
            'review', 'guide', 'itinerary', 'activity', 'tour'
        ];
        
        const text = `${result.name} ${result.snippet}`.toLowerCase();
        const matchingTerms = travelTerms.filter(term => text.includes(term));
        score += (matchingTerms.length / travelTerms.length) * 0.4;
        
        // Query term matching
        const queryTerms = query.toLowerCase().split(' ');
        const matchingQuery = queryTerms.filter(term => text.includes(term));
        score += (matchingQuery.length / queryTerms.length) * 0.3;
        
        return Math.min(score, 1.0);
    }
    
    private extractTravelInfo(result: any): TravelInfo {
        const snippet = result.snippet.toLowerCase();
        
        return {
            priceIndicators: this.extractPrices(snippet),
            locationMentions: this.extractLocations(snippet),
            activityTypes: this.extractActivities(snippet),
            ratings: this.extractRatings(snippet)
        };
    }
}
```

#### Available Tools

| Tool Name | Description | Input Schema | Output |
|-----------|-------------|--------------|---------|
| `search_travel_info` | Search for travel-related information | `{query: string, options?: SearchOptions}` | `{results: SearchResult[], metadata: object}` |
| `search_destinations` | Search for destination information | `{destination: string, type?: string}` | `{destination_info: DestinationInfo}` |
| `search_accommodations` | Search for accommodation options | `{location: string, dates?: DateRange, filters?: object}` | `{accommodations: AccommodationResult[]}` |
| `search_activities` | Search for activities and attractions | `{location: string, activity_types?: string[]}` | `{activities: ActivityResult[]}` |

## Communication Protocols

### HTTP-based MCP (echo-ping server)

```typescript
// Client configuration
const client = new MCPHTTPClient(
    "client-id",
    "http://server:port/mcp",
    "access-token"
);

// Tool listing
const tools = await client.listTools();

// Tool execution
const result = await client.callTool("tool_name", {
    parameter: "value"
});
```

### SSE-based MCP (all other servers)

```typescript
// Client configuration
const client = new MCPSSEClient(
    "client-id", 
    "http://server:port/sse",
    "access-token"
);

// Streaming tool execution
const stream = client.callToolStream("tool_name", parameters);
for await (const chunk of stream) {
    // Process streaming response
    console.log(chunk);
}
```

### Error Handling Patterns

```typescript
// Retry with exponential backoff
class MCPClientWithRetry {
    async callToolWithRetry(toolName: string, args: object, maxRetries = 3): Promise<any> {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await this.client.callTool(toolName, args);
            } catch (error) {
                if (attempt === maxRetries - 1) throw error;
                
                const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
}
```

## Performance Considerations

### Caching Strategies

```typescript
// Result caching
class MCPClientWithCache {
    private cache = new Map<string, { result: any, timestamp: number }>();
    private cacheTimeout = 300000; // 5 minutes
    
    async callToolCached(toolName: string, args: object): Promise<any> {
        const cacheKey = `${toolName}:${JSON.stringify(args)}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.result;
        }
        
        const result = await this.client.callTool(toolName, args);
        this.cache.set(cacheKey, { result, timestamp: Date.now() });
        
        return result;
    }
}
```

### Connection Pooling

```typescript
// HTTP connection pooling
import { Agent } from 'http';

const agent = new Agent({
    keepAlive: true,
    maxSockets: 10,
    maxFreeSockets: 5
});

const client = new MCPHTTPClient(config, { httpAgent: agent });
```

### Monitoring and Metrics

```typescript
// Performance monitoring
class InstrumentedMCPClient {
    private callCounter = meter.createCounter('mcp_calls_total');
    private callDuration = meter.createHistogram('mcp_call_duration_ms');
    
    async callTool(toolName: string, args: object): Promise<any> {
        const span = tracer.startSpan(`mcp_call_${toolName}`);
        const startTime = Date.now();
        
        try {
            const result = await this.client.callTool(toolName, args);
            this.callCounter.add(1, { tool: toolName, status: 'success' });
            span.setStatus({ code: SpanStatusCode.OK });
            return result;
        } catch (error) {
            this.callCounter.add(1, { tool: toolName, status: 'error' });
            span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
            throw error;
        } finally {
            this.callDuration.record(Date.now() - startTime, { tool: toolName });
            span.end();
        }
    }
}
```

This comprehensive MCP server documentation provides architects and developers with detailed implementation guidance for building, deploying, and integrating Model Context Protocol servers within the Azure AI Travel Agents ecosystem.