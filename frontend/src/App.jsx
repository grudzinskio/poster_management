// frontend/src/App.jsx

/**
 * Main App Component - Poster Campaign Management System
 * 
 * This component serves as the root of the application and manages:
 * - User authentication and authorization
 * - Role-based navigation and component rendering
 * - API communication with the backend server
 * - Global state management for campaigns and user data
 * 
 * Technologies Used:
 * - React 18 with Hooks (useState, useEffect)
 * - Fetch API for HTTP requests
 * - JWT Token-based authentication
 * - Role-based access control (employee vs client)
 */

import { useState, useEffect } from 'react';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import CompanyManagement from './components/CompanyManagement';
import ClientCampaignManagement from './components/ClientCampaignManagement';
import './App.css';

function App() {
  // Global State Management
  // campaigns: Array of campaign objects fetched from the API
  const [campaigns, setCampaigns] = useState([]);
  // error: Error message to display when API calls fail
  const [error, setError] = useState(null);
  // user: Current authenticated user object containing username, role, company_name
  const [user, setUser] = useState(null);
  // token: JWT authentication token for API requests
  const [token, setToken] = useState(null);
  // showLogin: Boolean to control login/main app view
  const [showLogin, setShowLogin] = useState(true);
  // activeTab: Controls which management interface is displayed for employees
  const [activeTab, setActiveTab] = useState('campaigns');

  /**
   * API Function: Fetch Campaigns
   * 
   * Communicates with backend endpoint: GET http://localhost:3001/api/campaigns
   * 
   * Authentication: Uses JWT Bearer token in Authorization header
   * 
   * API Response Format:
   * - Success: Array of campaign objects with id, name, company_name, status, description
   * - Error: HTTP error status codes (401 for unauthorized, 500 for server errors)
   * 
   * @param {string} authToken - JWT token for authentication
   */
  const fetchCampaigns = async (authToken) => {
    try {
      const response = await fetch('http://localhost:3001/api/campaigns', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }

      const data = await response.json();
      setCampaigns(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setError(error.message);
    }
  };

  /**
   * React Hook: Effect for Campaign Data Loading
   * 
   * Automatically fetches campaign data when user successfully logs in
   * Dependency array [user, token] ensures this runs when either changes
   * 
   * API Integration Flow:
   * 1. User logs in successfully → user and token state updated
   * 2. This effect triggers → calls fetchCampaigns with the new token
   * 3. Backend validates JWT token and returns campaigns based on user role
   */
  useEffect(() => {
    if (user && token) {
      fetchCampaigns(token);
    }
  }, [user, token]);

  /**
   * Event Handler: Successful Login
   * 
   * Called by Login component when authentication succeeds
   * Updates global state with user data and JWT token
   * 
   * @param {Object} loginData - Object containing user info and JWT token
   * @param {Object} loginData.user - User object with username, role, company_name
   * @param {string} loginData.token - JWT authentication token
   */
  const handleLogin = (loginData) => {
    setUser(loginData.user);
    setToken(loginData.token);
    setShowLogin(false);
  };

  /**
   * Event Handler: User Logout
   * 
   * Clears all authentication state and returns to login screen
   * Security best practice: Clear all sensitive data from memory
   */
  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setCampaigns([]);
    setError(null);
    setShowLogin(true);
    setActiveTab('campaigns');
  };

  // Conditional Rendering: Show login screen if not authenticated
  if (showLogin) {
    return <Login onLogin={handleLogin} />;
  }

  // Main Application UI - Role-Based Interface
  return (
    <div className="app-container">
      {/* Application Header - Common for all authenticated users */}
      <header className="app-header">
        <h1>Poster Campaigns</h1>
        <div className="user-info">
          <span>
            Welcome, {user.username} ({user.role})
            {user.company_name && ` - ${user.company_name}`}
          </span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <main>
        {/* Employee-Only Navigation Tabs */}
        {/* Role-Based Access Control: Only employees can manage users and companies */}
        {user.role === 'employee' && (
          <div className="employee-tabs">
            <button 
              className={`tab-button ${activeTab === 'campaigns' ? 'active' : ''}`}
              onClick={() => setActiveTab('campaigns')}
            >
              Campaigns
            </button>
            <button 
              className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              User Management
            </button>
            <button 
              className={`tab-button ${activeTab === 'companies' ? 'active' : ''}`}
              onClick={() => setActiveTab('companies')}
            >
              Company Management
            </button>
          </div>
        )}

        {/* Employee Management Interfaces */}
        {/* Each component handles its own API communication using the shared JWT token */}
        {user.role === 'employee' && activeTab === 'users' && <UserManagement token={token} />}
        {user.role === 'employee' && activeTab === 'companies' && <CompanyManagement token={token} />}
        
        {/* Client Interface */}
        {/* Clients see only their own campaigns and cannot manage users/companies */}
        {user.role === 'client' && <ClientCampaignManagement token={token} user={user} />}
        
        {/* Employee Campaigns Display */}
        {/* Shows all campaigns across all companies - data fetched from /api/campaigns */}
        {user.role === 'employee' && activeTab === 'campaigns' && (
          <>
            {error ? (
              <div className="error">Error: {error}</div>
            ) : (
              <div className="campaigns-list">
                <h2>All Campaigns</h2>
                {campaigns.length === 0 ? (
                  <p>No campaigns found.</p>
                ) : (
                  <ul>
                    {/* Campaign data structure from API: id, name, company_name, status, description */}
                    {campaigns.map((campaign) => (
                      <li key={campaign.id}>
                        <strong>{campaign.name}</strong> for {campaign.company_name || 'Unknown Company'}
                        <div>Status: {campaign.status}</div>
                        {campaign.description && <div>{campaign.description}</div>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;