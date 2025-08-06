// frontend/src/components/CompanyManagement.jsx

import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

function CompanyManagement({ token }) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [newCompany, setNewCompany] = useState({
    name: ''
  });

  const { get, post, put, del, error, setError } = useApi(token);

  const fetchCompanies = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await get('/companies');
      setCompanies(data);
    } catch (err) {
      // Error is already set by useApi hook
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
      const data = await post('/companies', newCompany);
      setCompanies([...companies, data]);
      setNewCompany({ name: '' });
      setSuccess('Company added successfully!');
    } catch (err) {
      // Error is already set by useApi hook
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
      const data = await put(`/companies/${companyId}`, updatedData);
      setCompanies(companies.map(company => company.id === companyId ? data : company));
      setEditingId(null);
      setSuccess('Company updated successfully!');
    } catch (err) {
      // Error is already set by useApi hook
    }
  };

  const handleDeleteCompany = async (companyId) => {
    if (!window.confirm('Are you sure you want to delete this company?')) return;
    setError('');
    setSuccess('');
    
    try {
      await del(`/companies/${companyId}`);
      setCompanies(companies.filter((company) => company.id !== companyId));
      setSuccess('Company deleted successfully!');
    } catch (err) {
      // Error is already set by useApi hook
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
        <tr className="editing-row">
          <td className="px-6 py-4 border-b border-gray-200 text-sm text-gray-900">{company.id}</td>
          <td className="px-6 py-4 border-b border-gray-200">
            <input
              type="text"
              name="name"
              value={editData.name}
              onChange={handleEditChange}
              required
              className="form-input"
            />
          </td>
          <td className="px-6 py-4 border-b border-gray-200">
            <div className="action-buttons">
              <button
                className="btn-success btn-sm"
                onClick={() => handleSaveEdit(company.id, editData)}
              >
                Save
              </button>
              <button
                className="btn-secondary btn-sm"
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
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 border-b border-gray-200 text-sm text-gray-900">{company.id}</td>
        <td className="px-6 py-4 border-b border-gray-200 text-sm text-gray-900">{company.name}</td>
        <td className="px-6 py-4 border-b border-gray-200">
          <div className="action-buttons">
            <button
              className="btn-primary btn-sm"
              onClick={() => handleEditCompany(company)}
            >
              Edit
            </button>
            <button
              className="btn-danger btn-sm"
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
    <div className="page-container">
      <h3 className="page-title">Company Management</h3>
      
      <form onSubmit={handleAddCompany} className="section-container">
        <h4 className="section-title">Add New Company</h4>
        <div className="form-group max-w-md">
          <label htmlFor="name" className="form-label">Company Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={newCompany.name}
            onChange={handleNewCompanyChange}
            placeholder="Enter company name"
            required
            className="form-input"
          />
        </div>
        <button type="submit" className="btn-success">Add Company</button>
      </form>

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <span className="loading-text">Loading companies...</span>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <CompanyRow key={company.id} company={company} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CompanyManagement;
