# API Management (APIM) Integration

This document describes the Azure API Management (APIM) integration for the Azure AI Travel Agents application.

## Overview

The application now includes Azure API Management as a gateway to secure and manage all endpoints. APIM provides:

- **Centralized API Gateway**: Single entry point for all services
- **GenAI Capabilities**: Specialized policies for AI/ML workloads
- **Security**: Authentication, authorization, and content filtering
- **Monitoring**: Comprehensive logging and metrics for GenAI usage
- **Rate Limiting**: Protect backend services from overload

## Architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Clients   │───▶│     APIM     │───▶│   Backend       │
│   (UI/Apps) │    │   Gateway    │    │   Services      │
└─────────────┘    └──────────────┘    └─────────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │   Policies   │
                   │   • GenAI    │
                   │   • Security │
                   │   • Logging  │
                   └──────────────┘
```

## Services Protected by APIM

### Frontend Services
- **UI Service**: `/ui/*` - Angular application interface
- **API Service**: `/api/*` - Main API backend

### MCP (Model Context Protocol) Services
- **Customer Query**: `/mcp/customer-query/*` - Customer inquiry processing
- **Destination Recommendation**: `/mcp/destination-recommendation/*` - Travel destination suggestions
- **Itinerary Planning**: `/mcp/itinerary-planning/*` - Trip planning and scheduling
- **Echo Ping**: `/mcp/echo-ping/*` - Health check and testing
- **Web Search**: `/mcp/web-search/*` - Web search functionality
- **Model Inference**: `/mcp/model-inference/*` - AI model inference
- **Code Evaluation**: `/mcp/code-evaluation/*` - Code execution and evaluation

## GenAI Capabilities

### Rate Limiting
- **Model Inference**: 50 calls/minute, 500 calls/hour
- **Code Evaluation**: 30 calls/minute, 300 calls/hour
- **Other MCP Services**: 100 calls/minute, 1000 calls/hour
- **API Services**: 500 calls/minute, 5000 calls/hour
- **UI Services**: 200 calls/minute, 2000 calls/hour

### Content Safety
- Automatic filtering of harmful or malicious content
- Request size limits (1MB max for GenAI services)
- Response content validation

### Monitoring and Logging
- Request/response correlation tracking
- GenAI-specific metrics (tokens, response times, service types)
- Error tracking with detailed context
- Usage analytics for cost optimization

## Security Features

### Authentication
- JWT token validation for MCP services
- Service-specific access tokens
- Audience validation

### Headers
- Security headers (HSTS, XSS protection, etc.)
- Correlation IDs for request tracing
- GenAI service identification

### Circuit Breaker
- Automatic retry with exponential backoff
- Service health monitoring
- Graceful degradation

## Configuration

### Environment Variables
The following environment variables are automatically configured to route through APIM:

```bash
# MCP Service URLs (now route through APIM)
MCP_CUSTOMER_QUERY_URL=${APIM_GATEWAY_URL}/mcp/customer-query
MCP_DESTINATION_RECOMMENDATION_URL=${APIM_GATEWAY_URL}/mcp/destination-recommendation
MCP_ITINERARY_PLANNING_URL=${APIM_GATEWAY_URL}/mcp/itinerary-planning
MCP_ECHO_PING_URL=${APIM_GATEWAY_URL}/mcp/echo-ping
MCP_WEB_SEARCH_URL=${APIM_GATEWAY_URL}/mcp/web-search
MCP_MODEL_INFERENCE_URL=${APIM_GATEWAY_URL}/mcp/model-inference
MCP_CODE_EVALUATION_URL=${APIM_GATEWAY_URL}/mcp/code-evaluation
```

### APIM Policies

#### Global Policy (`global-policy.xml`)
- CORS configuration
- Global rate limiting and quotas
- Security headers
- Content filtering
- Usage tracking

#### API Policy (`api-policy.xml`)
- Service-specific authentication
- Dynamic backend routing
- GenAI-specific rate limits
- Request/response transformation
- Error handling

## Deployment

The APIM infrastructure is deployed as part of the main bicep template:

```bicep
module apim './modules/apim.bicep' = {
  name: 'apim'
  params: {
    location: location
    tags: tags
    apimName: '${abbrs.apiManagementService}${resourceToken}'
    publisherEmail: 'admin@${resourceToken}.com'
    containerAppsDefaultDomain: containerAppsEnvironment.outputs.defaultDomain
  }
}
```

## Usage

### Accessing Services

Instead of calling services directly:
```
❌ https://customer-query.internal.domain/endpoint
```

Use APIM gateway:
```
✅ https://apim-gateway-url/mcp/customer-query/endpoint
```

### Authentication

For MCP services, include authentication header:
```bash
curl -H "Authorization: Bearer <token>" \
     https://apim-gateway-url/mcp/customer-query/analyze
```

### Monitoring

View API usage and performance:
1. Azure Portal → API Management
2. Analytics dashboard
3. GenAI-specific metrics in logs

## Benefits

1. **Security**: Centralized authentication and authorization
2. **Observability**: Comprehensive monitoring and logging
3. **Reliability**: Circuit breakers and retry policies
4. **Cost Control**: Usage tracking and rate limiting
5. **Compliance**: Content filtering and audit trails
6. **Performance**: Caching and request optimization

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check API tokens and authentication headers
2. **429 Rate Limited**: Review rate limits and implement backoff
3. **502 Bad Gateway**: Check backend service health
4. **413 Request Too Large**: Reduce request payload size

### Debugging

Use correlation IDs from response headers to trace requests:
```bash
X-Correlation-ID: 12345678-1234-1234-1234-123456789012
```

### Logs

Check APIM logs in Azure Monitor for detailed request/response information and GenAI usage metrics.