import React, { useState, useEffect } from 'react';
import './ContractorCampaignManagement.css';
import { useApi } from '../hooks/useApi';

function ContractorCampaignManagement({ token, user }) {
  const [campaigns, setCampaigns] = useState([]);
  const [completedCampaigns, setCompletedCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('current');

  const { get, put, error, setError } = useApi(token);

  const fetchCampaigns = async () => {
    setLoading(true);
    setError('');
    try {
      // Only fetch campaigns that are assigned to the contractor and are in progress or approved
      const data = await get('/campaigns'); // instead of '/campaigns/assigned-and-in-progress'
      setCampaigns(data);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedCampaigns = async () => {
    try {
      const data = await get('/campaigns/completed');
      setCompletedCampaigns(data);
    } catch (err) {
      console.error('Error fetching completed campaigns:', err);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchCompletedCampaigns();
  }, [token]);

  const handleStatusUpdate = async (campaignId, newStatus) => {
    setError('');
    setSuccess('');
    
    try {
      const updatedCampaign = await put(`/campaigns/${campaignId}/contractor-status`, { 
        status: newStatus 
      });
      
      setCampaigns(campaigns.map(campaign => 
        campaign.id === campaignId ? updatedCampaign : campaign
      ));
      
      setSuccess(`Campaign status updated to ${newStatus}!`);
      
      // If marked as completed, refresh completed campaigns
      if (newStatus === 'completed') {
        fetchCompletedCampaigns();
      }
    } catch (err) {
      console.error('Error updating campaign status:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      'approved': 'Ready to Start',
      'in_progress': 'In Progress',
      'completed': 'Completed'
    };
    return statusMap[status] || status;
  };

  const canUpdateStatus = (currentStatus) => {
    return currentStatus === 'approved' || currentStatus === 'in_progress';
  };

  const getNextStatus = (currentStatus) => {
    if (currentStatus === 'approved') return 'in_progress';
    if (currentStatus === 'in_progress') return 'completed';
    return null;
  };

  return (
    <div className="contractor-campaign-container">
      <h3>Campaign Management - Contractor</h3>
      
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'current' ? 'active' : ''}`}
          onClick={() => setActiveTab('current')}
        >
          Current Campaigns ({campaigns.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed Campaigns ({completedCampaigns.length})
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Current Campaigns Tab */}
      {activeTab === 'current' && (
        <div className="campaigns-section">
          <h4>Assigned Campaigns</h4>
          
          {loading ? (
            <div className="loading">Loading campaigns...</div>
          ) : campaigns.length === 0 ? (
            <div className="no-campaigns">
              No campaigns assigned to you at this time.
            </div>
          ) : (
            <div className="campaigns-grid">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="campaign-card">
                  <h5>{campaign.name}</h5>
                  <div className={`campaign-status status-${campaign.status}`}>
                    {getStatusDisplay(campaign.status)}
                  </div>
                  <div className="campaign-company">
                    <strong>Client:</strong> {campaign.company_name}
                  </div>
                  <div className="campaign-description">
                    {campaign.description}
                  </div>
                  <div className="campaign-dates">
                    <div><strong>Start:</strong> {formatDate(campaign.start_date)}</div>
                    <div><strong>End:</strong> {formatDate(campaign.end_date)}</div>
                  </div>
                  
                  {canUpdateStatus(campaign.status) && (
                    <div className="campaign-actions">
                      <button
                        className="status-update-btn"
                        onClick={() => handleStatusUpdate(campaign.id, getNextStatus(campaign.status))}
                      >
                        {campaign.status === 'approved' ? 'Start Work' : 'Mark Complete'}
                      </button>
                      <button className="upload-images-btn">
                        Upload Images
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Completed Campaigns Tab */}
      {activeTab === 'completed' && (
        <div className="completed-section">
          <h4>Completed Work</h4>
          
          {completedCampaigns.length === 0 ? (
            <div className="no-campaigns">
              No completed campaigns yet.
            </div>
          ) : (
            <div className="completed-campaigns-grid">
              {completedCampaigns.map((campaign) => (
                <div key={campaign.id} className="completed-campaign-card">
                  <h5>{campaign.name}</h5>
                  <div className="campaign-company">
                    <strong>Client:</strong> {campaign.company_name}
                  </div>
                  <div className="image-stats">
                    <div className="stat">
                      <span className="stat-number">{campaign.total_images || 0}</span>
                      <span className="stat-label">Images Uploaded</span>
                    </div>
                    <div className="stat approved">
                      <span className="stat-number">{campaign.approved_images || 0}</span>
                      <span className="stat-label">Approved</span>
                    </div>
                  </div>
                  <div className="completion-date">
                    Completed: {formatDate(campaign.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ContractorCampaignManagement;