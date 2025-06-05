# API Documentation

This document provides comprehensive API documentation for the Azure AI Travel Agents system, including all endpoints, request/response formats, authentication, and integration patterns.

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication & Security](#authentication--security)
3. [Endpoint Reference](#endpoint-reference)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Real-time Communication](#real-time-communication)
8. [Client Libraries](#client-libraries)
9. [Integration Examples](#integration-examples)

## API Overview

### Base URLs

| Environment | Base URL | Description |
|-------------|----------|-------------|
| Local Development | `http://localhost:4000/api` | Local development server |
| Docker Local | `http://web-api:4000/api` | Docker Compose environment |
| Azure Container Apps | `https://{app-name}.{region}.azurecontainerapps.io/api` | Production deployment |

### Content Types

- **Request Content-Type**: `application/json`
- **Response Content-Type**: `application/json` (REST endpoints), `text/event-stream` (SSE endpoints)
- **Character Encoding**: UTF-8

### API Versioning

Currently, the API does not implement versioning. Future versions will use URL path versioning:
- `/api/v1/...` (current)
- `/api/v2/...` (future)

## Authentication & Security

### Current Implementation

For local development and demonstration purposes, the API currently operates without authentication. This is **not suitable for production use**.

### Production Security Recommendations

#### Azure AD Integration
```typescript
// Recommended authentication middleware
import { BearerTokenAuthenticationPolicy } from '@azure/core-auth';

app.use('/api', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Validate Azure AD token
    const credentials = new DefaultAzureCredential();
    const tokenInfo = await credentials.getToken(['https://graph.microsoft.com/.default']);
    
    // Add user context to request
    req.user = await validateAndDecodeToken(token);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
});
```

#### API Key Authentication
```typescript
// Alternative API key authentication
app.use('/api', (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || !validateApiKey(apiKey)) {
    return res.status(401).json({ error: 'Valid API key required' });
  }
  next();
});
```

### CORS Configuration

```typescript
// Current CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true
}));
```

## Endpoint Reference

### Health & Status Endpoints

#### GET /health

**Purpose**: Service health check for monitoring and load balancers

**Request:**
```http
GET /api/health
Accept: application/json
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T12:00:00Z",
  "version": "1.0.0",
  "environment": "production",
  "dependencies": {
    "mcp_servers": {
      "echo-ping": "healthy",
      "customer-query": "healthy", 
      "destination-recommendation": "healthy",
      "itinerary-planning": "healthy",
      "code-evaluation": "healthy",
      "model-inference": "healthy",
      "web-search": "healthy"
    },
    "external_services": {
      "azure_openai": "healthy",
      "bing_search": "healthy"
    }
  }
}
```

**Status Codes:**
- `200 OK`: Service is healthy
- `503 Service Unavailable`: Service is degraded or unhealthy

**Health Check Details:**
```typescript
interface HealthCheckResponse {
  status: 'OK' | 'DEGRADED' | 'UNHEALTHY';
  timestamp: string;
  version: string;
  environment: string;
  dependencies: {
    mcp_servers: Record<string, 'healthy' | 'unhealthy' | 'unknown'>;
    external_services: Record<string, 'healthy' | 'unhealthy' | 'unknown'>;
  };
  performance?: {
    response_time_ms: number;
    memory_usage_mb: number;
    cpu_usage_percent: number;
  };
}
```

### Tool Discovery Endpoints

#### GET /tools

**Purpose**: Retrieve available MCP tools and their capabilities

**Request:**
```http
GET /api/tools
Accept: application/json
```

**Response:**
```json
{
  "tools": [
    {
      "id": "echo-ping",
      "name": "Echo Test",
      "url": "http://tool-echo-ping:3000/mcp",
      "type": "http",
      "reachable": true,
      "selected": false,
      "tools": [
        {
          "name": "echo",
          "description": "Echo back the input",
          "inputSchema": {
            "type": "object",
            "properties": {
              "input": {
                "type": "string",
                "description": "Text to echo back"
              }
            },
            "required": ["input"]
          }
        },
        {
          "name": "ping",
          "description": "Simple connectivity test",
          "inputSchema": {
            "type": "object",
            "properties": {}
          }
        }
      ],
      "metadata": {
        "version": "1.0.0",
        "last_health_check": "2024-01-01T12:00:00Z",
        "response_time_ms": 45
      }
    },
    {
      "id": "customer-query",
      "name": "Customer Query Processing",
      "url": "http://tool-customer-query:8080/sse",
      "type": "sse",
      "reachable": true,
      "selected": true,
      "tools": [
        {
          "name": "extract_preferences",
          "description": "Extract travel preferences from natural language",
          "inputSchema": {
            "type": "object",
            "properties": {
              "query": {
                "type": "string",
                "description": "User's travel query in natural language"
              }
            },
            "required": ["query"]
          }
        }
      ]
    }
  ],
  "metadata": {
    "total_servers": 7,
    "healthy_servers": 7,
    "last_updated": "2024-01-01T12:00:00Z"
  }
}
```

**Query Parameters:**
- `include_unhealthy` (boolean): Include unreachable servers in response (default: false)
- `detailed` (boolean): Include detailed tool schemas and metadata (default: true)

**Status Codes:**
- `200 OK`: Tools retrieved successfully
- `500 Internal Server Error`: Error fetching tools from MCP servers

### Chat & Processing Endpoints

#### POST /chat

**Purpose**: Process travel queries with AI agents and streaming responses

**Request:**
```http
POST /api/chat
Content-Type: application/json
Accept: text/event-stream

{
  "message": "I want to plan a 7-day vacation to Japan with a budget of $3000",
  "tools": [
    {
      "id": "customer-query",
      "name": "Customer Query Processing",
      "selected": true
    },
    {
      "id": "destination-recommendation", 
      "name": "Destination Recommendation",
      "selected": true
    },
    {
      "id": "itinerary-planning",
      "name": "Itinerary Planning", 
      "selected": true
    },
    {
      "id": "web-search",
      "name": "Web Search",
      "selected": true
    }
  ],
  "context": {
    "conversation_id": "conv_123",
    "user_preferences": {
      "language": "en",
      "currency": "USD",
      "measurement_system": "imperial"
    }
  }
}
```

**Request Schema:**
```typescript
interface ChatRequest {
  message: string;
  tools: ToolSelection[];
  context?: {
    conversation_id?: string;
    user_preferences?: UserPreferences;
    session_data?: Record<string, any>;
  };
  options?: {
    stream?: boolean;
    max_tokens?: number;
    temperature?: number;
    timeout_ms?: number;
  };
}

interface ToolSelection {
  id: string;
  name: string;
  selected: boolean;
  configuration?: Record<string, any>;
}

interface UserPreferences {
  language?: string;
  currency?: string;
  measurement_system?: 'metric' | 'imperial';
  accessibility_needs?: string[];
  dietary_restrictions?: string[];
}
```

**Response (Server-Sent Events):**

The response is streamed using Server-Sent Events (SSE) format:

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

{"type":"metadata","agent":"TriageAgent","event":"AgentSetup","data":{"tools":["customer-query","destination-recommendation"]}}

{"type":"metadata","agent":"CustomerQueryAgent","event":"AgentInput","data":{"input":"I want to plan a 7-day vacation to Japan with a budget of $3000"}}

{"type":"metadata","agent":"CustomerQueryAgent","event":"AgentToolCall","data":{"tool":"extract_preferences","input":{"query":"I want to plan a 7-day vacation to Japan with a budget of $3000"}}}

{"type":"metadata","agent":"CustomerQueryAgent","event":"ToolResultsEvent","data":{"tool":"extract_preferences","result":{"destination":"Japan","duration":"7 days","budget":"$3000","preferences":{"activity_level":"moderate","accommodation_type":"mid-range"}}}}

{"type":"metadata","agent":"CustomerQueryAgent","event":"AgentOutput","data":{"preferences":{"destination":"Japan","duration":"7 days","budget":"$3000","activity_level":"moderate","accommodation_type":"mid-range"}}}

{"type":"metadata","agent":"TriageAgent","event":"AgentHandoff","data":{"from":"CustomerQueryAgent","to":"DestinationRecommendationAgent","context":{"preferences":{"destination":"Japan","duration":"7 days","budget":"$3000"}}}}

{"type":"metadata","agent":"DestinationRecommendationAgent","event":"AgentStream","data":{"content":"Based on your preferences for Japan, I recommend focusing on Tokyo and Kyoto for your 7-day trip..."}}

{"type":"metadata","agent":"DestinationRecommendationAgent","event":"AgentStream","data":{"content":" Tokyo offers modern attractions, shopping, and incredible food scenes, while Kyoto provides traditional temples, gardens, and cultural experiences..."}}

{"type":"metadata","agent":"ItineraryPlanningAgent","event":"AgentOutput","data":{"itinerary":{"days":[{"day":1,"location":"Tokyo","activities":[{"name":"Arrival and Shibuya Exploration","time":"14:00","duration":"4 hours"}]}]}}}

{"type":"end","data":{"conversation_id":"conv_123","total_processing_time_ms":15600,"tokens_used":2847}}
```

**SSE Event Types:**

| Event Type | Description | Data Content |
|------------|-------------|--------------|
| `metadata` | Agent processing information | Agent state, tool calls, intermediate results |
| `stream` | Streaming response content | Partial response text |
| `error` | Error occurred during processing | Error details and recovery information |
| `end` | Processing completed | Final metadata and statistics |

**Event Data Schemas:**

```typescript
interface SSEEvent {
  type: 'metadata' | 'stream' | 'error' | 'end';
  agent?: string;
  event?: string;
  data: any;
  timestamp?: string;
}

interface MetadataEvent {
  type: 'metadata';
  agent: string;
  event: 'AgentSetup' | 'AgentInput' | 'AgentOutput' | 'AgentStream' | 
         'AgentStepEvent' | 'AgentToolCall' | 'ToolResultsEvent' | 
         'ToolCallsEvent' | 'AgentHandoff';
  data: Record<string, any>;
}

interface StreamEvent {
  type: 'stream';
  data: {
    content: string;
    metadata?: Record<string, any>;
  };
}

interface ErrorEvent {
  type: 'error';
  data: {
    error: string;
    code?: string;
    agent?: string;
    tool?: string;
    recoverable: boolean;
  };
}

interface EndEvent {
  type: 'end';
  data: {
    conversation_id?: string;
    total_processing_time_ms: number;
    tokens_used?: number;
    agents_used: string[];
    tools_called: string[];
  };
}
```

**Status Codes:**
- `200 OK`: Stream started successfully
- `400 Bad Request`: Invalid request format or missing required fields
- `408 Request Timeout`: Processing exceeded timeout limit
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Processing error occurred

### Administrative Endpoints

#### GET /metrics

**Purpose**: Retrieve system metrics for monitoring (Prometheus format)

**Request:**
```http
GET /api/metrics
Accept: text/plain
```

**Response:**
```
# HELP api_requests_total Total number of API requests
# TYPE api_requests_total counter
api_requests_total{method="POST",endpoint="/chat",status="200"} 1247
api_requests_total{method="GET",endpoint="/tools",status="200"} 89
api_requests_total{method="GET",endpoint="/health",status="200"} 5432

# HELP api_request_duration_seconds Request duration in seconds
# TYPE api_request_duration_seconds histogram
api_request_duration_seconds_bucket{method="POST",endpoint="/chat",le="1.0"} 102
api_request_duration_seconds_bucket{method="POST",endpoint="/chat",le="5.0"} 987
api_request_duration_seconds_bucket{method="POST",endpoint="/chat",le="10.0"} 1247
api_request_duration_seconds_sum{method="POST",endpoint="/chat"} 3842.5
api_request_duration_seconds_count{method="POST",endpoint="/chat"} 1247

# HELP mcp_tool_calls_total Total number of MCP tool calls
# TYPE mcp_tool_calls_total counter
mcp_tool_calls_total{server="customer-query",tool="extract_preferences",status="success"} 445
mcp_tool_calls_total{server="destination-recommendation",tool="recommend",status="success"} 387
```

**Status Codes:**
- `200 OK`: Metrics retrieved successfully
- `404 Not Found`: Metrics endpoint disabled

## Data Models

### Core Data Types

#### User Message
```typescript
interface UserMessage {
  content: string;
  timestamp: Date;
  metadata?: {
    language?: string;
    source?: 'web' | 'mobile' | 'api';
    user_agent?: string;
  };
}
```

#### Agent Response
```typescript
interface AgentResponse {
  agent_name: string;
  content: string;
  confidence_score?: number;
  sources?: Source[];
  metadata: {
    processing_time_ms: number;
    tokens_used?: number;
    tools_called: string[];
  };
}
```

#### Tool Call
```typescript
interface ToolCall {
  tool_name: string;
  server_id: string;
  input: Record<string, any>;
  output?: Record<string, any>;
  execution_time_ms: number;
  success: boolean;
  error?: string;
}
```

### Travel-Specific Data Models

#### Travel Preferences
```typescript
interface TravelPreferences {
  destinations?: string[];
  budget?: {
    amount: number;
    currency: string;
    flexibility: 'strict' | 'flexible' | 'very_flexible';
  };
  duration?: {
    days: number;
    flexibility_days?: number;
  };
  dates?: {
    start_date?: Date;
    end_date?: Date;
    flexible?: boolean;
    peak_season_ok?: boolean;
  };
  group?: {
    size: number;
    composition: 'solo' | 'couple' | 'family' | 'friends' | 'business';
    ages?: number[];
  };
  accommodation?: {
    type: 'hotel' | 'airbnb' | 'hostel' | 'resort' | 'mixed';
    quality_level: 'budget' | 'mid-range' | 'luxury';
    amenities?: string[];
  };
  transportation?: {
    preferred_modes: string[];
    domestic_flights_ok: boolean;
    rental_car_needed: boolean;
  };
  activities?: {
    interests: string[];
    activity_level: 'low' | 'moderate' | 'high';
    cultural_experiences: boolean;
    outdoor_activities: boolean;
    nightlife: boolean;
  };
  constraints?: {
    dietary_restrictions?: string[];
    accessibility_needs?: string[];
    language_requirements?: string[];
    visa_restrictions?: string[];
  };
}
```

#### Destination
```typescript
interface Destination {
  id: string;
  name: string;
  country: string;
  region?: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  description: string;
  highlights: string[];
  best_time_to_visit: {
    months: string[];
    weather_info: string;
  };
  budget_estimates: {
    budget: { daily_cost: number; description: string; };
    mid_range: { daily_cost: number; description: string; };
    luxury: { daily_cost: number; description: string; };
  };
  activities: Activity[];
  practical_info: {
    languages: string[];
    currency: string;
    visa_required: boolean;
    safety_rating: number;
    internet_quality: 'poor' | 'fair' | 'good' | 'excellent';
  };
  metadata: {
    popularity_score: number;
    last_updated: Date;
    data_sources: string[];
  };
}
```

#### Itinerary
```typescript
interface Itinerary {
  id: string;
  title: string;
  description: string;
  duration_days: number;
  destinations: string[];
  daily_plans: DailyPlan[];
  cost_estimate: CostEstimate;
  practical_info: {
    packing_suggestions: string[];
    health_recommendations: string[];
    cultural_tips: string[];
    emergency_contacts: EmergencyContact[];
  };
  metadata: {
    created_at: Date;
    last_modified: Date;
    version: string;
    customization_level: 'basic' | 'detailed' | 'comprehensive';
  };
}

interface DailyPlan {
  day: number;
  date?: Date;
  location: string;
  theme: string;
  activities: ScheduledActivity[];
  meals: MealRecommendation[];
  accommodation?: AccommodationInfo;
  transportation: TransportationSegment[];
  estimated_cost: number;
  alternatives: {
    weather_backup: ScheduledActivity[];
    budget_options: ScheduledActivity[];
  };
  notes: string[];
}

interface ScheduledActivity {
  id: string;
  name: string;
  description: string;
  location: {
    name: string;
    address: string;
    coordinates: { latitude: number; longitude: number; };
  };
  start_time: string; // HH:MM format
  duration_minutes: number;
  cost: number;
  booking_info?: {
    booking_required: boolean;
    booking_url?: string;
    booking_notes?: string;
  };
  difficulty_level: 'easy' | 'moderate' | 'challenging';
  weather_dependent: boolean;
  age_appropriate: number[]; // Minimum ages
  accessibility: {
    wheelchair_accessible: boolean;
    notes?: string;
  };
}
```

#### Cost Estimate
```typescript
interface CostEstimate {
  currency: string;
  total: number;
  breakdown: {
    accommodation: number;
    transportation: {
      flights: number;
      local_transport: number;
      car_rental?: number;
    };
    activities: number;
    meals: number;
    shopping: number;
    miscellaneous: number;
  };
  per_person: number;
  per_day: number;
  confidence_level: number; // 0-1 score
  last_updated: Date;
  assumptions: string[];
  cost_saving_tips: string[];
}
```

## Error Handling

### Standard Error Response Format

```typescript
interface APIError {
  error: string;
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  request_id?: string;
  documentation_url?: string;
}
```

### Error Codes

| HTTP Status | Error Code | Description | Recovery Action |
|-------------|------------|-------------|-----------------|
| 400 | `INVALID_REQUEST` | Request format is invalid | Check request schema |
| 400 | `MISSING_REQUIRED_FIELD` | Required field missing | Add missing field |
| 400 | `INVALID_TOOL_SELECTION` | Selected tool is invalid | Check available tools |
| 401 | `AUTHENTICATION_REQUIRED` | No authentication provided | Provide valid credentials |
| 401 | `INVALID_CREDENTIALS` | Invalid authentication | Check API key/token |
| 403 | `INSUFFICIENT_PERMISSIONS` | User lacks permissions | Contact administrator |
| 404 | `ENDPOINT_NOT_FOUND` | API endpoint not found | Check endpoint URL |
| 408 | `REQUEST_TIMEOUT` | Request processing timeout | Retry with simpler query |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests | Implement backoff strategy |
| 500 | `INTERNAL_SERVER_ERROR` | Server processing error | Retry after delay |
| 500 | `MCP_SERVER_ERROR` | MCP server communication error | Check server status |
| 503 | `SERVICE_UNAVAILABLE` | Service temporarily unavailable | Retry after delay |

### Error Response Examples

#### Bad Request Error
```json
{
  "error": "INVALID_REQUEST",
  "code": "MISSING_REQUIRED_FIELD",
  "message": "Required field 'message' is missing from request body",
  "details": {
    "field": "message",
    "expected_type": "string"
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "request_id": "req_abc123",
  "documentation_url": "https://docs.example.com/api#chat-endpoint"
}
```

#### MCP Server Error
```json
{
  "error": "MCP_SERVER_ERROR",
  "code": "TOOL_EXECUTION_FAILED",
  "message": "Customer query tool failed to process request",
  "details": {
    "server": "customer-query",
    "tool": "extract_preferences",
    "server_error": "Azure OpenAI service temporarily unavailable",
    "retry_after_seconds": 30
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "request_id": "req_def456"
}
```

#### Rate Limiting Error
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "code": "TOO_MANY_REQUESTS",
  "message": "Rate limit of 100 requests per hour exceeded",
  "details": {
    "limit": 100,
    "window": "1 hour",
    "retry_after_seconds": 1800,
    "current_usage": 101
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "request_id": "req_ghi789"
}
```

## Rate Limiting

### Current Limits

| Endpoint | Rate Limit | Window | Burst Limit |
|----------|------------|--------|-------------|
| `/health` | 1000/hour | 1 hour | 100/minute |
| `/tools` | 100/hour | 1 hour | 10/minute |
| `/chat` | 50/hour | 1 hour | 5/minute |

### Rate Limit Headers

```http
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 47
X-RateLimit-Reset: 1704110400
X-RateLimit-Window: 3600
```

### Rate Limiting Implementation

```typescript
import rateLimit from 'express-rate-limit';

const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each IP to 50 requests per windowMs
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    code: 'TOO_MANY_REQUESTS',
    message: 'Rate limit exceeded for chat endpoint'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/chat', chatLimiter);
```

## Real-time Communication

### Server-Sent Events (SSE)

The `/chat` endpoint uses Server-Sent Events for real-time streaming responses.

#### Client Implementation Example

```typescript
class ChatClient {
  async streamChat(message: string, tools: ToolSelection[]): Promise<AsyncIterable<SSEEvent>> {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({ message, tools })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    return {
      async *[Symbol.asyncIterator]() {
        try {
          while (true) {
            const { done, value } = await reader!.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n\n').filter(line => line.trim());

            for (const line of lines) {
              try {
                const event: SSEEvent = JSON.parse(line);
                yield event;
              } catch (e) {
                console.warn('Failed to parse SSE event:', line);
              }
            }
          }
        } finally {
          reader?.releaseLock();
        }
      }
    };
  }
}

// Usage example
const client = new ChatClient();
const stream = client.streamChat("Plan a trip to Japan", selectedTools);

for await (const event of stream) {
  switch (event.type) {
    case 'metadata':
      console.log(`Agent ${event.agent} event: ${event.event}`);
      break;
    case 'stream':
      console.log(`Response chunk: ${event.data.content}`);
      break;
    case 'error':
      console.error(`Error: ${event.data.error}`);
      break;
    case 'end':
      console.log('Processing completed');
      break;
  }
}
```

#### Connection Management

```typescript
// SSE connection with automatic reconnection
class RobustChatClient {
  private maxRetries = 3;
  private retryDelay = 1000;

  async streamChatWithRetry(
    message: string, 
    tools: ToolSelection[],
    onEvent: (event: SSEEvent) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    let attempts = 0;

    while (attempts < this.maxRetries) {
      try {
        const stream = await this.streamChat(message, tools);
        
        for await (const event of stream) {
          onEvent(event);
          
          if (event.type === 'end') {
            return; // Successful completion
          }
          
          if (event.type === 'error' && !event.data.recoverable) {
            throw new Error(event.data.error);
          }
        }
        
        return; // Stream ended normally
        
      } catch (error) {
        attempts++;
        
        if (attempts >= this.maxRetries) {
          onError(error as Error);
          return;
        }
        
        await new Promise(resolve => 
          setTimeout(resolve, this.retryDelay * attempts)
        );
      }
    }
  }
}
```

## Client Libraries

### TypeScript/JavaScript

```typescript
// NPM package: @azure-ai-travel-agents/client
import { TravelAgentsClient } from '@azure-ai-travel-agents/client';

const client = new TravelAgentsClient({
  baseUrl: 'https://your-api.azurecontainerapps.io/api',
  apiKey: 'your-api-key', // when authentication is implemented
  timeout: 30000,
  retries: 3
});

// Get available tools
const tools = await client.getTools();

// Stream chat response
for await (const event of client.streamChat(message, selectedTools)) {
  // Handle streaming events
}

// Non-streaming chat (convenience method)
const response = await client.chat(message, selectedTools);
```

### Python

```python
# pip install azure-ai-travel-agents-client
from azure_ai_travel_agents import TravelAgentsClient

client = TravelAgentsClient(
    base_url="https://your-api.azurecontainerapps.io/api",
    api_key="your-api-key",  # when authentication is implemented
    timeout=30.0,
    max_retries=3
)

# Get available tools
tools = await client.get_tools()

# Stream chat response
async for event in client.stream_chat(message, selected_tools):
    # Handle streaming events
    pass

# Non-streaming chat
response = await client.chat(message, selected_tools)
```

### C#

```csharp
// NuGet: Azure.AI.TravelAgents.Client
using Azure.AI.TravelAgents;

var client = new TravelAgentsClient(
    new Uri("https://your-api.azurecontainerapps.io/api"),
    new DefaultAzureCredential(),
    new TravelAgentsClientOptions 
    { 
        Timeout = TimeSpan.FromSeconds(30),
        MaxRetries = 3 
    }
);

// Get available tools
var tools = await client.GetToolsAsync();

// Stream chat response
await foreach (var @event in client.StreamChatAsync(message, selectedTools))
{
    // Handle streaming events
}

// Non-streaming chat
var response = await client.ChatAsync(message, selectedTools);
```

## Integration Examples

### React Frontend Integration

```tsx
import React, { useState, useEffect } from 'react';
import { TravelAgentsClient } from '@azure-ai-travel-agents/client';

const client = new TravelAgentsClient({
  baseUrl: process.env.REACT_APP_API_URL
});

export const ChatComponent: React.FC = () => {
  const [message, setMessage] = useState('');
  const [tools, setTools] = useState([]);
  const [responses, setResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load available tools on component mount
    client.getTools().then(setTools);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const selectedTools = tools.filter(tool => tool.selected);
    
    try {
      for await (const event of client.streamChat(message, selectedTools)) {
        if (event.type === 'stream') {
          setResponses(prev => [...prev, event.data.content]);
        } else if (event.type === 'end') {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-component">
      <form onSubmit={handleSubmit}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your travel plans..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Send'}
        </button>
      </form>
      
      <div className="responses">
        {responses.map((response, index) => (
          <div key={index} className="response-chunk">
            {response}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Express.js Middleware Integration

```typescript
import express from 'express';
import { TravelAgentsClient } from '@azure-ai-travel-agents/client';

const app = express();
const travelClient = new TravelAgentsClient({
  baseUrl: process.env.TRAVEL_API_URL
});

// Middleware to add travel planning capabilities
app.use('/api/travel', async (req, res, next) => {
  req.travelClient = travelClient;
  next();
});

// Endpoint to process travel requests
app.post('/api/travel/plan', async (req, res) => {
  const { message, preferences } = req.body;
  
  try {
    // Get available tools
    const availableTools = await req.travelClient.getTools();
    const selectedTools = availableTools.filter(tool => 
      ['customer-query', 'destination-recommendation', 'itinerary-planning']
        .includes(tool.id)
    );

    // Set up SSE response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream response to client
    for await (const event of req.travelClient.streamChat(message, selectedTools)) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Mobile App Integration (React Native)

```typescript
// React Native with real-time chat
import { useState, useEffect } from 'react';

const useTravelChat = () => {
  const [client] = useState(() => new TravelAgentsClient({
    baseUrl: 'https://your-api.azurecontainerapps.io/api'
  }));

  const streamTravelPlan = async (
    message: string,
    onUpdate: (content: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ) => {
    try {
      const tools = await client.getTools();
      const selectedTools = tools.filter(tool => tool.selected);

      for await (const event of client.streamChat(message, selectedTools)) {
        switch (event.type) {
          case 'stream':
            onUpdate(event.data.content);
            break;
          case 'end':
            onComplete();
            break;
          case 'error':
            onError(new Error(event.data.error));
            break;
        }
      }
    } catch (error) {
      onError(error as Error);
    }
  };

  return { streamTravelPlan };
};

// Usage in component
export const TravelPlanScreen = () => {
  const [plan, setPlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { streamTravelPlan } = useTravelChat();

  const handlePlanRequest = async (message: string) => {
    setIsLoading(true);
    setPlan('');

    await streamTravelPlan(
      message,
      (content) => setPlan(prev => prev + content),
      () => setIsLoading(false),
      (error) => {
        console.error('Planning error:', error);
        setIsLoading(false);
      }
    );
  };

  // Component JSX...
};
```

This comprehensive API documentation provides developers with all the information needed to integrate with the Azure AI Travel Agents system, including detailed endpoint specifications, data models, error handling, and practical integration examples.