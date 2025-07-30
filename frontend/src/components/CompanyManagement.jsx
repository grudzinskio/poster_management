// frontend/src/components/CompanyManagement.jsx

import { useState, useEffect } from 'react';
import './CompanyManagement.css';

function CompanyManagement({ token }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [newCompany, setNewCompany] = useState({
    name: ''
  });

  const fetchCompanies = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:3001/api/companies', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch companies.');
      const data = await response.json();
      setCompanies(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [token]);

  const handleNewCompanyChange = (e) => {
    setNewCompany({ ...newCompany, [e.target.name]: e.target.value });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleAddCompany = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('http://localhost:3001/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newCompany),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to add company.');
      
      setCompanies([...companies, data]);
      setNewCompany({ name: '' });
      setSuccess('Company added successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditCompany = (company) => {
    setEditingId(company.id);
    setError('');
    setSuccess('');
  };

  const handleSaveEdit = async (companyId, updatedData) => {
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch(`http://localhost:3001/api/companies/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update company.');
      
      setCompanies(companies.map(company => 
        company.id === companyId ? data : company
      ));
      setEditingId(null);
      setSuccess('Company updated successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteCompany = async (companyId) => {
    if (!window.confirm('Are you sure you want to delete this company? This action cannot be undone.')) return;
    
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch(`http://localhost:3001/api/companies/${companyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete company.');
      }
      
      setCompanies(companies.filter((company) => company.id !== companyId));
      setSuccess('Company deleted successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const CompanyRow = ({ company }) => {
    const [editData, setEditData] = useState({
      name: company.name
    });

    const handleEditChange = (e) => {
      setEditData({ ...editData, [e.target.name]: e.target.value });
    };

    if (editingId === company.id) {
      return (
        <tr key={company.id}>
          <td>{company.id}</td>
          <td>
            <input
              type="text"
              name="name"
              value={editData.name}
              onChange={handleEditChange}
              required
            />
          </td>
          <td>
            <div className="action-buttons">
              <button
                className="save-btn"
                onClick={() => handleSaveEdit(company.id, editData)}
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
      <tr key={company.id}>
        <td>{company.id}</td>
        <td>{company.name}</td>
        <td>
          <div className="action-buttons">
            <button
              className="edit-btn"
              onClick={() => handleEditCompany(company)}
            >
              Edit
            </button>
            <button
              className="delete-btn"
              onClick={() => handleDeleteCompany(company.id)}
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="company-management-container">
      <h3>Company Management</h3>
      
      <form onSubmit={handleAddCompany} className="add-company-form">
        <h4>Add New Company</h4>
        <div className="form-row">
          <input
            type="text"
            name="name"
            value={newCompany.name}
            onChange={handleNewCompanyChange}
            placeholder="Company Name *"
            required
          />
        </div>
        <button type="submit" className="submit-button">Add Company</button>
      </form>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {loading ? <p>Loading companies...</p> : (
        <table className="companies-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Company Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <CompanyRow key={company.id} company={company} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default CompanyManagement;
