// frontend/src/components/employee/CampaignRow.jsx
// Table row component for displaying and editing campaigns

import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { formatDate, getStatusDisplay } from '../../utils/formatters';
import Permission from '../Permission';
import ContractorAssignment from './ContractorAssignment';
import CampaignImages from '../CampaignImages';

function CampaignRow({ 
  campaign, 
  companies, 
  contractors, 
  token, 
  editingId, 
  assigningId, 
  onEditStart, 
  onEditComplete, 
  onAssignStart, 
  onAssignComplete 
}) {
  const [editData, setEditData] = useState({
    name: campaign.name,
    description: campaign.description,
    start_date: campaign.start_date?.split('T')[0] || '',
    end_date: campaign.end_date?.split('T')[0] || '',
    company_id: campaign.company_id,
    status: campaign.status
  });

  const [showImages, setShowImages] = useState(false);
  const { put, error, setError } = useApi(token);

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSaveEdit = async () => {
    setError('');
    // Ensure name and description are present
    if (!editData.name || !editData.description) {
      setError('Name and description are required.');
      return;
    }
    try {
      await put(`/campaigns/${campaign.id}`, editData);
      onEditComplete('Campaign updated successfully!');
    } catch (err) {
      // Show backend error if available
      if (err && err.message) {
        setError(err.message);
      } else {
        setError('Failed to update campaign.');
      }
      console.error('Error updating campaign:', err);
    }
  };

  const isEditing = editingId === campaign.id;
  const isAssigning = assigningId === campaign.id;

  if (isEditing) {
    return (
      <>
        {/* Show error if present */}
        {error && (
          <tr>
            <td colSpan="8" className="table-cell text-red-600 bg-red-50 p-2">
              {error}
            </td>
          </tr>
        )}
        <tr className="editing-row">
          <td className="table-cell">{campaign.id}</td>
          <td className="table-cell">
            <input
              type="text"
              name="name"
              value={editData.name}
              onChange={handleEditChange}
              className="form-input-sm"
            />
          </td>
          <td className="table-cell">
            <select
              name="company_id"
              value={editData.company_id}
              onChange={handleEditChange}
              className="form-input-sm"
            >
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </td>
          <td className="table-cell">
            <textarea
              name="description"
              value={editData.description}
              onChange={handleEditChange}
              className="form-input-sm"
              rows="2"
            />
          </td>
          <td className="table-cell">
            <input
              type="date"
              name="start_date"
              value={editData.start_date}
              onChange={handleEditChange}
              className="form-input-sm"
            />
          </td>
          <td className="table-cell">
            <input
              type="date"
              name="end_date"
              value={editData.end_date}
              onChange={handleEditChange}
              className="form-input-sm"
            />
          </td>
          <td className="table-cell">
            <select
              name="status"
              value={editData.status}
              onChange={handleEditChange}
              className="form-input-sm"
            >
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </td>
          <td className="table-cell">
            <div className="flex flex-wrap gap-1">
              <button
                onClick={handleSaveEdit}
                className="btn-success text-xs"
              >
                Save
              </button>
              <button
                onClick={() => onEditComplete()}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
            </div>
          </td>
        </tr>
        {isAssigning && (
          <tr>
            <td colSpan="8" className="table-cell p-0">
              <ContractorAssignment
                campaign={campaign}
                contractors={contractors}
                token={token}
                onAssignmentComplete={onAssignComplete}
                onCancel={() => onAssignComplete()}
              />
            </td>
          </tr>
        )}
      </>
    );
  }

  return (
    <>
      <tr className="table-row">
        <td className="table-cell">{campaign.id}</td>
        <td className="table-cell font-medium">{campaign.name}</td>
        <td className="table-cell">{campaign.company_name}</td>
        <td className="table-cell max-w-xs truncate" title={campaign.description}>
          {campaign.description}
        </td>
        <td className="table-cell">{formatDate(campaign.start_date)}</td>
        <td className="table-cell">{formatDate(campaign.end_date)}</td>
        <td className="table-cell">
          <span className={`status-badge status-${campaign.status}`}>
            {getStatusDisplay(campaign.status)}
          </span>
        </td>
        <td className="table-cell">
          <div className="flex flex-wrap gap-1">
            <Permission permission="edit_campaign">
              <button
                onClick={() => onEditStart(campaign.id)}
                className="btn-primary text-xs"
              >
                Edit
              </button>
            </Permission>
            <Permission permission="assign_campaign">
              <button
                onClick={() => onAssignStart(campaign.id)}
                className="btn-secondary text-xs"
              >
                Assign
              </button>
            </Permission>
            <Permission permission="view_campaigns">
              <button
                onClick={() => setShowImages(!showImages)}
                className="bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700 transition-colors"
                title={showImages ? "Hide Images" : "View Images"}
              >
                {showImages ? '👁️‍🗨️ Hide' : '📷 Images'}
              </button>
            </Permission>
          </div>
        </td>
      </tr>
      
      {/* Images expansion row */}
      {showImages && (
        <tr>
          <td colSpan="8" className="p-4 bg-gray-50 border-t border-gray-300">
            <CampaignImages campaignId={campaign.id} token={token} />
          </td>
        </tr>
      )}
      
      {/* Contractor assignment row */}
      {isAssigning && (
        <tr>
          <td colSpan="8" className="table-cell p-0">
            <ContractorAssignment
              campaign={campaign}
              contractors={contractors}
              token={token}
              onAssignmentComplete={onAssignComplete}
              onCancel={() => onAssignComplete()}
            />
          </td>
        </tr>
      )}
    </>
  );
}

export default CampaignRow;