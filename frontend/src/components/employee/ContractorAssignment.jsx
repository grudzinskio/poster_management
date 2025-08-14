// frontend/src/components/employee/ContractorAssignment.jsx
// Component for assigning contractors to campaigns

import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import ErrorAlert from '../ui/ErrorAlert';

function ContractorAssignment({ 
  campaign, 
  contractors, 
  token, 
  onAssignmentComplete, 
  onCancel 
}) {
  const [selectedContractors, setSelectedContractors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  
  const { post, error, setError } = useApi(token);

  const handleContractorSelection = (contractorId) => {
    setSelectedContractors(prev => {
      if (prev.includes(contractorId)) {
        return prev.filter(id => id !== contractorId);
      } else {
        return [...prev, contractorId];
      }
    });
  };

  const handleSaveAssignment = async () => {
    if (selectedContractors.length === 0) {
      setError('Please select at least one contractor');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      await post(`/campaigns/${campaign.id}/assign`, { 
        contractor_ids: selectedContractors 
      });
      onAssignmentComplete('Contractors assigned successfully!');
    } catch (err) {
      console.error('Error assigning contractors:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 p-4 border border-gray-200 bg-gray-50">
      <h5 className="font-medium text-gray-900 mb-3">
        Assign Contractors to: {campaign.name}
      </h5>
      
      <ErrorAlert error={error} onClose={() => setError('')} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-4 max-h-48 overflow-y-auto p-2 border border-gray-200">
        {contractors.map(contractor => (
          <label 
            key={contractor.id} 
            className="flex items-center space-x-2 p-2 hover:bg-white rounded cursor-pointer"
          >
            <input
              type="checkbox"
              className="form-checkbox"
              checked={selectedContractors.includes(contractor.id)}
              onChange={() => handleContractorSelection(contractor.id)}
              disabled={submitting}
            />
            <span className="text-sm text-gray-900">
              {contractor.username} ({contractor.company_name || 'No Company'})
            </span>
          </label>
        ))}
      </div>
      
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleSaveAssignment}
          className="btn-success text-sm"
          disabled={selectedContractors.length === 0 || submitting}
        >
          {submitting ? 'Assigning...' : 'Assign Contractors'}
        </button>
        <button
          onClick={onCancel}
          className="btn-secondary text-sm"
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default ContractorAssignment;
