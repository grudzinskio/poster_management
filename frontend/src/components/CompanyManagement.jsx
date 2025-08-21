// frontend/src/components/CompanyManagement.jsx

import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useDataFetching } from '../hooks/useDataFetching';
import { PermissionGuard } from './Permission';
import Permission, { CompanyCreateButton } from './Permission';
import LoadingSpinner from './ui/LoadingSpinner';
import ErrorAlert from './ui/ErrorAlert';
import SuccessAlert from './ui/SuccessAlert';

function CompanyManagement({ token }) {
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [newCompany, setNewCompany] = useState({
    name: ''
  });

  const { post, put, del, error: apiError, setError: setApiError } = useApi(token);
  const { data: companies, loading, error: fetchError, refetch } = useDataFetching('/companies', token);

  const error = apiError || fetchError;

  const handleNewCompanyChange = (e) => {
    setNewCompany({ ...newCompany, [e.target.name]: e.target.value });
    if (error) setApiError('');
    if (success) setSuccess('');
  };

  const handleAddCompany = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccess('');
    
    try {
      await post('/companies', newCompany);
      setNewCompany({ name: '' });
      setSuccess('Company added successfully!');
      refetch(); // Use refetch instead of manual state update
    } catch {
      // Error is already set by useApi hook
    }
  };

  const handleEditCompany = (company) => {
    setEditingId(company.id);
    setApiError('');
    setSuccess('');
  };

  const handleSaveEdit = async (companyId, updatedData) => {
    setApiError(''); // Fixed: was setError('')
    setSuccess('');
    console.log('[CompanyManagement] Saving company edit:', companyId, updatedData);
    
    try {
      const data = await put(`/companies/${companyId}`, updatedData);
      console.log('[CompanyManagement] Save response:', data);
      setEditingId(null);
      setSuccess('Company updated successfully!');
      refetch(); // Use refetch instead of manual state update
    } catch (err) {
      console.error('[CompanyManagement] Save error:', err);
      // Error is already set by useApi hook
      // Keep editing mode open on error
    }
  };

  const handleDeleteCompany = async (companyId) => {
    if (!window.confirm('Are you sure you want to delete this company?')) return;
    setApiError('');
    setSuccess('');
    
    try {
      await del(`/companies/${companyId}`);
      setSuccess('Company deleted successfully!');
      refetch(); // Use refetch instead of manual state update
    } catch {
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
                onClick={() => {
                  console.log('[CompanyManagement] Save button clicked:', company.id, editData);
                  handleSaveEdit(company.id, editData);
                }}
                disabled={!editData.name.trim()} // Prevent saving empty names
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

      <ErrorAlert error={error} onClose={() => setApiError('')} />
      <SuccessAlert message={success} onClose={() => setSuccess('')} />

      {loading ? (
        <LoadingSpinner message="Loading companies..." />
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