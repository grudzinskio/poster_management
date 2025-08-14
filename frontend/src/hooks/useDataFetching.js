// frontend/src/hooks/useDataFetching.js
// Custom hook for common data fetching patterns

import { useState, useEffect } from 'react';

/**
 * Custom hook for fetching data from API endpoints
 * @param {string} endpoint - API endpoint to fetch from
 * @param {string} token - Authentication token
 * @returns {Object} { data, loading, error, refetch, setData }
 */
export const useDataFetching = (endpoint, token) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    if (!token || !endpoint) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`http://localhost:3001/api${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [endpoint, token]);

  return { 
    data, 
    setData, 
    loading, 
    error, 
    refetch: fetchData 
  };
};

/**
 * Custom hook for fetching multiple endpoints in parallel
 * @param {Array} endpoints - Array of endpoint strings
 * @param {string} token - Authentication token
 * @returns {Object} { data, loading, error, refetch }
 */
export const useMultipleDataFetching = (endpoints, token) => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    if (!token || !endpoints.length) return;
    
    setLoading(true);
    setError('');
    
    try {
      const promises = endpoints.map(async (endpoint) => {
        const response = await fetch(`http://localhost:3001/api${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
      });

      const results = await Promise.all(promises);
      
      const dataObject = {};
      endpoints.forEach((endpoint, index) => {
        const key = endpoint.split('/').pop() || `data${index}`;
        dataObject[key] = results[index] || [];
      });
      
      setData(dataObject);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [JSON.stringify(endpoints), token]);

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchData 
  };
};
