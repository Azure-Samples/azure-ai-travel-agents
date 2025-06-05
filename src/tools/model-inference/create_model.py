#!/usr/bin/env python3
"""
Script to create a simple ONNX model for testing purposes.
Creates a basic linear regression model that can be used for demonstration.
"""

import numpy as np

def create_simple_onnx_model():
    """Create a simple ONNX model for testing."""
    try:
        import onnx
        from onnx import helper, TensorProto
        from onnx.helper import make_model, make_node, make_graph, make_tensor_value_info
        
        # Create a simple linear model: y = x * 2 + 1
        # Input: [batch_size, 3] float32
        # Output: [batch_size, 1] float32
        
        # Define input and output
        input_tensor = make_tensor_value_info('input', TensorProto.FLOAT, [None, 3])
        output_tensor = make_tensor_value_info('output', TensorProto.FLOAT, [None, 1])
        
        # Create weight and bias tensors
        weight_tensor = helper.make_tensor(
            name='weight',
            data_type=TensorProto.FLOAT,
            dims=[3, 1],
            vals=[2.0, 1.5, 0.5]  # Simple weights
        )
        
        bias_tensor = helper.make_tensor(
            name='bias',
            data_type=TensorProto.FLOAT,
            dims=[1],
            vals=[1.0]  # Simple bias
        )
        
        # Create nodes
        matmul_node = make_node('MatMul', ['input', 'weight'], ['matmul_output'])
        add_node = make_node('Add', ['matmul_output', 'bias'], ['output'])
        
        # Create graph
        graph = make_graph(
            [matmul_node, add_node],
            'simple_linear_model',
            [input_tensor],
            [output_tensor],
            [weight_tensor, bias_tensor]
        )
        
        # Create model
        model = make_model(graph)
        model.opset_import[0].version = 11
        
        # Save model
        onnx.save(model, 'model.onnx')
        print("Simple ONNX model created successfully: model.onnx")
        
        # Validate model
        onnx.checker.check_model(model)
        print("Model validation passed")
        
        return True
        
    except ImportError:
        print("Warning: ONNX not available for model creation. Model will be created at runtime if needed.")
        return False
    except Exception as e:
        print(f"Error creating ONNX model: {e}")
        return False

if __name__ == "__main__":
    create_simple_onnx_model()