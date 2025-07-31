// utils/responseHelper.js
// Standard response formatting utilities

/**
 * Send a successful response with data
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
function sendSuccess(res, data = null, message = 'Success', statusCode = 200) {
  const response = {
    success: true,
    message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  return res.status(statusCode).json(response);
}

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {*} details - Additional error details
 */
function sendError(res, message = 'Internal server error', statusCode = 500, details = null) {
  const response = {
    success: false,
    error: message
  };
  
  if (details !== null) {
    response.details = details;
  }
  
  return res.status(statusCode).json(response);
}

/**
 * Send a paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Response data array
 * @param {Object} pagination - Pagination info { page, limit, total, totalPages }
 * @param {string} message - Success message
 */
function sendPaginatedResponse(res, data, pagination, message = 'Success') {
  return res.json({
    success: true,
    message,
    data,
    pagination
  });
}

/**
 * Send a created resource response
 * @param {Object} res - Express response object
 * @param {*} data - Created resource data
 * @param {string} message - Success message
 */
function sendCreated(res, data, message = 'Resource created successfully') {
  return sendSuccess(res, data, message, 201);
}

/**
 * Send a no content response (for deletions)
 * @param {Object} res - Express response object
 */
function sendNoContent(res) {
  return res.status(204).send();
}

module.exports = {
  sendSuccess,
  sendError,
  sendPaginatedResponse,
  sendCreated,
  sendNoContent
};
