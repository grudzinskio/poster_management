// frontend/src/components/UserManagement.jsx

import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

function UserManagement({ token }) {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [changingPasswordId, setChangingPasswordId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordInputs, setPasswordInputs] = useState({});
  const [newUser, setNewUser] = useState({ 
    username: '', 
    password: '', 
    role: 'client',
    company_id: ''
  });

  const { get, post, put, del, error, setError } = useApi(token);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await get('/users');
      setUsers(data);
    } catch (err) {
      // Error is already set by useApi hook
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const data = await get('/companies');
      setCompanies(data);
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, [token]);

  const handleNewUserChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const userData = { ...newUser };
      if (userData.company_id === '') userData.company_id = null;
      
      const data = await post('/users', userData);
      setUsers([...users, data]);
      setNewUser({ 
        username: '', 
        password: '', 
        role: 'client',
        company_id: ''
      });
      setSuccess('User added successfully!');
    } catch (err) {
      // Error is already set by useApi hook
    }
  };

  const handleEditUser = (user) => {
    setEditingId(user.id);
    setError('');
    setSuccess('');
  };

  const handleSaveEdit = async (userId, updatedData) => {
    setError('');
    setSuccess('');
    
    try {
      if (updatedData.company_id === '') updatedData.company_id = null;
      
      const data = await put(`/users/${userId}`, updatedData);
      setUsers(users.map(user => user.id === userId ? data : user));
      setEditingId(null);
      setSuccess('User updated successfully!');
    } catch (err) {
      // Error is already set by useApi hook
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setError('');
    setSuccess('');
    
    try {
      await del(`/users/${userId}`);
      setUsers(users.filter((user) => user.id !== userId));
      setSuccess('User deleted successfully!');
    } catch (err) {
      // Error is already set by useApi hook
    }
  };

  const handleChangePassword = (userId) => {
    setChangingPasswordId(userId);
    setPasswordInputs(prev => ({ ...prev, [userId]: '' }));
    setError('');
    setSuccess('');
  };

  const handlePasswordInputChange = (userId, value) => {
    setPasswordInputs(prev => ({ ...prev, [userId]: value }));
  };

  const handleSavePassword = async (userId) => {
    const password = passwordInputs[userId] || '';
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    setError('');
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
    } catch (err) {
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
    setError('');
    setSuccess('');
  };

  const UserRow = ({ user }) => {
    const [editData, setEditData] = useState({
      username: user.username,
      role: user.role,
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
            <select name="role" value={editData.role} onChange={handleEditChange} className="form-input cursor-pointer">
              <option value="client">Client</option>
              <option value="contractor">Contractor</option>
              <option value="employee">Employee</option>
            </select>
          </td>
          <td className="table-cell">
            <select name="company_id" value={editData.company_id} onChange={handleEditChange} className="form-input cursor-pointer">
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
              <button
                className="btn-success text-sm px-3 py-1.5"
                onClick={() => handleSaveEdit(user.id, editData)}
              >
                Save
              </button>
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
        <td className="table-cell">{user.role}</td>
        <td className="table-cell">{user.company_name || 'No Company'}</td>
        <td className="table-cell">
          <div className="flex gap-2 flex-wrap">
            <button
              className="btn-primary text-sm px-3 py-1.5"
              onClick={() => handleEditUser(user)}
            >
              Edit
            </button>
            <button
              className="btn-secondary text-sm px-3 py-1.5"
              onClick={() => handleChangePassword(user.id)}
            >
              Password
            </button>
            <button
              className="btn-danger text-sm px-3 py-1.5"
              onClick={() => handleDeleteUser(user.id)}
            >
              Delete
            </button>
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
          <button
            className="btn-success text-sm px-3 py-1.5"
            onClick={() => handleSavePassword(userId)}
          >
            Save Password
          </button>
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
      
      <form onSubmit={handleAddUser} className="bg-gray-50 p-6 mb-8 border border-gray-300">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Add New User</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <input
            type="text"
            name="username"
            value={newUser.username}
            onChange={handleNewUserChange}
            placeholder="Username *"
            required
            className="form-input"
          />
          <input
            type="password"
            name="password"
            value={newUser.password}
            onChange={handleNewUserChange}
            placeholder="Password *"
            required
            className="form-input"
          />
          <select name="role" value={newUser.role} onChange={handleNewUserChange} className="form-input cursor-pointer">
            <option value="client">Client</option>
            <option value="contractor">Contractor</option>
            <option value="employee">Employee</option>
          </select>
          <select name="company_id" value={newUser.company_id} onChange={handleNewUserChange} className="form-input cursor-pointer">
            <option value="">No Company</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-success">Add User</button>
      </form>

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="spinner"></div>
          <span className="ml-2 text-gray-600">Loading users...</span>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border border-gray-300">
          <table className="table">
            <thead>
              <tr>
                <th className="table-header">ID</th>
                <th className="table-header">Username</th>
                <th className="table-header">Role</th>
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

