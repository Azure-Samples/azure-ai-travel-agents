---
title: mcp-servers
createTime: 2025/06/06 13:07:02
permalink: /article/6rbv3t1r/
---
# MCP Server Implementation Guide

This document provides detailed technical documentation for each Model Context Protocol (MCP) server in the Azure AI Travel Agents system, including their architecture, APIs, and integration patterns.

## Table of Contents

1. [MCP Overview](#mcp-overview)
2. [Server Implementations](#server-implementations)
3. [Communication Protocols](#communication-protocols)
4. [Tool Specifications](#tool-specifications)
5. [Error Handling](#error-handling)
6. [Performance Considerations](#performance-considerations)
7. [Development Guidelines](#development-guidelines)

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

## Server Implementations

### 1. Echo Ping Server (TypeScript/Node.js)

**Purpose**: Testing and validation of MCP communication patterns
**Port**: 5007 (3000 internal)
**Technology**: TypeScript, Express.js, MCP SDK

#### Architecture

```typescript
// Server setup
import { McpServer } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new McpServer({
  name: "echo-ping-server",
  version: "1.0.0"
});
```

#### Available Tools

| Tool Name | Description | Input Schema | Output |
|-----------|-------------|--------------|---------|
| `echo` | Echoes back the input string | `{input: string}` | `{result: string}` |
| `ping` | Simple connectivity test | `{}` | `{status: "pong", timestamp: number}` |

#### Tool Implementation Example

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case "echo":
      return {
        content: [
          {
            type: "text",
            text: `Echo: ${args.input}`
          }
        ]
      };
    
    case "ping":
      return {
        content: [
          {
            type: "text", 
            text: JSON.stringify({
              status: "pong",
              timestamp: Date.now(),
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