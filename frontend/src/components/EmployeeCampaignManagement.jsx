// frontend/src/components/EmployeeCampaignManagement.jsx

import React, { useState } from 'react';
import { useMultipleDataFetching } from '../hooks/useDataFetching';
import { PermissionGuard } from './Permission';
import LoadingSpinner from './ui/LoadingSpinner';
import ErrorAlert from './ui/ErrorAlert';
import SuccessAlert from './ui/SuccessAlert';
import CampaignForm from './employee/CampaignForm';
import CampaignRow from './employee/CampaignRow';

function EmployeeCampaignManagement({ token, user }) {
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [assigningId, setAssigningId] = useState(null);

  // Fetch all required data in parallel
  const { 
    data: { campaigns = [], companies = [], users: contractors = [] }, 
    loading, 
    error, 
    refetch 
  } = useMultipleDataFetching(['/campaigns', '/companies', '/users'], token);

  // Filter contractors from users
  const filteredContractors = contractors.filter(user => 
    user.roles && user.roles.some(role => 
      typeof role === 'string' ? role === 'contractor' : role.name === 'contractor'
    )
  );

  const handleCampaignCreated = () => {
    refetch(); // Refresh all data
  };

  const handleEditStart = (campaignId) => {
    setEditingId(campaignId);
    setSuccess('');
  };

  const handleEditComplete = (successMessage) => {
    setEditingId(null);
    if (successMessage) {
      setSuccess(successMessage);
      refetch();
    }
  };

  const handleAssignStart = (campaignId) => {
    setAssigningId(campaignId);
    setSuccess('');
  };

  const handleAssignComplete = (successMessage) => {
    setAssigningId(null);
    if (successMessage) {
      setSuccess(successMessage);
      refetch();
    }
  };

  return (
    <div className="bg-white p-6 shadow-sm border border-gray-300">
      <h3 className="text-2xl font-bold text-gray-900 border-b-2 border-gray-800 pb-2 mb-6">
        Campaign Management
      </h3>
      
      <PermissionGuard permission="create_campaign">
        <CampaignForm
          token={token}
          companies={companies}
          onCampaignCreated={handleCampaignCreated}
          onSuccess={setSuccess}
          onError={(error) => {}} // Error is handled internally by the form
        />
      </PermissionGuard>

      <ErrorAlert error={error} />
      <SuccessAlert message={success} onClose={() => setSuccess('')} />

      {loading ? (
        <LoadingSpinner message="Loading campaigns..." />
      ) : (
        <div className="overflow-x-auto bg-white border border-gray-300">
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
                <CampaignRow
                  key={campaign.id}
                  campaign={campaign}
                  companies={companies}
                  contractors={filteredContractors}
                  token={token}
                  editingId={editingId}
                  assigningId={assigningId}
                  onEditStart={handleEditStart}
                  onEditComplete={handleEditComplete}
                  onAssignStart={handleAssignStart}
                  onAssignComplete={handleAssignComplete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default EmployeeCampaignManagement;
