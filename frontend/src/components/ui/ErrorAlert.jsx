// frontend/src/components/ui/ErrorAlert.jsx
// Reusable error alert component

import React from 'react';

/**
 * Error alert component
 * @param {Object} props
 * @param {string} props.error - Error message to display
 * @param {Function} props.onClose - Optional close handler
 * @param {string} props.className - Additional CSS classes
 */
function ErrorAlert({ error, onClose, className = '' }) {
  if (!error) return null;

  return (
    <div className={`alert-error ${className}`}>
      <div className="flex items-center justify-between">
        <span>{error}</span>
        {onClose && (
          <button 
            onClick={onClose}
            className="ml-2 text-red-800 hover:text-red-900 font-bold"
            aria-label="Close error"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorAlert;
