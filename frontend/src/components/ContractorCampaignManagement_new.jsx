import React, { useState, useEffect } from 'react';
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
      const data = await get('/campaigns');
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
      'pending': 'Pending Review',
      'approved': 'Approved',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  };

  const CampaignCard = ({ campaign, isCompleted = false }) => (
    <div className="campaign-card">
      <div className="card-body">
        <h5 className="card-title">{campaign.name}</h5>
        <div className={`status-badge status-${campaign.status} mb-4`}>
          {getStatusDisplay(campaign.status)}
        </div>
        
        <div className="campaign-meta mb-4">
          <div><strong>Company:</strong> {campaign.company_name}</div>
        </div>
        
        <div className="campaign-description">
          {campaign.description}
        </div>
        
        <div className="campaign-dates">
          <div><strong>Start:</strong> {formatDate(campaign.start_date)}</div>
          <div><strong>End:</strong> {formatDate(campaign.end_date)}</div>
          {isCompleted && campaign.completion_date && (
            <div><strong>Completed:</strong> {formatDate(campaign.completion_date)}</div>
          )}
        </div>
        
        {!isCompleted && campaign.status === 'approved' && (
          <div className="mt-4">
            <button
              onClick={() => handleStatusUpdate(campaign.id, 'in_progress')}
              className="btn-primary btn-sm"
            >
              Start Working
            </button>
          </div>
        )}
        
        {!isCompleted && campaign.status === 'in_progress' && (
          <div className="mt-4 space-y-2">
            <button
              onClick={() => handleStatusUpdate(campaign.id, 'completed')}
              className="btn-success btn-sm mr-2"
            >
              Mark Complete
            </button>
            <button
              className="btn-info btn-sm"
            >
              Upload Images
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <h3 className="page-title">
        Contractor Dashboard - {user.company_name || 'Independent'}
      </h3>

      {/* Tab Navigation */}
      <div className="tab-nav">
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

      {error && <div className="alert-error">{error}</div>}
      {success && <div className="alert-success">{success}</div>}

      {/* Current Campaigns Tab */}
      {activeTab === 'current' && (
        <div>
          <h4 className="section-title">Active Campaigns</h4>
          
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <span className="loading-text">Loading campaigns...</span>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="no-campaigns">
              <div className="empty-state-title">No active campaigns</div>
              <div className="empty-state-description">
                You don't have any assigned campaigns at the moment.
              </div>
            </div>
          ) : (
            <div className="campaign-grid">
              {campaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Completed Campaigns Tab */}
      {activeTab === 'completed' && (
        <div>
          <h4 className="section-title">Completed Campaigns</h4>
          
          {completedCampaigns.length === 0 ? (
            <div className="no-campaigns">
              <div className="empty-state-title">No completed campaigns</div>
              <div className="empty-state-description">
                Completed campaigns will appear here.
              </div>
            </div>
          ) : (
            <div className="campaign-grid">
              {completedCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} isCompleted />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ContractorCampaignManagement;
