// components/PermissionCheck.jsx
// Simple component for conditional rendering based on cached permissions

import { useSimplePermissions } from '../hooks/useSimplePermissions.jsx';

/**
 * PermissionCheck - Conditionally render content based on cached permissions
 * Uses cached permissions array - no database calls
 * 
 * @param {Object} props
 * @param {string|string[]} props.permission - Single permission or array of permissions required
 * @param {boolean} props.requireAll - If true, user must have ALL permissions (default: false - requires ANY)
 * @param {React.ReactNode} props.children - Content to render if user has permission
 * @param {React.ReactNode} props.fallback - Content to render if user lacks permission (optional)
 * @param {boolean} props.showFallback - Whether to show fallback content (default: false - render nothing)
 */
function PermissionCheck({ 
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

export default PermissionCheck;
