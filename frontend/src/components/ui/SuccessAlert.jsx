// frontend/src/components/ui/SuccessAlert.jsx
// Reusable success alert component

import React from 'react';

/**
 * Success alert component
 * @param {Object} props
 * @param {string} props.message - Success message to display
 * @param {Function} props.onClose - Optional close handler
 * @param {string} props.className - Additional CSS classes
 */
function SuccessAlert({ message, onClose, className = '' }) {
  if (!message) return null;

  return (
    <div className={`alert-success ${className}`}>
      <div className="flex items-center justify-between">
        <span>{message}</span>
        {onClose && (
          <button 
            onClick={onClose}
            className="ml-2 text-green-800 hover:text-green-900 font-bold"
            aria-label="Close success message"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

export default SuccessAlert;
