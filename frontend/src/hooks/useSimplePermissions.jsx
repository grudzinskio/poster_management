// hooks/useSimplePermissions.js
// Simple permission management hook using array storage

import { useState, useEffect, useContext, createContext } from 'react';

// Create permissions context
const SimplePermissionsContext = createContext();

// All possible permissions in the system
const ALL_PERMISSIONS = [
  // User management
  'view_users',
  'create_user',
  'edit_user',
  'delete_user',
  
  // Company management
  'view_companies',
  'create_company',
  'edit_company',
  'delete_company',
  
  // Campaign management
  'view_campaigns',
  'create_campaign',
  'edit_campaign',
  'delete_campaign',
  'assign_campaign',
  
  // Role management
  'manage_roles',
  'view_roles',
  
  // Other permissions
  'view_reports',
  'system_admin'
];

// Provider component
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
    return ALL_PERMISSIONS.filter(permission => !userPermissions.includes(permission));
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
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getMissingPermissions,
    getPermissionsByCategory,
    getMissingPermissionsByCategory,
    refetch: fetchPermissions,
    allPermissions: ALL_PERMISSIONS
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
    
    // Role management
    'manage_roles': 'Manage Roles',
    'view_roles': 'View Roles',
    
    // Other permissions
    'view_reports': 'View Reports',
    'system_admin': 'System Administration'
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
