// components/ProtectedButton.jsx
// Higher-order component for permission-protected buttons

import React from 'react';
import { useSimplePermissions } from '../hooks/useSimplePermissions';

function ProtectedButton({ 
  children, 
  permission, 
  className = '', 
  disabled = false, 
  showTooltip = true,
  fallbackText = 'No Permission',
  ...props 
}) {
  const { hasPermission, loading } = useSimplePermissions();

  // If loading permissions, show disabled button
  if (loading) {
    return (
      <button 
        {...props}
        disabled={true}
        className={`${className} opacity-50 cursor-not-allowed`}
      >
        <div className="flex items-center">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2"></div>
          Loading...
        </div>
      </button>
    );
  }

  // Check if user has permission
  const hasAccess = hasPermission(permission);

  // If no access, show disabled button with tooltip
  if (!hasAccess) {
    if (!showTooltip) {
      return null; // Hide button completely
    }
    
    return (
      <div className="relative group">
        <button 
          {...props}
          disabled={true}
          className={`${className} opacity-50 cursor-not-allowed`}
        >
          {children}
        </button>
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
          {fallbackText}
        </div>
      </div>
    );
  }

  // User has permission, show normal button
  return (
    <button 
      {...props}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  );
}

// Convenience components for common button types
export function EditButton({ userId, ...props }) {
  return (
    <ProtectedButton
      permission="edit_user"
      fallbackText="Cannot edit users"
      className="btn-primary text-sm px-3 py-1.5"
      {...props}
    >
      Edit
    </ProtectedButton>
  );
}

export function DeleteButton({ userId, ...props }) {
  return (
    <ProtectedButton
      permission="delete_user"
      fallbackText="Cannot delete users"
      className="btn-danger text-sm px-3 py-1.5"
      {...props}
    >
      Delete
    </ProtectedButton>
  );
}

export function PasswordButton({ userId, ...props }) {
  return (
    <ProtectedButton
      permission="edit_user"
      fallbackText="Cannot change passwords"
      className="btn-secondary text-sm px-3 py-1.5"
      {...props}
    >
      Password
    </ProtectedButton>
  );
}

export function AddUserButton({ ...props }) {
  return (
    <ProtectedButton
      permission="create_user"
      fallbackText="Cannot create users"
      className="btn-success"
      {...props}
    >
      Add User
    </ProtectedButton>
  );
}

export function AddCompanyButton({ ...props }) {
  return (
    <ProtectedButton
      permission="create_company"
      fallbackText="Cannot create companies"
      className="btn-success"
      {...props}
    >
      Add Company
    </ProtectedButton>
  );
}

export function AddCampaignButton({ ...props }) {
  return (
    <ProtectedButton
      permission="create_campaign"
      fallbackText="Cannot create campaigns"
      className="btn-success"
      {...props}
    >
      Add Campaign
    </ProtectedButton>
  );
}

export default ProtectedButton;
