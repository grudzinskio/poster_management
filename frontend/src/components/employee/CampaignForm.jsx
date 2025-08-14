// frontend/src/components/employee/CampaignForm.jsx
// Form component for creating/editing campaigns

import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { CampaignCreateButton } from '../Permission';
import ErrorAlert from '../ui/ErrorAlert';
import SuccessAlert from '../ui/SuccessAlert';

function CampaignForm({ 
  token, 
  companies, 
  onCampaignCreated, 
  onSuccess, 
  onError 
}) {
  const [submitting, setSubmitting] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    company_id: ''
  });

  const { post, error, setError } = useApi(token);

  const handleInputChange = (e) => {
    setNewCampaign({ ...newCampaign, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!newCampaign.name || !newCampaign.description || !newCampaign.company_id) {
      setError('Name, description, and company are required');
      return;
    }

    if (newCampaign.start_date && newCampaign.end_date && 
        new Date(newCampaign.start_date) >= new Date(newCampaign.end_date)) {
      setError('End date must be after start date');
      return;
    }

    setSubmitting(true);
    setError('');
    
    try {
      const data = await post('/campaigns', newCampaign);
      setNewCampaign({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        company_id: ''
      });
      onSuccess('Campaign created successfully!');
      onCampaignCreated(data);
    } catch (err) {
      onError(err.message || 'Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-6 mb-8 border border-gray-300">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Create New Campaign</h4>
      
      <ErrorAlert error={error} onClose={() => setError('')} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="name" className="form-label">Campaign Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={newCampaign.name}
            onChange={handleInputChange}
            placeholder="Enter campaign name"
            required
            className="form-input"
            disabled={submitting}
          />
        </div>
        
        <div>
          <label htmlFor="company_id" className="form-label">Company *</label>
          <select
            id="company_id"
            name="company_id"
            value={newCampaign.company_id}
            onChange={handleInputChange}
            required
            className="form-input"
            disabled={submitting}
          >
            <option value="">Select a company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="description" className="form-label">Description *</label>
        <textarea
          id="description"
          name="description"
          value={newCampaign.description}
          onChange={handleInputChange}
          placeholder="Enter campaign description"
          rows="3"
          required
          className="form-input"
          disabled={submitting}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="start_date" className="form-label">Start Date</label>
          <input
            type="date"
            id="start_date"
            name="start_date"
            value={newCampaign.start_date}
            onChange={handleInputChange}
            className="form-input"
            disabled={submitting}
          />
        </div>
        
        <div>
          <label htmlFor="end_date" className="form-label">End Date</label>
          <input
            type="date"
            id="end_date"
            name="end_date"
            value={newCampaign.end_date}
            onChange={handleInputChange}
            className="form-input"
            disabled={submitting}
          />
        </div>
      </div>

      <CampaignCreateButton 
        type="submit" 
        disabled={submitting}
      >
        {submitting ? 'Creating...' : 'Create Campaign'}
      </CampaignCreateButton>
    </form>
  );
}

export default CampaignForm;
