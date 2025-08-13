// components/PermissionGuard.jsx
// Simple component to conditionally render content based on permissions

import React from 'react';
import { useSimplePermissions } from '../hooks/useSimplePermissions.jsx';

/**
 * PermissionGuard - Conditionally render children based on user permissions
 * 
 * @param {Object} props
 * @param {string|string[]} props.permission - Single permission or array of permissions required
 * @param {string} props.requireAll - If true, user must have ALL permissions (default: false - requires ANY)
 * @param {React.ReactNode} props.children - Content to render if user has permission
 * @param {React.ReactNode} props.fallback - Content to render if user lacks permission (optional)
 * @param {boolean} props.showFallback - Whether to show fallback content (default: false - render nothing)
 */
function PermissionGuard({ 
  permission, 
  requireAll = false, 
  children, 
  fallback = null, 
  showFallback = false 
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

  if (hasAccess) {
    return <>{children}</>;
  }

  // User doesn't have permission
  if (showFallback && fallback) {
    return <>{fallback}</>;
  }

  return null;
}

export default PermissionGuard;
