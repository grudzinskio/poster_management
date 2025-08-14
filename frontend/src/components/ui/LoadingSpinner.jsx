// frontend/src/components/ui/LoadingSpinner.jsx
// Reusable loading spinner component

import React from 'react';

/**
 * Loading spinner component
 * @param {Object} props
 * @param {string} props.message - Optional loading message
 * @param {string} props.size - Size of spinner: 'sm', 'md', 'lg'
 * @param {string} props.className - Additional CSS classes
 */
function LoadingSpinner({ 
  message = 'Loading...', 
  size = 'md',
  className = '' 
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <div 
        className={`animate-spin ${sizeClasses[size]} border-2 border-gray-300 border-t-blue-600 rounded-full`}
      ></div>
      {message && (
        <span className="ml-2 text-gray-600">{message}</span>
      )}
    </div>
  );
}

export default LoadingSpinner;
