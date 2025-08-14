// components/RoleManagement.jsx
// Role management interface for super admins only

import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { getRoleDisplayName } from '../hooks/useUser.jsx';
import { PermissionGuard } from './Permission';

function RoleManagement({ token }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showUserRoleModal, setShowUserRoleModal] = useState(false);
  const [showRolePermissionModal, setShowRolePermissionModal] = useState(false);

  const { get, post, put, del, error, setError } = useApi(token);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, rolesData, permissionsData] = await Promise.all([
        get('/users'),
        get('/roles'),
        get('/permissions')
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async (userId, roleName) => {
    try {
      await post(`/rbac/users/${userId}/roles`, { role: roleName });
      setSuccess(`Role ${roleName} assigned successfully!`);
      fetchData(); // Refresh data
      setShowUserRoleModal(false);
    } catch (err) {
      console.error('Error assigning role:', err);
    }
  };

  const handleRemoveRole = async (userId, roleName) => {
    if (!window.confirm(`Are you sure you want to remove the ${roleName} role from this user?`)) return;
    
    try {
      await del(`/rbac/users/${userId}/roles/${roleName}`);
      setSuccess(`Role ${roleName} removed successfully!`);
      fetchData(); // Refresh data
    } catch (err) {
      console.error('Error removing role:', err);
    }
  };

  const handleUpdateRolePermissions = async (roleId, permissionIds) => {
    console.log('handleUpdateRolePermissions called with:', roleId, permissionIds);
    
    // Find the role name from the role ID
    const roleToUpdate = roles.find(r => r.id === roleId);
    if (!roleToUpdate) {
      console.error('Role not found for ID:', roleId);
      return;
    }
    
    try {
      const response = await put(`/roles/${roleToUpdate.name}/permissions`, { permissions: permissionIds });
      console.log('Update response:', response);
      setSuccess('Role permissions updated successfully!');
      fetchData(); // Refresh data
      setShowRolePermissionModal(false);
    } catch (err) {
      console.error('Error updating role permissions:', err);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 shadow-sm border border-gray-300">
        <div className="flex items-center justify-center py-8">
          <div className="spinner"></div>
          <span className="ml-2 text-gray-600">Loading role management...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 shadow-sm border border-gray-300">
      <h3 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-800 pb-2 mb-6">
        Role Management
      </h3>

      {error && <div className="alert-error mb-4">{error}</div>}
      {success && <div className="alert-success mb-4">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Role Assignments */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">User Role Assignments</h4>
          <div className="space-y-4">
            {users.map(user => (
              <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium text-gray-900">{user.username}</h5>
                    <p className="text-sm text-gray-600">{user.user_type} • {user.company_name || 'No Company'}</p>
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">Current Roles:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map(role => (
                            <span key={role} className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              {getRoleDisplayName(role, roles)}
                              <button
                                onClick={() => handleRemoveRole(user.id, role)}
                                className="ml-1 text-blue-600 hover:text-red-600"
                                title="Remove role"
                              >
                                ×
                              </button>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">No roles assigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setShowUserRoleModal(true);
                    }}
                    className="btn-primary text-sm px-3 py-1"
                  >
                    Assign Role
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Role Permission Management */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Role Permission Management</h4>
          <div className="space-y-4">
            {roles.map(role => (
              <div key={role.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{getRoleDisplayName(role.name, roles)}</h5>
                    <p className="text-sm text-gray-600">{role.description || 'No description'}</p>
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">Users with this role:</span>
                      <p className="text-sm text-gray-700">
                        {users.filter(user => user.roles && user.roles.includes(role.name)).length} users
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedRole(role);
                      setShowRolePermissionModal(true);
                    }}
                    className="btn-secondary text-sm px-3 py-1"
                  >
                    Manage Permissions
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Role Assignment Modal */}
      {showUserRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Assign Role to {selectedUser.username}</h3>
            <div className="space-y-3">
              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => handleAssignRole(selectedUser.id, role.name)}
                  disabled={selectedUser.roles && selectedUser.roles.includes(role.name)}
                  className={`w-full text-left p-3 rounded border ${
                    selectedUser.roles && selectedUser.roles.includes(role.name)
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="font-medium">{getRoleDisplayName(role.name, roles)}</div>
                  <div className="text-sm text-gray-600">{role.description || 'No description'}</div>
                  {selectedUser.roles && selectedUser.roles.includes(role.name) && (
                    <div className="text-xs text-green-600 mt-1">Already assigned</div>
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowUserRoleModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Permission Management Modal */}
      {showRolePermissionModal && selectedRole && (
        <RolePermissionModal
          role={selectedRole}
          permissions={permissions}
          onClose={() => setShowRolePermissionModal(false)}
          onSave={handleUpdateRolePermissions}
          token={token}
        />
      )}
    </div>
  );
}

// Role Permission Management Modal Component
function RolePermissionModal({ role, permissions, onClose, onSave, token }) {
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { get } = useApi(token);

  useEffect(() => {
    fetchRolePermissions();
  }, [role.id]);

  const fetchRolePermissions = async () => {
    try {
      console.log(`Fetching permissions for role ${role.id}:`, role.name);
      const rolePermissions = await get(`/roles/${role.name}/permissions`);
      console.log('Fetched role permissions:', rolePermissions);
      
      // Backend now returns permissions with 'permission' field (same as all permissions)
      const permissionNames = rolePermissions.map(p => p.permission);
      console.log('Permission names:', permissionNames);
      
      setSelectedPermissions(permissionNames);
    } catch (err) {
      console.error('Error fetching role permissions:', err);
      setSelectedPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permissionName) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionName)
        ? prev.filter(p => p !== permissionName)
        : [...prev, permissionName]
    );
  };

  const handleSave = () => {
    console.log('Saving permissions for role:', role.id, 'permissions:', selectedPermissions);
    onSave(role.id, selectedPermissions);
  };

  const groupedPermissions = permissions.reduce((acc, permission) => {
    const category = permission.permission.split('_')[0]; // group by first word
    if (!acc[category]) acc[category] = [];
    acc[category].push(permission);
    return acc;
  }, {});

  console.log('All permissions structure:', permissions.slice(0, 2));
  console.log('Selected permissions:', selectedPermissions);
  console.log('Example permission check:', permissions[0]?.permission, 'in selectedPermissions?', selectedPermissions.includes(permissions[0]?.permission));
  console.log('Full selectedPermissions array:', JSON.stringify(selectedPermissions));
  console.log('Full permissions array (first 2):', JSON.stringify(permissions.slice(0, 2)));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          Manage Permissions for {getRoleDisplayName(role.name, [role])}
        </h3>
        
        {loading ? (
          <div className="text-center py-4">Loading permissions...</div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
              <div key={category} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 capitalize">{category} Management</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categoryPermissions.map(permission => (
                    <label key={permission.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission.permission)}
                        onChange={() => handlePermissionToggle(permission.permission)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {permission.description || permission.permission}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary flex-1" disabled={loading}>
            Save Permissions
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoleManagement;
