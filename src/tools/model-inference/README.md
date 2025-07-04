# Model Inference Service

This service provides OpenAI-compatible ONNX-based machine learning model inference capabilities for the AI Travel Agents application.

## Overview

The Model Inference service runs as a containerized HTTP server that:

- Loads ONNX models for high-performance inference
- Provides OpenAI-compatible RESTful API endpoints
- Supports both language models and general ML models
- Includes mock responses for demonstration and testing
- Runs on Azure Container Apps with serverless GPU capabilities

## Features

- **OpenAI Compatibility**: Full compatibility with OpenAI API format
- **ONNX Runtime**: Uses Microsoft's ONNX Runtime for optimized inference
- **Dual API Support**: Both OpenAI-compatible and raw ONNX endpoints
- **Docker Support**: Fully containerized for easy deployment
- **Demo Mode**: Includes mock responses for testing without language models
- **Health Checks**: Built-in health monitoring endpoints

## API Endpoints

### OpenAI-Compatible Endpoints

#### GET /v1/models
Lists available models in OpenAI-compatible format.

Response:
```json
{
  "object": "list",
  "data": [
    {
      "id": "onnx-model",
      "object": "model",
      "created": 1699123456,
      "owned_by": "onnx-inference"
    }
  ]
}
```

#### POST /v1/chat/completions
OpenAI-compatible chat completions endpoint.

Request:
```json
{
  "model": "onnx-model",
  "messages": [
    {"role": "user", "content": "Help me plan a trip to Paris"}
  ],
  "max_tokens": 100,
  "temperature": 0.7
}
```

Response:
```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1699123456,
  "model": "onnx-model",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "I'd be happy to help with your Paris travel plans! When are you planning to visit?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

#### POST /v1/completions
OpenAI-compatible text completions endpoint.

Request:
```json
{
  "model": "onnx-model",
  "prompt": "The best travel destination for",
  "max_tokens": 50,
  "temperature": 0.7
}
```

Response:
```json
{
  "id": "cmpl-abc123",
  "object": "text_completion",
  "created": 1699123456,
  "model": "onnx-model",
  "choices": [
    {
      "text": " planning can be exciting! Consider factors like budget, season, and activities you enjoy.",
      "index": 0,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 5,
    "completion_tokens": 15,
    "total_tokens": 20
  }
}
```

### Legacy Endpoints

#### GET /
Returns usage information and available endpoints.

#### GET /health
Health check endpoint that returns service status and model loading status.

Response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "service": "onnx-inference"
}
```

#### GET /info
Returns information about the loaded model including input/output specifications.

Response:
```json
{
  "model_loaded": true,
  "inputs": [
    {
      "name": "input",
      "shape": "[None, 3]",
      "type": "tensor(float)"
    }
  ],
  "outputs": [
    {
      "name": "output", 
      "shape": "[None, 1]",
      "type": "tensor(float)"
    }
  ]
}
```

#### POST /predict
Performs raw ONNX model inference on the provided input data.

Request:
```json
{
  "inputs": {
    "input": [[1.0, 2.0, 3.0]]
  }
}
```

Response:
```json
{
  "status": "success",
  "prediction": {
    "output": [[7.5]]
  }
}
```

## Architecture

The service is designed to integrate with the AI Travel Agents architecture:

- Runs as `tool-model-inference` in docker-compose
- Exposed on port 5005 externally, port 5000 internally
- Provides OpenAI-compatible API endpoints for seamless integration
- Communicates with the main API service via HTTP
- Deployed to Azure Container Apps for production

## OpenAI Compatibility

This service provides full OpenAI API compatibility, making it a drop-in replacement for OpenAI API calls:

- **Chat Completions**: `/v1/chat/completions` endpoint
- **Text Completions**: `/v1/completions` endpoint  
- **Models**: `/v1/models` endpoint
- **Standard Format**: Request/response format matches OpenAI specification
- **Mock Responses**: Provides travel-themed responses when no language model is loaded

## Demo Model

The service includes a simple linear regression model for demonstration:
- **Input**: 3-dimensional float vector
- **Output**: Single float value
- **Formula**: `output = input[0]*2.0 + input[1]*1.5 + input[2]*0.5 + 1.0`

When using OpenAI endpoints with the demo model, the service provides mock travel-themed responses.

## Custom Models

To use your own ONNX model:

1. Replace `model.onnx` in the container
2. Ensure your model follows ONNX format specifications
3. Update the input/output handling in `inference.py` if needed

## Development

### Building Locally
```bash
docker build -t model-inference .
```

### Running Locally
```bash
docker run -p 5000:5000 model-inference
```

### Testing OpenAI Endpoints
```bash
# List models
curl http://localhost:5000/v1/models

# Chat completion
curl -X POST http://localhost:5000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "onnx-model",
    "messages": [{"role": "user", "content": "Help me plan a trip to Tokyo"}],
    "max_tokens": 100
  }'

# Text completion
curl -X POST http://localhost:5000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "onnx-model",
    "prompt": "The best travel destination for families is",
    "max_tokens": 50
  }'
```

### Testing Legacy Endpoints
```bash
# Health check
curl http://localhost:5000/health

# Model info
curl http://localhost:5000/info

# Raw ONNX prediction
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{"inputs": {"input": [[1.0, 2.0, 3.0]]}}'
```

## Dependencies

- Python 3.11
- ONNX Runtime 1.19.2
- NumPy 1.24.3
- ONNX 1.15.0

## Azure Container Apps Deployment

This service is configured to run on Azure Container Apps with:
- Serverless scaling
- GPU support for inference workloads
- Integrated with Azure Monitor for observability
- Secure networking within the container apps environment