// frontend/src/components/UserManagement.jsx

import { useState, useEffect } from 'react';
import './UserManagement.css';

function UserManagement({ token }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'client' });

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:3001/api/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch users.');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleNewUserChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to add user.');
      setUsers([...users, data]);
      setNewUser({ username: '', password: '', role: 'client' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    setError('');
    try {
      const response = await fetch(`http://localhost:3001/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
         const data = await response.json();
         throw new Error(data.error || 'Failed to delete user.');
      }
      setUsers(users.filter((user) => user.id !== userId));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="user-management-container">
      <h3>User Management</h3>
      
      <form onSubmit={handleAddUser} className="add-user-form">
        <h4>Add New User</h4>
        <input
          type="text"
          name="username"
          value={newUser.username}
          onChange={handleNewUserChange}
          placeholder="Username"
          required
        />
        <input
          type="password"
          name="password"
          value={newUser.password}
          onChange={handleNewUserChange}
          placeholder="Password"
          required
        />
        <select name="role" value={newUser.role} onChange={handleNewUserChange}>
          <option value="client">Client</option>
          <option value="contractor">Contractor</option>
          <option value="employee">Employee</option>
        </select>
        <button type="submit">Add User</button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {loading ? <p>Loading users...</p> : (
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.role}</td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default UserManagement;