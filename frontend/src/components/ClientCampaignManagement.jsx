// frontend/src/components/ClientCampaignManagement.jsx

import React, { useState, useEffect } from 'react';
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
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-2xl font-bold text-gray-900 border-b-2 border-blue-600 pb-2 mb-6">
        Campaign Management - {user.company_name}
      </h3>
      
      {/* Add Campaign Form */}
      <div className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Create New Campaign</h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Name *
            </label>
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
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={newCampaign.description}
              onChange={handleInputChange}
              required
              placeholder="Describe your campaign goals, target audience, and requirements"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-900 placeholder-gray-500 resize-vertical min-h-[100px]"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={newCampaign.start_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 text-gray-900 placeholder-gray-500"
              />
            </div>
            
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
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
            className={`inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
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
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Campaigns</h4>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
            <span className="ml-2 text-gray-600">Loading campaigns...</span>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No campaigns found. Create your first campaign above!
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
                  <div><span className="font-medium text-gray-700">Start:</span> {formatDate(campaign.start_date)}</div>
                  <div><span className="font-medium text-gray-700">End:</span> {formatDate(campaign.end_date)}</div>
                  <div><span className="font-medium text-gray-700">Created:</span> {formatDate(campaign.created_at)}</div>
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

