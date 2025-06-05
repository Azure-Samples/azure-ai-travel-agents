# Model Inference Service

This service provides ONNX-based machine learning model inference capabilities for the AI Travel Agents application.

## Overview

The Model Inference service runs as a containerized HTTP server that:

- Loads ONNX models for high-performance inference
- Provides RESTful API endpoints for model prediction
- Supports both custom models and includes a demonstration model
- Runs on Azure Container Apps with serverless GPU capabilities

## Features

- **ONNX Runtime**: Uses Microsoft's ONNX Runtime for optimized inference
- **HTTP API**: Simple REST endpoints for health checks and predictions
- **Docker Support**: Fully containerized for easy deployment
- **Demo Mode**: Includes a simple linear regression model for testing
- **Health Checks**: Built-in health monitoring endpoints

## API Endpoints

### GET /
Returns usage information and available endpoints.

### GET /health
Health check endpoint that returns service status and model loading status.

Response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "service": "onnx-inference"
}
```

### GET /info
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

### POST /predict
Performs model inference on the provided input data.

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
- Communicates with the main API service via HTTP
- Deployed to Azure Container Apps for production

## Demo Model

The service includes a simple linear regression model for demonstration:
- **Input**: 3-dimensional float vector
- **Output**: Single float value
- **Formula**: `output = input[0]*2.0 + input[1]*1.5 + input[2]*0.5 + 1.0`

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

### Testing
```bash
# Health check
curl http://localhost:5000/health

# Model info
curl http://localhost:5000/info

# Prediction
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