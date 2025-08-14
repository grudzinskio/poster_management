// frontend/src/components/CompanyManagement.jsx

import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { PermissionGuard } from './Permission';
import Permission, { CompanyCreateButton } from './Permission';

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
          <td className="table-cell">{company.id}</td>
          <td className="table-cell">
            <input
              type="text"
              name="name"
              value={editData.name}
              onChange={handleEditChange}
              required
              className="form-input"
            />
          </td>
          <td className="table-cell">
            <div className="flex flex-wrap gap-2">
              <button
                className="btn-success text-sm px-3 py-1.5"
                onClick={() => handleSaveEdit(company.id, editData)}
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
      <tr className="hover:bg-gray-50">
        <td className="table-cell">{company.id}</td>
        <td className="table-cell">{company.name}</td>
        <td className="table-cell">
          <div className="flex flex-wrap gap-2">
            <Permission
              as="button"
              permission="edit_company"
              variant="primary"
              size="sm"
              onClick={() => handleEditCompany(company)}
              disabledText="Cannot edit companies"
            >
              Edit
            </Permission>
            <Permission
              as="button"
              permission="delete_company"
              variant="danger"
              size="sm"
              onClick={() => handleDeleteCompany(company.id)}
              disabledText="Cannot delete companies"
            >
              Delete
            </Permission>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white p-6 shadow-sm border border-gray-300 mt-8">
      <h3 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-800 pb-2 mb-6">Company Management</h3>
      
      <form onSubmit={handleAddCompany} className="bg-gray-50 p-6 mb-8 border border-gray-300">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Add New Company</h4>
        <div className="mb-4 max-w-md">
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
        <CompanyCreateButton type="submit" />
      </form>

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="spinner"></div>
          <span className="ml-2 text-gray-600">Loading companies...</span>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white border border-gray-300">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="table-header">ID</th>
                <th className="table-header">Name</th>
                <th className="table-header">Actions</th>
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

