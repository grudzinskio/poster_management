// frontend/src/components/UserManagement.jsx

import React, { useState } from 'react';
import { useMultipleDataFetching } from '../hooks/useDataFetching';
import { useApi } from '../hooks/useApi';
import { useUserPermissions, getRoleDisplayName } from '../hooks/useUser.jsx';
import Permission, { 
  PermissionGuard, 
  UserEditButton, 
  UserDeleteButton, 
  UserCreateButton 
} from './Permission';
import LoadingSpinner from './ui/LoadingSpinner';
import ErrorAlert from './ui/ErrorAlert';
import SuccessAlert from './ui/SuccessAlert';

function UserManagement({ token }) {
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [changingPasswordId, setChangingPasswordId] = useState(null);
  const [passwordInputs, setPasswordInputs] = useState({});
  const [newUser, setNewUser] = useState({ 
    username: '', 
    password: '', 
    user_type: 'client',
    company_id: ''
  });

  const { post, put, del, error: apiError, setError: setApiError } = useApi(token);
  const { can } = useUserPermissions();

  // Fetch all required data in parallel
  const { 
    data: { users = [], companies = [], roles = [] }, 
    loading, 
    error: fetchError, 
    refetch 
  } = useMultipleDataFetching(['/users', '/companies', '/roles'], token);

  const error = apiError || fetchError;

  const handleNewUserChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
    if (error) setApiError('');
    if (success) setSuccess('');
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccess('');
    
    try {
      const userData = { ...newUser };
      if (userData.company_id === '') userData.company_id = null;
      
      await post('/users', userData);
      setNewUser({ 
        username: '', 
        password: '', 
        user_type: 'client',
        company_id: ''
      });
      setSuccess('User added successfully!');
      refetch(); // Use refetch instead of manual state update
    } catch {
      // Error is already set by useApi hook
    }
  };

  const handleEditUser = (user) => {
    setEditingId(user.id);
    setApiError('');
    setSuccess('');
  };

  const handleSaveEdit = async (userId, updatedData) => {
    setApiError('');
    setSuccess('');
    
    try {
      if (updatedData.company_id === '') updatedData.company_id = null;
      
      await put(`/users/${userId}`, updatedData);
      setEditingId(null);
      setSuccess('User updated successfully!');
      refetch(); // Use refetch instead of manual state update
    } catch {
      // Error is already set by useApi hook
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setApiError('');
    setSuccess('');
    
    try {
      await del(`/users/${userId}`);
      setSuccess('User deleted successfully!');
      refetch(); // Use refetch instead of manual state update
    } catch {
      // Error is already set by useApi hook
    }
  };

  const handleChangePassword = (userId) => {
    setChangingPasswordId(userId);
    setPasswordInputs(prev => ({ ...prev, [userId]: '' }));
    setApiError('');
    setSuccess('');
  };

  const handlePasswordInputChange = (userId, value) => {
    setPasswordInputs(prev => ({ ...prev, [userId]: value }));
  };

  const handleSavePassword = async (userId) => {
    const password = passwordInputs[userId] || '';
    if (!password || password.length < 6) {
      setApiError('Password must be at least 6 characters long');
      return;
    }
    
    setApiError('');
    setSuccess('');
    
    try {
      await put(`/users/${userId}/password`, { password });
      setChangingPasswordId(null);
      setPasswordInputs(prev => {
        const newInputs = { ...prev };
        delete newInputs[userId];
        return newInputs;
      });
      setSuccess('Password updated successfully!');
    } catch {
      // Error is already set by useApi hook
    }
  };

  const handleCancelPasswordChange = () => {
    const userId = changingPasswordId;
    setChangingPasswordId(null);
    setPasswordInputs(prev => {
      const newInputs = { ...prev };
      delete newInputs[userId];
      return newInputs;
    });
    setApiError('');
    setSuccess('');
  };

  const UserRow = ({ user }) => {
    const [editData, setEditData] = useState({
      username: user.username,
      user_type: user.user_type || 'client',
      company_id: user.company_id || ''
    });

    const handleEditChange = (e) => {
      setEditData({ ...editData, [e.target.name]: e.target.value });
    };

    if (editingId === user.id) {
      return (
        <tr key={user.id} className="bg-blue-50">
          <td className="table-cell">{user.id}</td>
          <td className="table-cell">
            <input
              type="text"
              name="username"
              value={editData.username}
              onChange={handleEditChange}
              required
              className="form-input"
            />
          </td>
          <td className="table-cell">
            <select name="user_type" value={editData.user_type} onChange={handleEditChange} className="form-input cursor-pointer">
              <option value="employee">Employee</option>
              <option value="client">Client</option>
              <option value="contractor">Contractor</option>
            </select>
          </td>
          <td className="table-cell">
            <div className="flex flex-wrap gap-1">
              {user.roles && user.roles.length > 0 ? (
                user.roles.map((role, index) => (
                  <span
                    key={index}
                    className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-purple-100 text-purple-800"
                  >
                    {can('view_roles') 
                      ? getRoleDisplayName(role, roles)
                      : role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    }
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-500">No roles assigned</span>
              )}
              <PermissionGuard permission="manage_roles">
                <div className="text-xs text-gray-400 mt-1">
                  (Use Role Management to modify)
                </div>
              </PermissionGuard>
            </div>
          </td>
          <td className="table-cell">
            <select name="company_id" value={editData.company_id} onChange={handleEditChange} className="form-input cursor-pointer w-full min-w-0">
              <option value="">No Company</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </td>
          <td className="table-cell">
            <div className="flex gap-2 flex-wrap">
              <Permission
                as="button"
                permission="edit_user"
                variant="success"
                size="sm"
                onClick={() => handleSaveEdit(user.id, editData)}
                disabledText="Cannot save user changes"
              >
                Save
              </Permission>
              <button
                className="btn-secondary text-sm px-3 py-1.5"
                onClick={() => setEditingId(null)}
              >
                Cancel
              </button>
            </div>
          </td>
        </tr>
      );
    }

    return (
      <tr key={user.id} className="hover:bg-gray-50">
        <td className="table-cell">{user.id}</td>
        <td className="table-cell">{user.username}</td>
        <td className="table-cell">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            user.user_type === 'employee' ? 'bg-blue-100 text-blue-800' :
            user.user_type === 'client' ? 'bg-green-100 text-green-800' :
            user.user_type === 'contractor' ? 'bg-orange-100 text-orange-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {user.user_type || 'unknown'}
          </span>
        </td>
        <td className="table-cell">
          <div className="flex flex-wrap gap-1">
            {user.roles && user.roles.length > 0 ? (
              user.roles.map((role, index) => (
                <span
                  key={index}
                  className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-purple-100 text-purple-800"
                >
                  {can('view_roles') 
                    ? (roles.find(r => r.name === role)?.description || role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
                    : role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                  }
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-500">No roles assigned</span>
            )}
          </div>
        </td>
        <td className="table-cell">{user.company_name || 'No Company'}</td>
        <td className="table-cell">
          <div className="flex gap-2 flex-wrap">
            <UserEditButton onClick={() => handleEditUser(user)} />
            <Permission
              as="button"
              permission="edit_user"
              variant="secondary"
              size="sm"
              onClick={() => handleChangePassword(user.id)}
              disabledText="Cannot change passwords"
            >
              Password
            </Permission>
            <UserDeleteButton onClick={() => handleDeleteUser(user.id)} />
          </div>
        </td>
      </tr>
    );
  };

  // Password change row component
  const PasswordChangeRow = ({ userId }) => (
    <tr key={`password-${userId}`} className="bg-yellow-50">
      <td colSpan="4" className="table-cell">
        <div className="flex items-center gap-4">
          <label htmlFor={`new-password-${userId}`} className="text-sm font-medium text-gray-700">
            New Password:
          </label>
          <input
            type="password"
            id={`new-password-${userId}`}
            value={passwordInputs[userId] || ''}
            onChange={(e) => handlePasswordInputChange(userId, e.target.value)}
            placeholder="Enter new password (min 6 characters)"
            minLength="6"
            required
            autoFocus
            className="form-input flex-1 max-w-sm"
          />
        </div>
      </td>
      <td className="table-cell">
        <div className="flex gap-2">
          <Permission
            as="button"
            permission="edit_user"
            variant="success"
            size="sm"
            onClick={() => handleSavePassword(userId)}
            disabledText="Cannot change passwords"
          >
            Save Password
          </Permission>
          <button
            className="btn-secondary text-sm px-3 py-1.5"
            onClick={handleCancelPasswordChange}
          >
            Cancel
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-6 shadow-sm border border-gray-300">
      <h3 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-800 pb-2 mb-6">
        User Management
      </h3>
      
      <PermissionGuard permission="create_user">
        <form onSubmit={handleAddUser} className="bg-gray-50 p-6 mb-8 border border-gray-300">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Add New User</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
              <input
                type="text"
                name="username"
                value={newUser.username}
                onChange={handleNewUserChange}
                placeholder="Username"
                required
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input
                type="password"
                name="password"
                value={newUser.password}
                onChange={handleNewUserChange}
                placeholder="Password"
                required
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User Type *</label>
              <select name="user_type" value={newUser.user_type} onChange={handleNewUserChange} className="form-input cursor-pointer" required>
                <option value="employee">Employee</option>
                <option value="client">Client</option>
                <option value="contractor">Contractor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <select name="company_id" value={newUser.company_id} onChange={handleNewUserChange} className="form-input cursor-pointer">
                <option value="">No Company</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <UserCreateButton type="submit" />
        </form>
      </PermissionGuard>

      <ErrorAlert error={error} onClose={() => setApiError('')} />
      <SuccessAlert message={success} onClose={() => setSuccess('')} />

      {loading ? (
        <LoadingSpinner message="Loading users..." />
      ) : (
        <div className="bg-white border border-gray-300">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="table-header">ID</th>
                <th className="table-header">Username</th>
                <th className="table-header">User Type</th>
                <th className="table-header">Roles</th>
                <th className="table-header">Company</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <React.Fragment key={`user-fragment-${user.id}`}>
                  <UserRow key={user.id} user={user} />
                  {changingPasswordId === user.id && (
                    <PasswordChangeRow key={`password-${user.id}`} userId={user.id} />
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default UserManagement;

