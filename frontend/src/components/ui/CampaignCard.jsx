// frontend/src/components/ui/CampaignCard.jsx
// Reusable campaign card component

import React from 'react';
import { formatDate, getStatusDisplay, getStatusClass } from '../../utils/formatters';

/**
 * Campaign card component for displaying campaign information
 * @param {Object} props
 * @param {Object} props.campaign - Campaign object
 * @param {React.ReactNode} props.children - Additional content (buttons, etc.)
 * @param {Function} props.onClick - Optional click handler for the card
 * @param {string} props.className - Additional CSS classes
 */
function CampaignCard({ 
  campaign, 
  children, 
  onClick, 
  className = '' 
}) {
  const cardClasses = `
    bg-white border border-gray-200 rounded-lg p-6 shadow-sm 
    hover:shadow-md transition-shadow duration-200 
    ${onClick ? 'cursor-pointer' : ''} 
    ${className}
  `.trim();

  return (
    <div className={cardClasses} onClick={onClick}>
      <h5 className="text-lg font-semibold text-gray-900 mb-2">
        {campaign.name}
      </h5>
      
      <div className={`${getStatusClass(campaign.status)} mb-4`}>
        {getStatusDisplay(campaign.status)}
      </div>
      
      {campaign.description && (
        <div className="text-gray-600 mb-4 line-clamp-3">
          {campaign.description}
        </div>
      )}
      
      <div className="space-y-1 text-sm text-gray-500 mb-4">
        {campaign.company_name && (
          <div>
            <span className="font-medium text-gray-700">Company:</span> {campaign.company_name}
          </div>
        )}
        <div>
          <span className="font-medium text-gray-700">Start:</span> {formatDate(campaign.start_date)}
        </div>
        <div>
          <span className="font-medium text-gray-700">End:</span> {formatDate(campaign.end_date)}
        </div>
        {campaign.total_images !== undefined && (
          <div>
            <span className="font-medium text-gray-700">Images:</span> {campaign.approved_images || 0} / {campaign.total_images}
          </div>
        )}
      </div>
      
      {children && (
        <div className="flex flex-wrap gap-2">
          {children}
        </div>
      )}
    </div>
  );
}

export default CampaignCard;
