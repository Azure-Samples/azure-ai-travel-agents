#!/usr/bin/env python3
"""
OpenAI-compliant ONNX inference server for Azure Container Apps.
This service provides OpenAI-compatible HTTP endpoints for model inference using ONNX Runtime.
"""

import json
import os
import logging
import time
import uuid
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    import onnxruntime as ort
    logger.info("ONNX Runtime imported successfully")
except ImportError:
    logger.error("ONNX Runtime not found. Installing...")
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "onnxruntime"])
    import onnxruntime as ort


class OpenAICompatibleHandler(BaseHTTPRequestHandler):
    """HTTP request handler for OpenAI-compatible ONNX model inference."""
    
    def __init__(self, *args, **kwargs):
        # Initialize ONNX session
        self.session = None
        self.model_path = "/app/model.onnx"
        self.model_name = "onnx-model"
        self.load_model()
        super().__init__(*args, **kwargs)
    
    def load_model(self):
        """Load the ONNX model if available."""
        if os.path.exists(self.model_path):
            try:
                self.session = ort.InferenceSession(self.model_path)
                logger.info(f"Model loaded successfully from {self.model_path}")
                
                # Log model info
                input_info = self.session.get_inputs()
                output_info = self.session.get_outputs()
                logger.info(f"Model inputs: {[(inp.name, inp.shape, inp.type) for inp in input_info]}")
                logger.info(f"Model outputs: {[(out.name, out.shape, out.type) for out in output_info]}")
            except Exception as e:
                logger.error(f"Failed to load model: {e}")
                self.session = None
        else:
            logger.warning(f"Model file not found at {self.model_path}. Running in demo mode.")
    
    def do_GET(self):
        """Handle GET requests."""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == "/health":
            self.handle_health()
        elif parsed_path.path == "/info":
            self.handle_info()
        elif parsed_path.path == "/v1/models":
            self.handle_models()
        else:
            self.handle_root()
    
    def do_POST(self):
        """Handle POST requests."""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == "/predict":
            self.handle_predict()
        elif parsed_path.path == "/v1/chat/completions":
            self.handle_chat_completions()
        elif parsed_path.path == "/v1/completions":
            self.handle_completions()
        else:
            self.send_error(404, "Endpoint not found")
    
    def handle_health(self):
        """Health check endpoint."""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        health_status = {
            "status": "healthy",
            "model_loaded": self.session is not None,
            "service": "onnx-inference"
        }
        
        self.wfile.write(json.dumps(health_status).encode())
    
    def handle_info(self):
        """Model information endpoint."""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        if self.session:
            input_info = self.session.get_inputs()
            output_info = self.session.get_outputs()
            
            model_info = {
                "model_loaded": True,
                "inputs": [{"name": inp.name, "shape": str(inp.shape), "type": inp.type} for inp in input_info],
                "outputs": [{"name": out.name, "shape": str(out.shape), "type": out.type} for out in output_info]
            }
        else:
            model_info = {
                "model_loaded": False,
                "message": "No model loaded. Running in demo mode."
            }
        
        self.wfile.write(json.dumps(model_info).encode())
    
    def handle_models(self):
        """OpenAI-compatible models endpoint."""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        models_response = {
            "object": "list",
            "data": [
                {
                    "id": self.model_name,
                    "object": "model",
                    "created": int(time.time()),
                    "owned_by": "onnx-inference",
                    "permission": [],
                    "root": self.model_name,
                    "parent": None
                }
            ]
        }
        
        self.wfile.write(json.dumps(models_response).encode())

    def handle_chat_completions(self):
        """OpenAI-compatible chat completions endpoint."""
        try:
            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            # Extract OpenAI parameters
            messages = request_data.get('messages', [])
            model = request_data.get('model', self.model_name)
            max_tokens = request_data.get('max_tokens', 100)
            temperature = request_data.get('temperature', 0.7)
            stream = request_data.get('stream', False)
            
            # Generate response using ONNX model or mock response
            if self.session and self.is_text_model():
                # Use ONNX model for text generation
                response_text = self.generate_text_with_onnx(messages)
            else:
                # Mock response for non-text models or demo mode
                response_text = self.generate_mock_response(messages)
            
            # Create OpenAI-compatible response
            response = {
                "id": f"chatcmpl-{uuid.uuid4().hex[:8]}",
                "object": "chat.completion",
                "created": int(time.time()),
                "model": model,
                "choices": [
                    {
                        "index": 0,
                        "message": {
                            "role": "assistant",
                            "content": response_text
                        },
                        "finish_reason": "stop"
                    }
                ],
                "usage": {
                    "prompt_tokens": self.count_tokens(messages),
                    "completion_tokens": self.count_tokens([{"content": response_text}]),
                    "total_tokens": self.count_tokens(messages) + self.count_tokens([{"content": response_text}])
                }
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            logger.error(f"Chat completion error: {e}")
            self.send_openai_error(500, "internal_server_error", f"Internal server error: {str(e)}")

    def handle_completions(self):
        """OpenAI-compatible completions endpoint."""
        try:
            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            # Extract OpenAI parameters
            prompt = request_data.get('prompt', '')
            model = request_data.get('model', self.model_name)
            max_tokens = request_data.get('max_tokens', 100)
            temperature = request_data.get('temperature', 0.7)
            
            # Generate response using ONNX model or mock response
            if self.session and self.is_text_model():
                # Use ONNX model for text generation
                response_text = self.generate_text_with_onnx([{"role": "user", "content": prompt}])
            else:
                # Mock response for non-text models or demo mode
                response_text = self.generate_mock_completion(prompt)
            
            # Create OpenAI-compatible response
            response = {
                "id": f"cmpl-{uuid.uuid4().hex[:8]}",
                "object": "text_completion",
                "created": int(time.time()),
                "model": model,
                "choices": [
                    {
                        "text": response_text,
                        "index": 0,
                        "logprobs": None,
                        "finish_reason": "stop"
                    }
                ],
                "usage": {
                    "prompt_tokens": len(prompt.split()),
                    "completion_tokens": len(response_text.split()),
                    "total_tokens": len(prompt.split()) + len(response_text.split())
                }
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            logger.error(f"Completion error: {e}")
            self.send_openai_error(500, "internal_server_error", f"Internal server error: {str(e)}")

    def is_text_model(self):
        """Check if the loaded ONNX model is suitable for text generation."""
        if not self.session:
            return False
        
        # Simple heuristic: check if model has text-like input/output shapes
        # This is a placeholder - in practice, you'd check model metadata
        try:
            inputs = self.session.get_inputs()
            outputs = self.session.get_outputs()
            
            # For now, assume it's not a text model if it's the demo linear regression
            # In practice, you'd check model metadata or input/output characteristics
            return False  # Default to False for demo model
        except:
            return False

    def generate_text_with_onnx(self, messages):
        """Generate text using the ONNX model (placeholder implementation)."""
        # This is a placeholder for actual ONNX text generation
        # You would implement proper tokenization and inference here
        return "This would be generated by your ONNX language model."

    def generate_mock_response(self, messages):
        """Generate a mock response for chat completion."""
        if not messages:
            return "Hello! How can I help you with your travel plans?"
        
        last_message = messages[-1].get('content', '').lower()
        
        # Simple travel-themed responses
        if 'travel' in last_message or 'trip' in last_message:
            return "I'd be happy to help with your travel plans! Where would you like to go?"
        elif 'hotel' in last_message or 'accommodation' in last_message:
            return "I can help you find great accommodation options. What's your destination and preferred dates?"
        elif 'flight' in last_message or 'airline' in last_message:
            return "Let me help you find the best flight options. What are your departure and arrival cities?"
        elif 'restaurant' in last_message or 'food' in last_message:
            return "I can recommend some excellent dining options! What type of cuisine are you interested in?"
        else:
            return "I'm an AI travel assistant powered by ONNX inference. How can I help you plan your next adventure?"

    def generate_mock_completion(self, prompt):
        """Generate a mock completion for the completions endpoint."""
        prompt_lower = prompt.lower()
        
        if 'travel' in prompt_lower:
            return " planning can be exciting! Consider factors like budget, season, and activities you enjoy."
        elif 'destination' in prompt_lower:
            return " recommendations depend on your interests. Popular options include cultural cities, beach resorts, and mountain retreats."
        else:
            return " - I'm an ONNX-powered travel assistant ready to help with your questions."

    def count_tokens(self, messages):
        """Simple token counting (placeholder implementation)."""
        total = 0
        for message in messages:
            content = message.get('content', '')
            total += len(content.split())
        return max(total, 1)  # Ensure at least 1 token

    def send_openai_error(self, status_code, error_type, message):
        """Send OpenAI-compatible error response."""
        self.send_response(status_code)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        error_response = {
            "error": {
                "message": message,
                "type": error_type,
                "param": None,
                "code": None
            }
        }
        
        self.wfile.write(json.dumps(error_response).encode())

    def handle_root(self):
        """Root endpoint with usage information."""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        usage_info = {
            "service": "OpenAI-Compatible ONNX Inference Server",
            "description": "This server provides OpenAI-compatible API endpoints for ONNX model inference",
            "endpoints": {
                "/": "This usage information",
                "/health": "Health check",
                "/info": "Model information",
                "/predict": "POST endpoint for raw ONNX model inference",
                "/v1/models": "GET endpoint listing available models (OpenAI compatible)",
                "/v1/chat/completions": "POST endpoint for chat completions (OpenAI compatible)", 
                "/v1/completions": "POST endpoint for text completions (OpenAI compatible)"
            },
            "model_loaded": self.session is not None,
            "openai_compatible": True
        }
        
        self.wfile.write(json.dumps(usage_info, indent=2).encode())
    
    def handle_predict(self):
        """Handle prediction requests."""
        try:
            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            if not self.session:
                # Demo mode - return a mock response
                response = {
                    "status": "success",
                    "prediction": [0.5, 0.3, 0.2],  # Mock probabilities
                    "message": "Demo mode: No real model loaded",
                    "input_received": request_data
                }
            else:
                # Real inference
                inputs = request_data.get('inputs', {})
                
                # Convert inputs to numpy arrays
                onnx_inputs = {}
                for input_name, input_data in inputs.items():
                    onnx_inputs[input_name] = np.array(input_data, dtype=np.float32)
                
                # Run inference
                outputs = self.session.run(None, onnx_inputs)
                
                # Convert outputs to Python lists for JSON serialization
                output_names = [output.name for output in self.session.get_outputs()]
                result = {}
                for i, output in enumerate(outputs):
                    output_name = output_names[i] if i < len(output_names) else f"output_{i}"
                    result[output_name] = output.tolist()
                
                response = {
                    "status": "success",
                    "prediction": result
                }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            error_response = {
                "status": "error",
                "message": str(e)
            }
            self.wfile.write(json.dumps(error_response).encode())
    
    def log_message(self, format, *args):
        """Override to use our logger."""
        logger.info(f"{self.address_string()} - {format % args}")


def run_server(port=5000):
    """Run the HTTP server."""
    server_address = ('', port)
    httpd = HTTPServer(server_address, OpenAICompatibleHandler)
    
    logger.info(f"Starting OpenAI-compatible ONNX inference server on port {port}")
    logger.info("Available endpoints:")
    logger.info("  GET  /                    - Usage information")
    logger.info("  GET  /health              - Health check")
    logger.info("  GET  /info                - Model information")
    logger.info("  POST /predict             - Raw ONNX model inference")
    logger.info("  GET  /v1/models          - List models (OpenAI compatible)")
    logger.info("  POST /v1/chat/completions - Chat completions (OpenAI compatible)")
    logger.info("  POST /v1/completions     - Text completions (OpenAI compatible)")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("Server stopping...")
        httpd.server_close()


if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    run_server(port)