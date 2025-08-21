import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useDataFetching } from '../hooks/useDataFetching';
import { formatDate, getStatusDisplay } from '../utils/formatters';
import LoadingSpinner from './ui/LoadingSpinner';
import ErrorAlert from './ui/ErrorAlert';
import CampaignCard from './ui/CampaignCard';

function ContractorCampaignManagement({ token }) {
  const [completedCampaigns, setCompletedCampaigns] = useState([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});

  const { get, put, post, error: apiError, setError: setApiError } = useApi(token);

  // Use custom hook for active campaigns
  const {
    data: campaigns,
    loading: campaignsLoading,
    error: fetchError,
    refetch: refetchCampaigns
  } = useDataFetching('/campaigns/contractor', token);

  const error = apiError || fetchError;

  // Keep manual fetching for completed campaigns since it's conditional
  const [completedLoading, setCompletedLoading] = useState(false);

  // Fetch completed campaigns
  const fetchCompletedCampaigns = async () => {
    setCompletedLoading(true);
    setApiError('');
    try {
      const data = await get('/campaigns/completed');
      setCompletedCampaigns(data);
    } catch {
      // Error fetching completed campaigns
    } finally {
      setCompletedLoading(false);
    }
  };

  useEffect(() => {
    if (showCompleted) {
      fetchCompletedCampaigns();
    }
    // Active campaigns are automatically fetched by useDataFetching hook
  }, [showCompleted]);

  // Status update handler
  const handleStatusUpdate = async (campaignId, currentStatus) => {
    let nextStatus = null;
    if (currentStatus === 'approved') nextStatus = 'in_progress';
    else if (currentStatus === 'in_progress') nextStatus = 'completed';
    if (!nextStatus) return;

    try {
      await put(`/campaigns/${campaignId}/contractor-status`, { status: nextStatus });
      refetchCampaigns(); // Use refetch from custom hook
    } catch {
      setApiError('Failed to update status');
    }
  };

  // Image upload handler
  // Allow adding files to selection without resetting
  const handleFileChange = (campaignId, files) => {
    setSelectedFiles(prev => {
      const prevFiles = prev[campaignId] ? Array.from(prev[campaignId]) : [];
      // Avoid duplicates by name (can be improved for real-world use)
      const newFiles = Array.from(files);
      const combined = [...prevFiles, ...newFiles].filter((file, idx, arr) => arr.findIndex(f => f.name === file.name) === idx);
      return { ...prev, [campaignId]: combined };
    });
  };
  // Remove a file from selectedFiles
  const handleRemoveSelectedFile = (campaignId, fileName) => {
    setSelectedFiles(prev => {
      const files = Array.from(prev[campaignId] || []);
      const filtered = files.filter(f => f.name !== fileName);
      return { ...prev, [campaignId]: filtered };
    });
  };


  const handleUpload = async (campaignId) => {
    if (!selectedFiles[campaignId] || selectedFiles[campaignId].length === 0) return;

    setUploading(true);
    setApiError('');

    try {
      const formData = new FormData();
      const filesToUpload = selectedFiles[campaignId];

      // Add files to FormData
      Array.from(filesToUpload).forEach(file => {
        formData.append('images', file);
      });

      // Remove the headers parameter - let useApi handle it
      await post(`/campaigns/${campaignId}/images`, formData);

      // Reset selected files and file input
      setSelectedFiles(prev => ({ ...prev, [campaignId]: [] }));
      document.getElementById(`file-upload-${campaignId}`).value = '';

      // Add uploaded files to uploadedFiles state (use the files we just uploaded)
      setUploadedFiles(prev => {
        const prevFiles = prev[campaignId] || [];
        return {
          ...prev,
          [campaignId]: [...prevFiles, ...filesToUpload]
        };
      });

      refetchCampaigns();
    } catch (err) {
      console.error('Upload error:', err);
      setApiError('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const loading = showCompleted ? completedLoading : campaignsLoading;
  // const displayCampaigns = showCompleted ? completedCampaigns : campaigns;

  return (
    <div className="bg-white p-6 shadow-sm border border-gray-300">
      <h3 className="text-2xl font-bold text-gray-900 border-b-2 border-blue-600 pb-2 mb-6">
        My Assigned Campaigns
      </h3>
      <div className="mb-4 flex gap-2">
        <button
          className={`btn ${!showCompleted ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowCompleted(false)}
        >
          Current Campaigns
        </button>
        <button
          className={`btn ${showCompleted ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowCompleted(true)}
        >
          Completed Campaigns
        </button>
      </div>
      <ErrorAlert error={error} onClose={() => { setApiError(''); }} />
      {loading ? (
        <LoadingSpinner message="Loading campaigns..." />
      ) : showCompleted ? (
        completedCampaigns.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No completed campaigns yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedCampaigns.map((campaign) => (
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
                  <div><span className="font-medium text-gray-700">Approved Images:</span> {campaign.approved_images} / {campaign.total_images}</div>
                </div>
              </div>
            ))}
          </div>
        )
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
              <div className="space-y-1 text-sm text-gray-500 mb-2">
                <div><span className="font-medium text-gray-700">Company:</span> {campaign.company_name}</div>
                <div><span className="font-medium text-gray-700">Start:</span> {formatDate(campaign.start_date)}</div>
                <div><span className="font-medium text-gray-700">End:</span> {formatDate(campaign.end_date)}</div>
              </div>
              {/* Status update button */}
              {(campaign.status === 'approved' || campaign.status === 'in_progress') && (
                <button
                  className="btn btn-success mb-2"
                  onClick={() => handleStatusUpdate(campaign.id, campaign.status)}
                >
                  {campaign.status === 'approved' ? 'Start Campaign' : 'Mark as Completed'}
                </button>
              )}
              {/* Image upload */}
              <div className="mb-2">
                <input
                  type="file"
                  multiple
                  id={`file-upload-${campaign.id}`}
                  style={{ display: 'none' }}
                  onChange={e => handleFileChange(campaign.id, e.target.files)}
                  disabled={uploading}
                />
                <button
                  type="button"
                  className="btn btn-secondary mr-2"
                  onClick={() => document.getElementById(`file-upload-${campaign.id}`).click()}
                  disabled={uploading}
                >
                  Choose Files
                </button>
                {/* Show selected file names */}
                {selectedFiles[campaign.id] && selectedFiles[campaign.id].length > 0 && (
                  <div className="mt-2 text-sm text-gray-700">
                    <div className="font-semibold">Selected files:</div>
                    {Array.from(selectedFiles[campaign.id]).map((file, idx) => (
                      <div key={idx} className="inline-block mr-2 mb-1 cursor-pointer bg-gray-200 px-2 py-1 rounded hover:bg-red-200" title="Click to remove"
                        onClick={() => handleRemoveSelectedFile(campaign.id, file.name)}>
                        {file.name} <span className="text-red-500 font-bold">×</span>
                      </div>
                    ))}
                  </div>
                )}
                {/* Show uploaded file names for this session */}
                {uploadedFiles[campaign.id] && uploadedFiles[campaign.id].length > 0 && (
                  <div className="mt-2 text-sm text-green-700">
                    <div className="font-semibold">Uploaded this session:</div>
                    {uploadedFiles[campaign.id].map((file, idx) => (
                      <div key={idx}>{file.name}</div>
                    ))}
                  </div>
                )}
                <button
                  className="btn btn-primary mt-2"
                  onClick={() => handleUpload(campaign.id)}
                  disabled={uploading || !selectedFiles[campaign.id]}
                >
                  {uploading ? 'Uploading...' : 'Upload Images'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ContractorCampaignManagement;