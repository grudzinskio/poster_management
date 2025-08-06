// frontend/src/components/EmployeeCampaignManagement.jsx

import React, { useState, useEffect } from 'react';
import './EmployeeCampaignManagement.css';
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
      // Error is already set by useApi hook
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
      const data = await put(`/campaigns/${campaignId}`, updatedData);
      setCampaigns(campaigns.map(campaign => 
        campaign.id === campaignId ? data : campaign
      ));
      setEditingId(null);
      setSuccess('Campaign updated successfully!');
    } catch (err) {
      console.error('Error updating campaign:', err);
      // Error is already set by useApi hook
    }
  };

  const handleStatusChange = async (campaignId, newStatus) => {
    setError('');
    setSuccess('');
    
    try {
      await put(`/campaigns/${campaignId}/status`, { status: newStatus });
      setCampaigns(campaigns.map(campaign => 
        campaign.id === campaignId ? { ...campaign, status: newStatus } : campaign
      ));
      setSuccess(`Campaign status updated to ${newStatus}!`);
    } catch (err) {
      console.error('Error updating campaign status:', err);
      // Error is already set by useApi hook
    }
  };

  const handleAssignContractors = async (campaignId, contractorIds) => {
    setError('');
    setSuccess('');
    
    try {
      await post(`/campaigns/${campaignId}/assign`, { 
        contractor_ids: contractorIds 
      });
      
      setSuccess('Contractors assigned successfully!');
      setAssigningId(null);
      setSelectedContractors([]);
    } catch (err) {
      console.error('Error assigning contractors:', err);
    }
  };

  const handleContractorSelection = (contractorId, isSelected) => {
    if (isSelected) {
      setSelectedContractors([...selectedContractors, contractorId]);
    } else {
      setSelectedContractors(selectedContractors.filter(id => id !== contractorId));
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
      company_id: campaign.company_id || ''
    });

    const handleEditChange = (e) => {
      setEditData({ ...editData, [e.target.name]: e.target.value });
    };

    if (assigningId === campaign.id) {
      return (
        <tr key={campaign.id} className="assigning-row">
          <td colSpan="8">
            <div className="contractor-assignment">
              <h5>Assign Contractors to: {campaign.name}</h5>
              <div className="contractor-list">
                {contractors.map(contractor => (
                  <div key={contractor.id} className="contractor-checkbox">
                    <input
                      type="checkbox"
                      id={`contractor-${contractor.id}`}
                      checked={selectedContractors.includes(contractor.id)}
                      onChange={(e) => handleContractorSelection(contractor.id, e.target.checked)}
                    />
                    <label htmlFor={`contractor-${contractor.id}`}>
                      {contractor.username} {contractor.company_name && `(${contractor.company_name})`}
                    </label>
                  </div>
                ))}
              </div>
              <div className="assignment-actions">
                <button
                  className="save-btn"
                  onClick={() => handleAssignContractors(campaign.id, selectedContractors)}
                  disabled={selectedContractors.length === 0}
                >
                  Assign Selected
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => {
                    setAssigningId(null);
                    setSelectedContractors([]);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </td>
        </tr>
      );
    }

    if (editingId === campaign.id) {
      return (
        <tr key={campaign.id} className="editing-row">
          <td>{campaign.id}</td>
          <td>
            <input
              type="text"
              name="name"
              value={editData.name}
              onChange={handleEditChange}
              required
              className="edit-input"
            />
          </td>
          <td>
            <select 
              name="company_id" 
              value={editData.company_id} 
              onChange={handleEditChange}
              className="edit-select"
              required
            >
              <option value="">Select Company</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </td>
          <td>
            <textarea
              name="description"
              value={editData.description}
              onChange={handleEditChange}
              className="edit-textarea"
              rows="2"
              required
            />
          </td>
          <td>
            <input
              type="date"
              name="start_date"
              value={editData.start_date}
              onChange={handleEditChange}
              className="edit-input"
            />
          </td>
          <td>
            <input
              type="date"
              name="end_date"
              value={editData.end_date}
              onChange={handleEditChange}
              className="edit-input"
            />
          </td>
          <td>{getStatusDisplay(campaign.status)}</td>
          <td>
            <div className="action-buttons">
              <button
                className="save-btn"
                onClick={() => handleSaveEdit(campaign.id, editData)}
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
      <tr key={campaign.id}>
        <td>{campaign.id}</td>
        <td>{campaign.name}</td>
        <td>{campaign.company_name}</td>
        <td className="description-cell">{campaign.description}</td>
        <td>{formatDate(campaign.start_date)}</td>
        <td>{formatDate(campaign.end_date)}</td>
        <td>
          <span className={`status-badge status-${campaign.status}`}>
            {getStatusDisplay(campaign.status)}
          </span>
        </td>
        <td>
          <div className="action-buttons">
            <button
              className="edit-btn"
              onClick={() => handleEditCampaign(campaign)}
            >
              Edit
            </button>
            <button
              className="assign-btn"
              onClick={() => {
                setAssigningId(campaign.id);
                setSelectedContractors([]);
                setError('');
                setSuccess('');
              }}
            >
              Assign
            </button>
            <select
              value={campaign.status}
              onChange={(e) => handleStatusChange(campaign.id, e.target.value)}
              className="status-select"
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="employee-campaign-container">
      <h3>Campaign Management</h3>
      
      {/* Add Campaign Form */}
      <div className="add-campaign-form">
        <h4>Create New Campaign</h4>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Campaign Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={newCampaign.name}
                onChange={handleInputChange}
                required
                placeholder="Enter campaign name"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="company_id">Company *</label>
              <select
                id="company_id"
                name="company_id"
                value={newCampaign.company_id}
                onChange={handleInputChange}
                required
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
          
          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={newCampaign.description}
              onChange={handleInputChange}
              required
              placeholder="Describe the campaign goals, target audience, and requirements"
              rows="3"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="start_date">Start Date</label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={newCampaign.start_date}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="end_date">End Date</label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={newCampaign.end_date}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className="submit-button"
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create Campaign'}
          </button>
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Campaigns List */}
      <div className="campaigns-section">
        <h4>All Campaigns</h4>
        
        {loading ? (
          <div className="loading">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="no-campaigns">
            No campaigns found. Create the first campaign above!
          </div>
        ) : (
          <div className="campaigns-table-container">
            <table className="campaigns-table">
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
