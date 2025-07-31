// utils/errorHandler.js
// Centralized error handling utilities

/**
 * Handle database errors and return appropriate HTTP responses
 * @param {Object} error - Database error object
 * @param {Object} res - Express response object
 * @param {string} operation - Description of the operation that failed
 */
function handleDatabaseError(error, res, operation = 'database operation') {
  console.error(`Error during ${operation}:`, error);
  
  // Handle specific MySQL errors
  switch (error.code) {
    case 'ER_DUP_ENTRY':
      return res.status(409).json({ error: 'Duplicate entry. This record already exists.' });
    
    case 'ER_ROW_IS_REFERENCED_2':
      return res.status(400).json({ 
        error: 'Cannot delete this record because it is referenced by other data.' 
      });
    
    case 'ER_NO_REFERENCED_ROW_2':
      return res.status(400).json({ 
        error: 'Referenced record does not exist.' 
      });
    
    case 'ER_BAD_NULL_ERROR':
      return res.status(400).json({ 
        error: 'Required field cannot be null.' 
      });
    
    default:
      return res.status(500).json({ 
        error: `Failed to perform ${operation}` 
      });
  }
}

/**
 * Handle validation errors
 * @param {Array} errors - Array of validation error messages
 * @param {Object} res - Express response object
 */
function handleValidationErrors(errors, res) {
  return res.status(400).json({ 
    error: 'Validation failed',
    details: errors 
  });
}

/**
 * Handle authentication/authorization errors
 * @param {string} message - Error message
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (default: 403)
 */
function handleAuthError(message, res, statusCode = 403) {
  return res.status(statusCode).json({ error: message });
}

module.exports = {
  handleDatabaseError,
  handleValidationErrors,
  handleAuthError
};
