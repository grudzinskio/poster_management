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
import EmployeeCampaignManagement from './components/EmployeeCampaignManagement';
import ContractorCampaignManagement from './components/ContractorCampaignManagement';
import './App.css';

function App() {
  // Global State Management
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
    <div className="app-background min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Application Header - Common for all authenticated users */}
      <header className="flex justify-between items-center py-4 border-b border-gray-200 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Poster Campaigns</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Welcome, {user.username} ({user.user_type}) - {user.roles ? user.roles.join(', ') : 'No roles'}
            {user.company_name && ` - ${user.company_name}`}
          </span>
          <button onClick={handleLogout} className="inline-flex items-center justify-center px-3 py-1.5 text-sm border border-transparent rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-red-600 text-white hover:bg-red-700 focus:ring-red-500">
            Logout
          </button>
        </div>
      </header>

      <main>
        {/* Employee-Only Navigation Tabs */}
        {/* Role-Based Access Control: Employees and managers can manage users and companies */}
        {user.user_type === 'employee' && (
          <div className="flex gap-4 mb-8 border-b border-gray-200">
            <button 
              className={`px-6 py-3 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'campaigns' 
                  ? 'border-blue-600 text-blue-600 bg-blue-50' 
                  : 'border-transparent text-gray-500 hover:text-blue-600 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('campaigns')}
            >
              Campaigns
            </button>
            <button 
              className={`px-6 py-3 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'users' 
                  ? 'border-blue-600 text-blue-600 bg-blue-50' 
                  : 'border-transparent text-gray-500 hover:text-blue-600 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('users')}
            >
              User Management
            </button>
            <button 
              className={`px-6 py-3 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'companies' 
                  ? 'border-blue-600 text-blue-600 bg-blue-50' 
                  : 'border-transparent text-gray-500 hover:text-blue-600 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('companies')}
            >
              Company Management
            </button>
          </div>
        )}

        {/* Employee Management Interfaces */}
        {/* Each component handles its own API communication using the shared JWT token */}
        {user.user_type === 'employee' && activeTab === 'users' && <UserManagement token={token} />}
        {user.user_type === 'employee' && activeTab === 'companies' && <CompanyManagement token={token} />}
        {user.user_type === 'employee' && activeTab === 'campaigns' && <EmployeeCampaignManagement token={token} user={user} />}
        
        {/* Client Interface */}
        {user.user_type === 'client' && <ClientCampaignManagement token={token} user={user} />}
        
        {/* Contractor Interface */}
        {user.user_type === 'contractor' && <ContractorCampaignManagement token={token} user={user} />}
      </main>
    </div>
  );
}

export default App;