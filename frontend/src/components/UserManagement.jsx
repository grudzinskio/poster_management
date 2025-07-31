// frontend/src/components/UserManagement.jsx

import { useState, useEffect } from 'react';
import './UserManagement.css';
import { useApi } from '../hooks/useApi';

function UserManagement({ token }) {
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
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
        <tr key={user.id}>
          <td>{user.id}</td>
          <td>
            <input
              type="text"
              name="username"
              value={editData.username}
              onChange={handleEditChange}
              required
            />
          </td>
          <td>
            <select name="role" value={editData.role} onChange={handleEditChange}>
              <option value="client">Client</option>
              <option value="contractor">Contractor</option>
              <option value="employee">Employee</option>
            </select>
          </td>
          <td>
            <select name="company_id" value={editData.company_id} onChange={handleEditChange}>
              <option value="">No Company</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </td>
          <td>
            <div className="action-buttons">
              <button
                className="save-btn"
                onClick={() => handleSaveEdit(user.id, editData)}
              >
                Save
              </button>
              <button
                className="cancel-btn"
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
      <tr key={user.id}>
        <td>{user.id}</td>
        <td>{user.username}</td>
        <td>{user.role}</td>
        <td>{user.company_name || 'No Company'}</td>
        <td>
          <div className="action-buttons">
            <button
              className="edit-btn"
              onClick={() => handleEditUser(user)}
            >
              Edit
            </button>
            <button
              className="delete-btn"
              onClick={() => handleDeleteUser(user.id)}
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="user-management-container">
      <h3>User Management</h3>
      
      <form onSubmit={handleAddUser} className="add-user-form">
        <h4>Add New User</h4>
        <div className="form-row">
          <input
            type="text"
            name="username"
            value={newUser.username}
            onChange={handleNewUserChange}
            placeholder="Username *"
            required
          />
          <input
            type="password"
            name="password"
            value={newUser.password}
            onChange={handleNewUserChange}
            placeholder="Password *"
            required
          />
          <select name="role" value={newUser.role} onChange={handleNewUserChange}>
            <option value="client">Client</option>
            <option value="contractor">Contractor</option>
            <option value="employee">Employee</option>
          </select>
          <select name="company_id" value={newUser.company_id} onChange={handleNewUserChange}>
            <option value="">No Company</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="submit-button">Add User</button>
      </form>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {loading ? <p>Loading users...</p> : (
        <table className="users-table">
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
              <UserRow key={user.id} user={user} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default UserManagement;