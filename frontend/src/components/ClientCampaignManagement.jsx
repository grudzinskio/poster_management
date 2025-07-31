// frontend/src/components/ClientCampaignManagement.jsx

import React, { useState, useEffect } from 'react';
import './ClientCampaignManagement.css';
import { useApi } from '../hooks/useApi';

function ClientCampaignManagement({ token, user }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: ''
  });

  const { get, post, error, setError } = useApi(token);

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

  useEffect(() => {
    fetchCampaigns();
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

    try {
      const createdCampaign = await post('/campaigns', newCampaign);
      setCampaigns([createdCampaign, ...campaigns]);
      setNewCampaign({
        name: '',
        description: '',
        start_date: '',
        end_date: ''
      });
      setSuccess('Campaign created successfully!');
    } catch (err) {
      console.error('Error creating campaign:', err);
      // Error is already set by useApi hook
    } finally {
      setSubmitting(false);
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

  return (
    <div className="client-campaign-container">
      <h3>Campaign Management - {user.company_name}</h3>
      
      {/* Add Campaign Form */}
      <div className="add-campaign-form">
        <h4>Create New Campaign</h4>
        <form onSubmit={handleSubmit}>
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
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={newCampaign.description}
              onChange={handleInputChange}
              required
              placeholder="Describe your campaign goals, target audience, and requirements"
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
        <h4>Your Campaigns</h4>
        
        {loading ? (
          <div className="loading">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="no-campaigns">
            No campaigns found. Create your first campaign above!
          </div>
        ) : (
          <div className="campaigns-grid">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="campaign-card">
                <h5>{campaign.name}</h5>
                <div className={`campaign-status status-${campaign.status}`}>
                  {getStatusDisplay(campaign.status)}
                </div>
                <div className="campaign-description">
                  {campaign.description}
                </div>
                <div className="campaign-dates">
                  <div><strong>Start:</strong> {formatDate(campaign.start_date)}</div>
                  <div><strong>End:</strong> {formatDate(campaign.end_date)}</div>
                  <div><strong>Created:</strong> {formatDate(campaign.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientCampaignManagement;
