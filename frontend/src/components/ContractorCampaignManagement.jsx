import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

function ContractorCampaignManagement({ token, user }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const { get, put, error, setError } = useApi(token);

  const fetchCampaigns = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch campaigns assigned to this contractor
      const data = await get('/campaigns/contractor');
      setCampaigns(data);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [token]);

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

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-2xl font-bold text-gray-900 border-b-2 border-blue-600 pb-2 mb-6">
        My Assigned Campaigns
      </h3>

      {error && <div className="px-4 py-3 rounded-lg mb-4 border bg-red-50 border-red-200 text-red-700">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
          <span className="ml-2 text-gray-600">Loading campaigns...</span>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No campaigns assigned to you yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <h5 className="text-lg font-semibold text-gray-900 mb-2">{campaign.name}</h5>
              <div className={`status-badge status-${campaign.status} mb-4`}>
                {getStatusDisplay(campaign.status)}
              </div>
              <div className="text-gray-600 mb-4 line-clamp-3">
                {campaign.description}
              </div>
              <div className="space-y-1 text-sm text-gray-500">
                <div><span className="font-medium text-gray-700">Company:</span> {campaign.company_name}</div>
                <div><span className="font-medium text-gray-700">Start:</span> {formatDate(campaign.start_date)}</div>
                <div><span className="font-medium text-gray-700">End:</span> {formatDate(campaign.end_date)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ContractorCampaignManagement;