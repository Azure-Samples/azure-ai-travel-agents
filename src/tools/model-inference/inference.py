#!/usr/bin/env python3
"""
Simple ONNX inference server for Azure Container Apps.
This service provides HTTP endpoints for model inference using ONNX Runtime.
"""

import json
import os
import logging
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


class ONNXInferenceHandler(BaseHTTPRequestHandler):
    """HTTP request handler for ONNX model inference."""
    
    def __init__(self, *args, **kwargs):
        # Initialize ONNX session
        self.session = None
        self.model_path = "/app/model.onnx"
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
        else:
            self.handle_root()
    
    def do_POST(self):
        """Handle POST requests."""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == "/predict":
            self.handle_predict()
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
    
    def handle_root(self):
        """Root endpoint with usage information."""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        usage_info = {
            "service": "ONNX Inference Server",
            "endpoints": {
                "/": "This usage information",
                "/health": "Health check",
                "/info": "Model information",
                "/predict": "POST endpoint for model inference"
            },
            "model_loaded": self.session is not None
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
    httpd = HTTPServer(server_address, ONNXInferenceHandler)
    
    logger.info(f"Starting ONNX inference server on port {port}")
    logger.info("Available endpoints:")
    logger.info("  GET  /        - Usage information")
    logger.info("  GET  /health  - Health check")
    logger.info("  GET  /info    - Model information")
    logger.info("  POST /predict - Model inference")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("Server stopping...")
        httpd.server_close()


if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    run_server(port)