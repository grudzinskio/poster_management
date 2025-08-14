// hooks/useUser.jsx
// Centralized user management hook that mirrors backend User class structure
// Emphasizes permissions array for visual display while maintaining security

import { useState, useEffect, useContext, createContext } from 'react';

// Create user context
const UserContext = createContext();

/**
 * Frontend User class that mirrors backend User class structure
 * Emphasizes permissions array for visual display
 */
class FrontendUser {
  constructor(userData = {}, permissions = [], allPermissions = []) {
    this.id = userData.id;
    this.username = userData.username;
    this.user_type = userData.user_type;
    this.company_id = userData.company_id;
    this.company_name = userData.company_name;
    this.roles = userData.roles || [];
    
    // Store permissions as simple array for visual display
    this._permissions = Array.isArray(permissions) ? permissions : [];
    this._allPermissions = Array.isArray(allPermissions) ? allPermissions : [];
  }

  /**
   * Main permission check method - mirrors backend User.can()
   * @param {string} permission - Permission name to check
   * @returns {boolean} - True if user has permission
   */
  can(permission) {
    return this._permissions.includes(permission);
  }

  /**
   * Check if user has any of the provided permissions
   * @param {string[]} permissions - Array of permission names
   * @returns {boolean} - True if user has any permission
   */
  canAny(permissions) {
    return permissions.some(permission => this.can(permission));
  }

  /**
   * Check if user has all of the provided permissions
   * @param {string[]} permissions - Array of permission names
   * @returns {boolean} - True if user has all permissions
   */
  canAll(permissions) {
    return permissions.every(permission => this.can(permission));
  }

  /**
   * Get user's permissions array (for visual display)
   * @returns {string[]} - Array of permission names
   */
  getPermissions() {
    return [...this._permissions];
  }

  /**
   * Get all available permissions in the system
   * @returns {Object[]} - Array of permission objects with descriptions
   */
  getAllPermissions() {
    return [...this._allPermissions];
  }

  /**
   * Get permissions user doesn't have (for visual display)
   * @returns {string[]} - Array of missing permission names
   */
  getMissingPermissions() {
    const allPermissionNames = this._allPermissions.map(p => p.permission || p);
    return allPermissionNames.filter(permission => !this.can(permission));
  }

  /**
   * Get permissions grouped by category (for visual display)
   * @returns {Object} - Permissions grouped by category
   */
  getPermissionsByCategory() {
    const categories = {
      users: this._permissions.filter(p => p.includes('user')),
      companies: this._permissions.filter(p => p.includes('compan')),
      campaigns: this._permissions.filter(p => p.includes('campaign')),
      roles: this._permissions.filter(p => p.includes('role')),
      system: this._permissions.filter(p => p.includes('system') || p.includes('admin') || p.includes('report'))
    };
    
    return categories;
  }

  /**
   * Get display name for a permission
   * @param {string} permission - Permission name
   * @returns {string} - Human-readable permission name
   */
  getPermissionDisplayName(permission) {
    const permissionObj = this._allPermissions.find(p => p.permission === permission);
    
    if (permissionObj?.description) {
      return permissionObj.description;
    }
    
    // Fallback to formatted permission name
    return permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Check if user has a specific role
   * @param {string} roleName - Role name
   * @returns {boolean} - True if user has role
   */
  hasRole(roleName) {
    return this.roles.includes(roleName);
  }

  /**
   * Convert to plain object for JSON responses
   */
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      user_type: this.user_type,
      company_id: this.company_id,
      company_name: this.company_name,
      roles: this.roles,
      permissions: this._permissions
    };
  }
}

// Provider component
export function UserProvider({ children, token }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      fetchUserData();
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user permissions and all permissions in parallel
      const [permissionsResponse, allPermissionsResponse] = await Promise.all([
        fetch('/api/users/me/permissions', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/permissions', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (!permissionsResponse.ok) {
        throw new Error('Failed to fetch user permissions');
      }

      const permissions = await permissionsResponse.json();
      const allPermissions = allPermissionsResponse.ok ? await allPermissionsResponse.json() : [];

      // For now, we'll extract user data from token or create a placeholder
      // In a real app, you might want to fetch user details separately
      const userData = token ? JSON.parse(atob(token.split('.')[1])) : {};

      // Create FrontendUser instance
      const userInstance = new FrontendUser(userData, permissions, allPermissions);
      setUser(userInstance);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    refetch: fetchUserData
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

// Hook to use user context
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// Convenience hooks for common operations
export function useUserPermissions() {
  const { user, loading } = useUser();
  
  return {
    user,
    loading,
    can: (permission) => user?.can(permission) ?? false,
    canAny: (permissions) => user?.canAny(permissions) ?? false,
    canAll: (permissions) => user?.canAll(permissions) ?? false,
    hasRole: (role) => user?.hasRole(role) ?? false,
    getPermissions: () => user?.getPermissions() ?? [],
    getMissingPermissions: () => user?.getMissingPermissions() ?? [],
    getPermissionsByCategory: () => user?.getPermissionsByCategory() ?? {},
    getPermissionDisplayName: (permission) => user?.getPermissionDisplayName(permission) ?? permission
  };
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

// Helper function to get human-readable role names (moved from old system)
export function getRoleDisplayName(roleName, allRoles = []) {
  // Find the role in the database with description
  const roleObj = allRoles.find(r => r.name === roleName);
  
  if (!roleObj) {
    // Instead of throwing an error, return a fallback display name
    console.warn(`Role '${roleName}' not found in database. Using fallback display name.`);
    return roleName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  
  if (!roleObj.description) {
    // Instead of throwing an error, return the role name formatted nicely
    console.warn(`Role '${roleName}' has no description in database. Using formatted role name.`);
    return roleName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  
  return roleObj.description;
}
