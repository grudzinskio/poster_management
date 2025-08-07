// frontend/src/components/UserManagement.jsx

import { useState, useEffect } from 'react';
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
          <td className="px-6 py-4 border-b border-gray-200 text-sm text-gray-900">{user.id}</td>
          <td className="px-6 py-4 border-b border-gray-200">
            <input
              type="text"
              name="username"
              value={editData.username}
              onChange={handleEditChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-900 placeholder-gray-500"
            />
          </td>
          <td className="px-6 py-4 border-b border-gray-200">
            <select name="role" value={editData.role} onChange={handleEditChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-900 placeholder-gray-500 cursor-pointer">
              <option value="client">Client</option>
              <option value="contractor">Contractor</option>
              <option value="employee">Employee</option>
            </select>
          </td>
          <td className="px-6 py-4 border-b border-gray-200">
            <select name="company_id" value={editData.company_id} onChange={handleEditChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-900 placeholder-gray-500 cursor-pointer">
              <option value="">No Company</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </td>
          <td className="px-6 py-4 border-b border-gray-200">
            <div className="flex gap-2 flex-wrap">
              <button
                className="bg-green-600 text-white px-3 py-1.5 text-sm border border-transparent rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 focus:ring-green-500"
                onClick={() => handleSaveEdit(user.id, editData)}
              >
                Save
              </button>
              <button
                className="bg-gray-600 text-white px-3 py-1.5 text-sm border border-transparent rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 focus:ring-gray-500"
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
        <td className="px-6 py-4 border-b border-gray-200 text-sm text-gray-900">{user.id}</td>
        <td className="px-6 py-4 border-b border-gray-200 text-sm text-gray-900">{user.username}</td>
        <td className="px-6 py-4 border-b border-gray-200 text-sm text-gray-900">{user.role}</td>
        <td className="px-6 py-4 border-b border-gray-200 text-sm text-gray-900">{user.company_name || 'No Company'}</td>
        <td className="px-6 py-4 border-b border-gray-200">
          <div className="flex gap-2 flex-wrap">
            <button
              className="bg-blue-600 text-white px-3 py-1.5 text-sm border border-transparent rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 focus:ring-blue-500"
              onClick={() => handleEditUser(user)}
            >
              Edit
            </button>
            <button
              className="bg-gray-600 text-white px-3 py-1.5 text-sm border border-transparent rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 focus:ring-gray-500"
              onClick={() => handleChangePassword(user.id)}
            >
              Change Password
            </button>
            <button
              className="bg-red-600 text-white px-3 py-1.5 text-sm border border-transparent rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 focus:ring-red-500"
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
      <td colSpan="4" className="px-6 py-4 border-b border-gray-200">
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
      <td className="px-6 py-4 border-b border-gray-200">
        <div className="flex gap-2">
          <button
            className="bg-green-600 text-white px-3 py-1.5 text-sm border border-transparent rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 focus:ring-green-500"
            onClick={() => handleSavePassword(userId)}
          >
            Save Password
          </button>
          <button
            className="bg-gray-600 text-white px-3 py-1.5 text-sm border border-transparent rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 focus:ring-gray-500"
            onClick={handleCancelPasswordChange}
          >
            Cancel
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-2xl font-bold text-gray-900 border-b-2 border-blue-600 pb-2 mb-6">
        User Management
      </h3>
      
      <form onSubmit={handleAddUser} className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Add New User</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <input
            type="text"
            name="username"
            value={newUser.username}
            onChange={handleNewUserChange}
            placeholder="Username *"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-900 placeholder-gray-500"
          />
          <input
            type="password"
            name="password"
            value={newUser.password}
            onChange={handleNewUserChange}
            placeholder="Password *"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-900 placeholder-gray-500"
          />
          <select name="role" value={newUser.role} onChange={handleNewUserChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-900 placeholder-gray-500 cursor-pointer">
            <option value="client">Client</option>
            <option value="contractor">Contractor</option>
            <option value="employee">Employee</option>
          </select>
          <select name="company_id" value={newUser.company_id} onChange={handleNewUserChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-900 placeholder-gray-500 cursor-pointer">
            <option value="">No Company</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="bg-green-600 text-white px-4 py-2 border border-transparent rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 focus:ring-green-500">Add User</button>
      </form>

      {error && <div className="px-4 py-3 rounded-lg mb-4 border bg-red-50 border-red-200 text-red-700">{error}</div>}
      {success && <div className="px-4 py-3 rounded-lg mb-4 border bg-green-50 border-green-200 text-green-700">{success}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
          <span className="ml-2 text-gray-600">Loading users...</span>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Role</th>
                <th>Company</th>
                <th>Actions</th>
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

