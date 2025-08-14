// frontend/src/components/EmployeeCampaignManagement.jsx

import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import ProtectedButton, { AddCampaignButton } from './ProtectedButton';

function EmployeeCampaignManagement({ token, user }) {
  const [campaigns, setCampaigns] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [assigningId, setAssigningId] = useState(null);
  const [selectedContractors, setSelectedContractors] = useState([]);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    company_id: ''
  });

  const { get, post, put, error, setError } = useApi(token);

  const fetchCampaigns = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await get('/campaigns');
      setCampaigns(data);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
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

  const fetchContractors = async () => {
    try {
      const data = await get('/users?role=contractor');
      setContractors(data);
    } catch (err) {
      console.error('Error fetching contractors:', err);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchCompanies();
    fetchContractors();
  }, [token]);

  const handleInputChange = (e) => {
    setNewCampaign({ ...newCampaign, [e.target.name]: e.target.value });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    if (!newCampaign.company_id) {
      setError('Please select a company for the campaign');
      setSubmitting(false);
      return;
    }

    try {
      const createdCampaign = await post('/campaigns', newCampaign);
      setCampaigns([createdCampaign, ...campaigns]);
      setNewCampaign({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        company_id: ''
      });
      setSuccess('Campaign created successfully!');
    } catch (err) {
      console.error('Error creating campaign:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCampaign = (campaign) => {
    setEditingId(campaign.id);
    setError('');
    setSuccess('');
  };

  const handleSaveEdit = async (campaignId, updatedData) => {
    setError('');
    setSuccess('');
    
    try {
      // Ensure dates are properly formatted or null
      const cleanedData = {
        ...updatedData,
        start_date: updatedData.start_date || null,
        end_date: updatedData.end_date || null
      };
      
      console.log('Sending update data:', cleanedData); // Add this debug log
      
      const updatedCampaign = await put(`/campaigns/${campaignId}`, cleanedData);
      setCampaigns(campaigns.map(campaign => 
        campaign.id === campaignId ? updatedCampaign : campaign
      ));
      setEditingId(null);
      setSuccess('Campaign updated successfully!');
    } catch (err) {
      console.error('Error updating campaign:', err);
      setError('Failed to update campaign. Please check your input and try again.');
    }
  };

  const handleAssignContractors = (campaignId) => {
    setAssigningId(campaignId);
    setSelectedContractors([]);
    setError('');
    setSuccess('');
  };

  const handleContractorSelection = (contractorId) => {
    setSelectedContractors(prev => {
      if (prev.includes(contractorId)) {
        return prev.filter(id => id !== contractorId);
      } else {
        return [...prev, contractorId];
      }
    });
  };

  const handleSaveAssignment = async (campaignId) => {
    if (selectedContractors.length === 0) {
      setError('Please select at least one contractor');
      return;
    }
    
    setError('');
    setSuccess('');
    
    try {
      await post(`/campaigns/${campaignId}/assign`, { 
        contractor_ids: selectedContractors 
      });
      setAssigningId(null);
      setSelectedContractors([]);
      setSuccess('Contractors assigned successfully!');
      fetchCampaigns(); // Refresh to show updated assignments
    } catch (err) {
      console.error('Error assigning contractors:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      'pending': 'Pending Review',
      'approved': 'Approved',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  };

  const CampaignRow = ({ campaign }) => {
    const [editData, setEditData] = useState({
      name: campaign.name,
      description: campaign.description,
      start_date: campaign.start_date ? campaign.start_date.split('T')[0] : '',
      end_date: campaign.end_date ? campaign.end_date.split('T')[0] : '',
      status: campaign.status,
      company_id: campaign.company_id // Add this line
    });

    const handleEditChange = (e) => {
      const newData = { ...editData, [e.target.name]: e.target.value };
      console.log('Edit data being updated:', newData); // Debug log
      setEditData(newData);
    };

    if (editingId === campaign.id) {
      return (
        <tr className="editing-row">
          <td className="table-cell">{campaign.id}</td>
          <td className="table-cell">
            <input
              type="text"
              name="name"
              value={editData.name}
              onChange={handleEditChange}
              className="form-input text-sm"
            />
          </td>
          <td className="table-cell">{campaign.company_name}</td>
          <td className="table-cell">
            <textarea
              name="description"
              value={editData.description}
              onChange={handleEditChange}
              rows="2"
              className="form-textarea text-sm"
            />
          </td>
          <td className="table-cell">
            <input
              type="date"
              name="start_date"
              value={editData.start_date}
              onChange={handleEditChange}
              className="form-input text-sm"
            />
          </td>
          <td className="table-cell">
            <input
              type="date"
              name="end_date"
              value={editData.end_date}
              onChange={handleEditChange}
              className="form-input text-sm"
            />
          </td>
          <td className="table-cell">
            <select
              name="status"
              value={editData.status}
              onChange={handleEditChange}
              className="form-input cursor-pointer text-sm"
            >
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </td>
          <td className="table-cell">
            <div className="flex flex-wrap gap-2">
              <ProtectedButton
                permission="edit_campaign"
                onClick={() => handleSaveEdit(campaign.id, editData)}
                className="btn-success text-xs px-2 py-1"
                tooltipText="You don't have permission to edit campaigns"
              >
                Save
              </ProtectedButton>
              <button
                onClick={() => setEditingId(null)}
                className="btn-secondary text-xs px-2 py-1"
              >
                Cancel
              </button>
            </div>
          </td>
        </tr>
      );
    }

    if (assigningId === campaign.id) {
      return (
        <tr className="assigning-row">
          <td className="table-cell" colSpan="8">
            <div className="p-4 bg-yellow-50 border border-yellow-300">
              <h5 className="font-semibold text-gray-900 mb-3">
                Assign Contractors to: {campaign.name}
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-4 max-h-48 overflow-y-auto p-2 border border-gray-200">
                {contractors.map(contractor => (
                  <label key={contractor.id} className="flex items-center space-x-2 p-2 hover:bg-white rounded cursor-pointer">
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={selectedContractors.includes(contractor.id)}
                      onChange={() => handleContractorSelection(contractor.id)}
                    />
                    <span className="text-sm text-gray-900">
                      {contractor.username} ({contractor.company_name || 'No Company'})
                    </span>
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSaveAssignment(campaign.id)}
                  className="btn-success text-sm"
                  disabled={selectedContractors.length === 0}
                >
                  Assign Selected ({selectedContractors.length})
                </button>
                <button
                  onClick={() => {
                    setAssigningId(null);
                    setSelectedContractors([]);
                  }}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </td>
        </tr>
      );
    }

    return (
      <tr className="hover:bg-gray-50">
        <td className="table-cell">{campaign.id}</td>
        <td className="table-cell font-medium">{campaign.name}</td>
        <td className="table-cell">{campaign.company_name}</td>
        <td className="table-cell">
          <div className="max-w-xs truncate" title={campaign.description}>
            {campaign.description}
          </div>
        </td>
        <td className="table-cell">{formatDate(campaign.start_date)}</td>
        <td className="table-cell">{formatDate(campaign.end_date)}</td>
        <td className="table-cell">
          <span className={`status-badge status-${campaign.status}`}>
            {getStatusDisplay(campaign.status)}
          </span>
        </td>
        <td className="table-cell">
          <div className="flex flex-wrap gap-2">
            <ProtectedButton
              permission="edit_campaign"
              onClick={() => handleEditCampaign(campaign)}
              className="btn-primary text-xs px-2 py-1"
              fallbackText="Cannot edit campaigns"
            >
              Edit
            </ProtectedButton>
            <ProtectedButton
              permission="assign_campaign"
              onClick={() => handleAssignContractors(campaign.id)}
              className="btn-secondary text-xs px-2 py-1"
              fallbackText="Cannot assign contractors"
            >
              Assign
            </ProtectedButton>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white p-6 shadow-sm border border-gray-300 mt-8">
      <h3 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-800 pb-2 mb-6">Employee Campaign Management</h3>
      
      {/* Add Campaign Form */}
      <div className="bg-gray-50 p-6 mb-8 border border-gray-300">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Create New Campaign</h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-row">
            <div className="mb-4">
              <label htmlFor="name" className="form-label">Campaign Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={newCampaign.name}
                onChange={handleInputChange}
                required
                placeholder="Enter campaign name"
                className="form-input"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="company_id" className="form-label">Company *</label>
              <select
                id="company_id"
                name="company_id"
                value={newCampaign.company_id}
                onChange={handleInputChange}
                required
                className="form-input cursor-pointer"
              >
                <option value="">Select Company</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="description" className="form-label">Description *</label>
            <textarea
              id="description"
              name="description"
              value={newCampaign.description}
              onChange={handleInputChange}
              required
              placeholder="Describe the campaign goals, target audience, and requirements"
              rows="3"
              className="form-textarea"
            />
          </div>
          
          <div className="form-row">
            <div className="mb-4">
              <label htmlFor="start_date" className="form-label">Start Date</label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={newCampaign.start_date}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="end_date" className="form-label">End Date</label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={newCampaign.end_date}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
          </div>
          
          <ProtectedButton
            permission="create_campaign"
            type="submit" 
            className={`btn-success ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={submitting}
            fallbackText="Cannot create campaigns"
          >
            {submitting ? 'Creating...' : 'Create Campaign'}
          </ProtectedButton>
        </form>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      {/* Campaigns List */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">All Campaigns</h4>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="spinner"></div>
            <span className="ml-2 text-gray-600">Loading campaigns...</span>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-lg font-medium">No campaigns found</div>
            <div className="text-sm">Create the first campaign above!</div>
          </div>
        ) : (
          <div className="bg-white border border-gray-300">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="table-header">ID</th>
                  <th className="table-header">Name</th>
                  <th className="table-header">Company</th>
                  <th className="table-header">Description</th>
                  <th className="table-header">Start Date</th>
                  <th className="table-header">End Date</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <CampaignRow key={campaign.id} campaign={campaign} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeCampaignManagement;

