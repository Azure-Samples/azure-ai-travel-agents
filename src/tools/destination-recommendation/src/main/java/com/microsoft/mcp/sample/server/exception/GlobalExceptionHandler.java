package com.microsoft.mcp.sample.server.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Global exception handler for the destination recommendation service.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handle IllegalArgumentException which occurs when invalid input is provided.
     * 
     * @param ex The exception that was thrown
     * @return A response with error details
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(IllegalArgumentException ex) {
        ErrorResponse error = new ErrorResponse(
            "Invalid_Input", 
            "Invalid input parameter: " + ex.getMessage(),
            "Please check your input values and try again.");
        
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle generic exceptions that are not specifically handled elsewhere.
     * 
     * @param ex The exception that was thrown
     * @return A response with error details
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        ErrorResponse error = new ErrorResponse(
            "Internal_Error", 
            "An unexpected error occurred: " + ex.getMessage(),
            "Please try again later or contact support if the issue persists.");
        
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /**
     * Simple error response class for consistent error reporting.
     */
    public static class ErrorResponse {
        private String code;
        private String message;
        private String resolution;

        public ErrorResponse(String code, String message, String resolution) {
            this.code = code;
            this.message = message;
            this.resolution = resolution;
        }

        public String getCode() {
            return code;
        }

        public String getMessage() {
            return message;
        }

        public String getResolution() {
            return resolution;
        }
    }
}
