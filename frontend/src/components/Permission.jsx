// components/Permission.jsx
// Unified permission component - DRY implementation that handles all permission scenarios
// Emphasizes the User.user.can() method and permissions array for visual display

import React from 'react';
import { useUserPermissions } from '../hooks/useUser.jsx';

/**
 * Universal Permission component that handles all permission scenarios
 * Replaces PermissionButton, PermissionCheck, PermissionGuard, and ProtectedButton
 * 
 * @param {Object} props
 * @param {string|string[]} props.permission - Single permission or array of permissions required
 * @param {boolean} props.requireAll - If true, user must have ALL permissions (default: false - requires ANY)
 * @param {React.ReactNode} props.children - Content to render when permission check passes
 * @param {React.ReactNode} props.fallback - Content to render when permission check fails
 * @param {'button'|'guard'|'check'} props.as - How to render the component
 * @param {boolean} props.showWhenFailed - If true, shows disabled/fallback content when permission fails
 * @param {string} props.disabledText - Tooltip text when disabled due to permissions
 * @param {Function} props.onClick - Click handler for button mode
 * @param {string} props.className - CSS classes
 * @param {boolean} props.disabled - Additional disabled state
 * @param {string} props.variant - Button style variant ('primary', 'secondary', 'danger', 'success')
 * @param {string} props.size - Button size ('sm', 'md', 'lg')
 */
function Permission({ 
  permission, 
  requireAll = false, 
  children, 
  fallback = null,
  as = 'check',
  showWhenFailed = false,
  disabledText = 'Insufficient permissions',
  onClick,
  className = '',
  disabled = false,
  variant = 'primary',
  size = 'md',
  ...props 
}) {
  const { loading, can, canAny, canAll } = useUserPermissions();

  // Don't render anything while loading
  if (loading) {
    if (as === 'button') {
      return (
        <button
          {...props}
          disabled={true}
          className={`${getButtonClasses(variant, size, className)} opacity-50 cursor-not-allowed`}
        >
          <div className="flex items-center">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2"></div>
            Loading...
          </div>
        </button>
      );
    }
    return null;
  }

  // Determine if user has access using User.user.can() method
  let hasAccess = false;

  if (Array.isArray(permission)) {
    // Multiple permissions - use permissions array for visual logic
    hasAccess = requireAll ? canAll(permission) : canAny(permission);
  } else {
    // Single permission - use User.user.can() method
    hasAccess = can(permission);
  }

  // Handle different rendering modes
  switch (as) {
    case 'button':
      return renderButton(hasAccess, {
        children,
        onClick,
        className,
        disabled,
        variant,
        size,
        disabledText,
        showWhenFailed,
        props
      });

    case 'guard':
    case 'check':
    default:
      return renderGuard(hasAccess, {
        children,
        fallback,
        showWhenFailed
      });
  }
}

/**
 * Render button mode with permission checking
 */
function renderButton(hasAccess, options) {
  const { 
    children, 
    onClick, 
    className, 
    disabled, 
    variant, 
    size, 
    disabledText, 
    showWhenFailed, 
    props 
  } = options;

  // If no access and not showing when failed, hide the button
  if (!hasAccess && !showWhenFailed) {
    return null;
  }

  const buttonClasses = getButtonClasses(variant, size, className);
  const isDisabled = disabled || !hasAccess;

  return (
    <button
      {...props}
      className={buttonClasses}
      onClick={hasAccess ? onClick : undefined}
      disabled={isDisabled}
      title={!hasAccess ? disabledText : undefined}
    >
      {children}
    </button>
  );
}

/**
 * Render guard/check mode with permission checking
 */
function renderGuard(hasAccess, options) {
  const { children, fallback, showWhenFailed } = options;

  if (hasAccess) {
    return <>{children}</>;
  }

  // User doesn't have permission
  if (showWhenFailed && fallback) {
    return <>{fallback}</>;
  }

  return null;
}

/**
 * Generate button CSS classes based on variant and size
 */
function getButtonClasses(variant, size, additionalClasses = '') {
  const baseClasses = 'inline-flex items-center justify-center border font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'border-gray-900 text-white bg-gray-900 hover:bg-black focus:ring-gray-600',
    secondary: 'border-gray-400 text-gray-800 bg-white hover:bg-gray-100 hover:border-gray-500 focus:ring-gray-500',
    danger: 'border-gray-800 text-white bg-gray-800 hover:bg-gray-900 focus:ring-gray-600',
    success: 'border-gray-700 text-white bg-gray-700 hover:bg-gray-800 focus:ring-gray-500'
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${additionalClasses}`;
}

// Convenience components for common scenarios
export function PermissionButton(props) {
  return <Permission as="button" {...props} />;
}

export function PermissionGuard(props) {
  return <Permission as="guard" {...props} />;
}

export function PermissionCheck(props) {
  return <Permission as="check" {...props} />;
}

// Pre-configured permission buttons for common operations
export function EditButton({ permission = 'edit_user', children = 'Edit', variant = 'primary', size = 'sm', ...props }) {
  return (
    <PermissionButton
      permission={permission}
      variant={variant}
      size={size}
      disabledText={`Cannot ${children.toLowerCase()}`}
      {...props}
    >
      {children}
    </PermissionButton>
  );
}

export function DeleteButton({ permission = 'delete_user', children = 'Delete', variant = 'danger', size = 'sm', ...props }) {
  return (
    <PermissionButton
      permission={permission}
      variant={variant}
      size={size}
      disabledText={`Cannot ${children.toLowerCase()}`}
      {...props}
    >
      {children}
    </PermissionButton>
  );
}

export function CreateButton({ permission = 'create_user', children = 'Create', variant = 'success', size = 'md', ...props }) {
  return (
    <PermissionButton
      permission={permission}
      variant={variant}
      size={size}
      disabledText={`Cannot ${children.toLowerCase()}`}
      {...props}
    >
      {children}
    </PermissionButton>
  );
}

export function ViewButton({ permission = 'view_user', children = 'View', variant = 'secondary', size = 'sm', ...props }) {
  return (
    <PermissionButton
      permission={permission}
      variant={variant}
      size={size}
      disabledText={`Cannot ${children.toLowerCase()}`}
      {...props}
    >
      {children}
    </PermissionButton>
  );
}

// Specific buttons for different entities
export function UserEditButton(props) {
  return <EditButton permission="edit_user" {...props} />;
}

export function UserDeleteButton(props) {
  return <DeleteButton permission="delete_user" {...props} />;
}

export function UserCreateButton(props) {
  return <CreateButton permission="create_user" children="Add User" {...props} />;
}

export function CompanyEditButton(props) {
  return <EditButton permission="edit_company" {...props} />;
}

export function CompanyDeleteButton(props) {
  return <DeleteButton permission="delete_company" {...props} />;
}

export function CompanyCreateButton(props) {
  return <CreateButton permission="create_company" children="Add Company" {...props} />;
}

export function CampaignEditButton(props) {
  return <EditButton permission="edit_campaign" {...props} />;
}

export function CampaignDeleteButton(props) {
  return <DeleteButton permission="delete_campaign" {...props} />;
}

export function CampaignCreateButton(props) {
  return <CreateButton permission="create_campaign" children="Add Campaign" {...props} />;
}

export default Permission;
