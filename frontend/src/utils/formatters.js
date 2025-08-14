// frontend/src/utils/formatters.js
// Shared utility functions for formatting data

/**
 * Format a date string to a localized date
 * @param {string} dateString - Date string to format
 * @returns {string} Formatted date or 'Not set' if no date
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString();
};

/**
 * Get display text for campaign status
 * @param {string} status - Campaign status
 * @returns {string} Human-readable status text
 */
export const getStatusDisplay = (status) => {
  const statusMap = {
    'pending': 'Pending Review',
    'approved': 'Approved',
    'in_progress': 'In Progress',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  };
  return statusMap[status] || status;
};

/**
 * Get CSS class for status badge
 * @param {string} status - Campaign status
 * @returns {string} CSS class name
 */
export const getStatusClass = (status) => {
  return `status-badge status-${status}`;
};
