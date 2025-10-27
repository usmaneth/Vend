import { logger } from '../logger.js';

/**
 * Global error handling middleware
 * Catches and formats errors for API responses
 */
export function errorHandler(err, req, res, next) {
  // Log the error with details
  logger.error({
    err,
    req: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      query: req.query,
    }
  }, 'Request error');

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Send error response
  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal server error',
      status: statusCode,
      ...(config.nodeEnv === 'development' && { stack: err.stack }),
    }
  });
}

/**
 * 404 handler for undefined routes
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404,
      path: req.url,
    }
  });
}
