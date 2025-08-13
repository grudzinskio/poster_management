// Simplified permissions hook using centralized definitions

import { useState, useEffect, useContext, createContext } from 'react';

// Import centralized permissions (you'll need to create a frontend version or share this)
const PERMISSIONS = {
  // User management
  USER_READ: 'view_users',
  USER_CREATE: 'create_user', 
  USER_EDIT: 'edit_user',
  USER_DELETE: 'delete_user',
  
  // Company management
  COMPANY_READ: 'view_companies',
  COMPANY_CREATE: 'create_company',
  COMPANY_EDIT: 'edit_company', 
  COMPANY_DELETE: 'delete_company',
  
  // Campaign management
  CAMPAIGN_READ: 'view_campaigns',
  CAMPAIGN_CREATE: 'create_campaign',
  CAMPAIGN_EDIT: 'edit_campaign',
  CAMPAIGN_DELETE: 'delete_campaign',
  CAMPAIGN_ASSIGN: 'assign_campaign',
  
  // Role & System management
  ROLE_MANAGE: 'manage_roles',
  ROLE_READ: 'view_roles',
  SYSTEM_ADMIN: 'system_admin',
  REPORTS_VIEW: 'view_reports',
  PERMISSIONS_MANAGE: 'manage_permissions',
  
  // Advanced admin controls
  DATABASE_BACKUP: 'database_backup',
  SYSTEM_SETTINGS: 'system_settings',
  AUDIT_LOGS: 'audit_logs',
  EMERGENCY_ACCESS: 'emergency_access'
};

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

// Create permissions context
const SimplePermissionsContext = createContext();

// Provider component - much simpler now
export function SimplePermissionsProvider({ children, token }) {
  const [userPermissions, setUserPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      fetchPermissions();
    }
  }, [token]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/users/me/permissions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }

      const permissions = await response.json();
      setUserPermissions(Array.isArray(permissions) ? permissions : []);
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError(err.message);
      setUserPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  // Simplified permission checking functions
  const hasPermission = (permission) => userPermissions.includes(permission);
  const hasAnyPermission = (permissions) => permissions.some(p => userPermissions.includes(p));
  const hasAllPermissions = (permissions) => permissions.every(p => userPermissions.includes(p));

  const value = {
    userPermissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refetch: fetchPermissions,
    permissions: PERMISSIONS // Export the constants for easy access
  };

  return (
    <SimplePermissionsContext.Provider value={value}>
      {children}
    </SimplePermissionsContext.Provider>
  );
}

// Hook to use permissions context
export function useSimplePermissions() {
  const context = useContext(SimplePermissionsContext);
  if (!context) {
    throw new Error('useSimplePermissions must be used within a SimplePermissionsProvider');
  }
  return context;
}

// Export permissions constants for components to use
export { PERMISSIONS };
