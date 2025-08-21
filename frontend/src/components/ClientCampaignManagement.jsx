// frontend/src/components/ClientCampaignManagement.jsx

import React from 'react';
import { useDataFetching } from '../hooks/useDataFetching';
import LoadingSpinner from './ui/LoadingSpinner';
import ErrorAlert from './ui/ErrorAlert';
import CampaignCard from './ui/CampaignCard';

function ClientCampaignManagement({ token, user }) {
  const { data: campaigns, loading, error } = useDataFetching('/campaigns', token);

  return (
    <div className="bg-white p-6 shadow-sm border border-gray-300">
      <h3 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-800 pb-2 mb-6">
        Campaign Management - {user.company_name}
      </h3>
      
      <ErrorAlert error={error} />

      {/* Campaigns List */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Campaigns</h4>
        
        {loading ? (
          <LoadingSpinner message="Loading campaigns..." />
        ) : campaigns.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No campaigns found for your company.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientCampaignManagement;

