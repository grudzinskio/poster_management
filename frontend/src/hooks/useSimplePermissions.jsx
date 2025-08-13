// hooks/useSimplePermissions.js
// Database-driven permission management hook

import { useState, useEffect, useContext, createContext } from 'react';

// Create permissions context
const SimplePermissionsContext = createContext();

// Provider component
export function SimplePermissionsProvider({ children, token }) {
  const [userPermissions, setUserPermissions] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      fetchPermissions();
      fetchAllPermissions();
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

  const fetchAllPermissions = async () => {
    try {
      const response = await fetch('/api/permissions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const permissions = await response.json();
        setAllPermissions(Array.isArray(permissions) ? permissions.map(p => p.permission || p) : []);
      }
    } catch (err) {
      console.error('Error fetching all permissions:', err);
      // Fallback to user permissions if we can't fetch all permissions
      setAllPermissions([]);
    }
  };

  // Check if user has a specific permission
  const hasPermission = (permission) => {
    return userPermissions.includes(permission);
  };

  // Check if user has any of the provided permissions
  const hasAnyPermission = (permissions) => {
    return permissions.some(permission => userPermissions.includes(permission));
  };

  // Check if user has all of the provided permissions
  const hasAllPermissions = (permissions) => {
    return permissions.every(permission => userPermissions.includes(permission));
  };

  // Get permissions user doesn't have
  const getMissingPermissions = () => {
    return allPermissions.filter(permission => !userPermissions.includes(permission));
  };

  // Get user permissions grouped by category
  const getPermissionsByCategory = () => {
    const categories = {
      users: userPermissions.filter(p => p.includes('user')),
      companies: userPermissions.filter(p => p.includes('compan')),
      campaigns: userPermissions.filter(p => p.includes('campaign')),
      roles: userPermissions.filter(p => p.includes('role')),
      system: userPermissions.filter(p => p.includes('system') || p.includes('admin') || p.includes('report'))
    };
    
    return categories;
  };

  // Get missing permissions grouped by category
  const getMissingPermissionsByCategory = () => {
    const missing = getMissingPermissions();
    const categories = {
      users: missing.filter(p => p.includes('user')),
      companies: missing.filter(p => p.includes('compan')),
      campaigns: missing.filter(p => p.includes('campaign')),
      roles: missing.filter(p => p.includes('role')),
      system: missing.filter(p => p.includes('system') || p.includes('admin') || p.includes('report'))
    };
    
    return categories;
  };

  const value = {
    userPermissions,
    allPermissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getMissingPermissions,
    getPermissionsByCategory,
    getMissingPermissionsByCategory,
    refetch: fetchPermissions
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

// Helper function to get human-readable permission names
export function getPermissionDisplayName(permission) {
  const displayNames = {
    // User management
    'view_users': 'View Users',
    'create_user': 'Create Users',
    'edit_user': 'Edit Users',
    'delete_user': 'Delete Users',
    
    // Company management
    'view_companies': 'View Companies',
    'create_company': 'Create Companies',
    'edit_company': 'Edit Companies',
    'delete_company': 'Delete Companies',
    
    // Campaign management
    'view_campaigns': 'View Campaigns',
    'create_campaign': 'Create Campaigns',
    'edit_campaign': 'Edit Campaigns',
    'delete_campaign': 'Delete Campaigns',
    'assign_campaign': 'Assign Campaigns',
    
    // Role & System management
    'manage_roles': 'Manage Roles',
    'view_roles': 'View Roles',
    'manage_permissions': 'Manage Permissions',
    'system_admin': 'System Administration',
    'view_reports': 'View Reports',
    
    // Advanced admin controls
    'database_backup': 'Database Backup',
    'system_settings': 'System Settings',
    'audit_logs': 'Audit Logs',
    'emergency_access': 'Emergency Access'
  };
  
  return displayNames[permission] || permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Helper function to get category display names
export function getCategoryDisplayName(category) {
  const categoryNames = {
    users: 'User Management',
    companies: 'Company Management', 
    campaigns: 'Campaign Management',
    roles: 'Role Management',
    system: 'System & Reports'
  };
  
  return categoryNames[category] || category;
}
