// frontend/src/hooks/useApi.js

import { useState } from 'react';

export const useApi = (token = null) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const apiCall = async (url, options = {}) => {
    setLoading(true);
    setError('');
    
    try {
      const headers = {
        ...options.headers,
      };
      
      // Only set Content-Type if not already specified and not FormData
      if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }
      
      // Only add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://localhost:3001/api${url}`, {
        headers,
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle empty responses (like DELETE requests)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return null;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const get = (url) => apiCall(url);
  
  const post = (url, data, options = {}) => {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return apiCall(url, {
      method: 'POST',
      body,
      ...options,
    });
  };
  
  const put = (url, data, options = {}) => {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return apiCall(url, {
      method: 'PUT',
      body,
      ...options,
    });
  };
  
  const del = (url) => apiCall(url, {
    method: 'DELETE',
  });

  return { 
    apiCall, 
    get, 
    post, 
    put, 
    del, 
    loading, 
    error, 
    setError 
  };
};

// Usage example for uploading images
// await post(`/campaigns/${campaignId}/images`, formData);
