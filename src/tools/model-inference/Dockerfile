# Use Python slim image for better ONNX support
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for ONNX Runtime
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies with trusted hosts
COPY requirements.txt .
RUN pip install --no-cache-dir --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org -r requirements.txt

# Copy scripts
COPY inference.py .
COPY create_model.py .

# Create a simple ONNX model for demonstration
RUN python create_model.py

# Create a non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# Expose the port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import socket; sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM); sock.settimeout(5); result = sock.connect_ex(('localhost', 5000)); sock.close(); exit(result)" || exit 1

# Run the inference server
CMD ["python", "inference.py"]