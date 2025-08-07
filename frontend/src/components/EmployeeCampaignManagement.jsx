// frontend/src/components/EmployeeCampaignManagement.jsx

import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

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
      const updatedCampaign = await put(`/campaigns/${campaignId}`, updatedData);
      setCampaigns(campaigns.map(campaign => 
        campaign.id === campaignId ? updatedCampaign : campaign
      ));
      setEditingId(null);
      setSuccess('Campaign updated successfully!');
    } catch (err) {
      console.error('Error updating campaign:', err);
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
      status: campaign.status
    });

    const handleEditChange = (e) => {
      setEditData({ ...editData, [e.target.name]: e.target.value });
    };

    if (editingId === campaign.id) {
      return (
        <tr className="editing-row">
          <td className="px-6 py-4 border-b border-gray-200 text-sm text-gray-900">{campaign.id}</td>
          <td className="px-6 py-4 border-b border-gray-200">
            <input
              type="text"
              name="name"
              value={editData.name}
              onChange={handleEditChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-900 placeholder-gray-500 text-sm"
            />
          </td>
          <td className="px-6 py-4 border-b border-gray-200 text-sm text-gray-900">{campaign.company_name}</td>
          <td className="px-6 py-4 border-b border-gray-200">
            <textarea
              name="description"
              value={editData.description}
              onChange={handleEditChange}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-900 placeholder-gray-500 resize-vertical text-sm"
            />
          </td>
          <td className="px-6 py-4 border-b border-gray-200">
            <input
              type="date"
              name="start_date"
              value={editData.start_date}
              onChange={handleEditChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-900 placeholder-gray-500 text-sm"
            />
          </td>
          <td className="px-6 py-4 border-b border-gray-200">
            <input
              type="date"
              name="end_date"
              value={editData.end_date}
              onChange={handleEditChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-900 placeholder-gray-500 text-sm"
            />
          </td>
          <td className="px-6 py-4 border-b border-gray-200">
            <select
              name="status"
              value={editData.status}
              onChange={handleEditChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-900 placeholder-gray-500 cursor-pointer text-sm"
            >
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </td>
          <td className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleSaveEdit(campaign.id, editData)}
                className="bg-green-600 text-white px-2 py-1 text-xs border border-transparent rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 focus:ring-green-500"
              >
                Save
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="bg-gray-600 text-white px-2 py-1 text-xs border border-transparent rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 focus:ring-gray-500"
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
          <td className="px-6 py-4 border-b border-gray-200" colSpan="8">
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h5 className="font-semibold text-gray-900 mb-3">
                Assign Contractors to: {campaign.name}
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-4 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded">
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
                  className="bg-green-600 text-white px-3 py-1.5 text-sm border border-transparent rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 focus:ring-green-500"
                  disabled={selectedContractors.length === 0}
                >
                  Assign Selected ({selectedContractors.length})
                </button>
                <button
                  onClick={() => {
                    setAssigningId(null);
                    setSelectedContractors([]);
                  }}
                  className="bg-gray-600 text-white px-3 py-1.5 text-sm border border-transparent rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 focus:ring-gray-500"
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
        <td className="px-6 py-4 border-b border-gray-200 text-sm text-gray-900">{campaign.id}</td>
        <td className="px-6 py-4 border-b border-gray-200 text-sm text-gray-900 font-medium">{campaign.name}</td>
        <td className="px-6 py-4 border-b border-gray-200 text-sm text-gray-900">{campaign.company_name}</td>
        <td className="px-6 py-4 border-b border-gray-200 text-sm text-gray-900">
          <div className="max-w-xs truncate" title={campaign.description}>
            {campaign.description}
          </div>
        </td>
        <td className="px-6 py-4 border-b border-gray-200 text-sm text-gray-900">{formatDate(campaign.start_date)}</td>
        <td className="px-6 py-4 border-b border-gray-200 text-sm text-gray-900">{formatDate(campaign.end_date)}</td>
        <td className="px-6 py-4 border-b border-gray-200 text-sm text-gray-900">
          <span className={`status-badge status-${campaign.status}`}>
            {getStatusDisplay(campaign.status)}
          </span>
        </td>
        <td className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleEditCampaign(campaign)}
              className="bg-blue-600 text-white px-2 py-1 text-xs border border-transparent rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 focus:ring-blue-500"
            >
              Edit
            </button>
            <button
              onClick={() => handleAssignContractors(campaign.id)}
              className="bg-cyan-600 text-white px-2 py-1 text-xs border border-transparent rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-700 focus:ring-cyan-500"
            >
              Assign
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-8">
      <h3 className="text-2xl font-bold text-gray-900 border-b-2 border-blue-600 pb-2 mb-6">Employee Campaign Management</h3>
      
      {/* Add Campaign Form */}
      <div className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Create New Campaign</h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-row">
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Campaign Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={newCampaign.name}
                onChange={handleInputChange}
                required
                placeholder="Enter campaign name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-900 placeholder-gray-500"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="company_id" className="block text-sm font-medium text-gray-700 mb-2">Company *</label>
              <select
                id="company_id"
                name="company_id"
                value={newCampaign.company_id}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-900 placeholder-gray-500 cursor-pointer"
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
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              id="description"
              name="description"
              value={newCampaign.description}
              onChange={handleInputChange}
              required
              placeholder="Describe the campaign goals, target audience, and requirements"
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-900 placeholder-gray-500 resize-vertical"
            />
          </div>
          
          <div className="form-row">
            <div className="mb-4">
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={newCampaign.start_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-900 placeholder-gray-500"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={newCampaign.end_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className={`btn-success ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create Campaign'}
          </button>
        </form>
      </div>

      {error && <div className="px-4 py-3 rounded-lg mb-4 border bg-red-50 border-red-200 text-red-700">{error}</div>}
      {success && <div className="px-4 py-3 rounded-lg mb-4 border bg-green-50 border-green-200 text-green-700">{success}</div>}

      {/* Campaigns List */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">All Campaigns</h4>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
            <span className="ml-2 text-gray-600">Loading campaigns...</span>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="no-campaigns">
            <div className="empty-state-title">No campaigns found</div>
            <div className="empty-state-description">Create the first campaign above!</div>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Description</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Actions</th>
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

