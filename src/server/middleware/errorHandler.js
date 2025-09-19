/**
 * Global error handling middleware
 */
const errorHandler = (error, req, res, next) => {
  // Log error details
  console.error("API Error:", {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString(),
  });

  // Default error response
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal Server Error";
  let details = null;

  // Handle specific error types
  if (error.name === "ValidationError") {
    statusCode = 400;
    message = "Request validation failed";
    details = error.details;
  } else if (error.name === "SyntaxError" && error.message.includes("JSON")) {
    statusCode = 400;
    message = "Invalid JSON in request body";
  } else if (error.code === "LIMIT_FILE_SIZE") {
    statusCode = 413;
    message = "File size too large";
  } else if (error.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  }

  // Prepare error response
  const errorResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  };

  // Add details in development mode
  if (process.env.NODE_ENV === "development") {
    errorResponse.details = details || error.stack;
  }

  // Add error ID for tracking
  if (statusCode >= 500) {
    errorResponse.error_id = generateErrorId();
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Generate unique error ID for tracking
 */
function generateErrorId() {
  return `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Async error wrapper for route handlers
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler,
};
