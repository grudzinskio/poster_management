// components/PermissionButton.jsx
// Permission-based button component that shows/hides/disables based on cached permissions

import React from 'react';
import { useSimplePermissions } from '../hooks/useSimplePermissions.jsx';

/**
 * PermissionButton - Renders a button only if user has required permissions
 * Uses cached permissions array - no database calls
 * 
 * @param {Object} props
 * @param {string|string[]} props.permission - Single permission or array of permissions required
 * @param {boolean} props.requireAll - If true, user must have ALL permissions (default: false - requires ANY)
 * @param {React.ReactNode} props.children - Button content
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - CSS classes for the button
 * @param {boolean} props.disabled - Additional disabled state
 * @param {string} props.variant - Button style variant ('primary', 'secondary', 'danger')
 * @param {string} props.size - Button size ('sm', 'md', 'lg')
 * @param {boolean} props.showDisabled - If true, show button as disabled instead of hiding (default: false)
 * @param {string} props.disabledText - Tooltip text when disabled due to permissions
 */
function PermissionButton({ 
  permission, 
  requireAll = false, 
  children, 
  onClick,
  className = '',
  disabled = false,
  variant = 'primary',
  size = 'md',
  showDisabled = false,
  disabledText = 'Insufficient permissions',
  ...props 
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = useSimplePermissions();

  // Don't render anything while loading
  if (loading) {
    return null;
  }

  let hasAccess = false;

  if (Array.isArray(permission)) {
    // Multiple permissions
    hasAccess = requireAll 
      ? hasAllPermissions(permission)
      : hasAnyPermission(permission);
  } else {
    // Single permission
    hasAccess = hasPermission(permission);
  }

  // If no access and not showing disabled, hide the button
  if (!hasAccess && !showDisabled) {
    return null;
  }

  // Build CSS classes based on variant and size
  const baseClasses = 'inline-flex items-center justify-center border font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500',
    danger: 'border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500'
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs rounded',
    md: 'px-4 py-2 text-sm rounded-md',
    lg: 'px-6 py-3 text-base rounded-lg'
  };

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      {...props}
      className={buttonClasses}
      onClick={hasAccess ? onClick : undefined}
      disabled={disabled || !hasAccess}
      title={!hasAccess ? disabledText : undefined}
    >
      {children}
    </button>
  );
}

export default PermissionButton;
