// hooks/usePermissions.js
// Custom hook for managing user permissions

import { useState, useEffect, useContext, createContext } from 'react';
import { useApi } from './useApi';

// Create permissions context
const PermissionsContext = createContext();

// Provider component
export function PermissionsProvider({ children, token }) {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permissionMap, setPermissionMap] = useState(new Map());
  const { get, error } = useApi(token);

  useEffect(() => {
    if (token) {
      fetchPermissions();
    }
  }, [token]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const userPermissions = await get('/users/me/permissions');
      setPermissions(userPermissions);
      
      // Create a map for quick permission lookup
      const permMap = new Map();
      userPermissions.forEach(perm => {
        permMap.set(perm.function_name, perm);
      });
      setPermissionMap(permMap);
    } catch (err) {
      console.error('Error fetching permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check if user has a specific permission function
  const hasPermission = (functionName) => {
    return permissionMap.has(functionName);
  };

  // Check if user has any permission for a resource action (e.g., 'users.create')
  const hasResourcePermission = (resource, action) => {
    return permissions.some(perm => 
      perm.resource === resource && perm.action === action
    );
  };

  // Get all permissions for a specific module
  const getModulePermissions = (module) => {
    return permissions.filter(perm => perm.module === module);
  };

  // Get all restricted functions (functions user cannot perform)
  const getRestrictedFunctions = () => {
    const allFunctions = [
      // User management
      'view_user_list', 'view_user_details', 'create_user_form', 'save_new_user',
      'edit_user_form', 'update_user_data', 'delete_user_confirm', 'remove_user_record',
      'change_user_password',
      
      // Company management
      'view_company_list', 'view_company_details', 'create_company_form', 'save_new_company',
      'edit_company_form', 'update_company_data', 'delete_company_confirm', 'remove_company_record',
      
      // Campaign management
      'view_campaign_list', 'view_campaign_details', 'create_campaign_form', 'save_new_campaign',
      'edit_campaign_form', 'update_campaign_data', 'delete_campaign_confirm', 'remove_campaign_record',
      'assign_contractor_to_campaign',
      
      // Campaign images
      'view_campaign_images', 'upload_campaign_image', 'review_campaign_image', 'delete_campaign_image',
      
      // Role management
      'view_role_list', 'view_role_details', 'create_role_form', 'save_new_role',
      'edit_role_form', 'update_role_data', 'delete_role_confirm', 'remove_role_record'
    ];

    return allFunctions.filter(func => !hasPermission(func));
  };

  const value = {
    permissions,
    loading,
    error,
    hasPermission,
    hasResourcePermission,
    getModulePermissions,
    getRestrictedFunctions,
    refetch: fetchPermissions
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

// Hook to use permissions context
export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}
