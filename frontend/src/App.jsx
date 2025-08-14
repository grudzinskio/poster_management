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
import RoleManagement from './components/RoleManagement';
import ClientCampaignManagement from './components/ClientCampaignManagement';
import EmployeeCampaignManagement from './components/EmployeeCampaignManagement';
import ContractorCampaignManagement from './components/ContractorCampaignManagement';
import SimplePermissionBox from './components/SimplePermissionBox';
import PermissionGuard from './components/PermissionGuard';
import { SimplePermissionsProvider, useSimplePermissions } from './hooks/useSimplePermissions.jsx';
import './App.css';

function AppContent({ onTokenChange }) {
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

  // Get permissions context
  const { hasPermission } = useSimplePermissions();

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
    onTokenChange(loginData.token); // Update parent component's token
    setShowLogin(false);
  };

  // Helper function to check if user has a specific role
  const hasRole = (roleName) => {
    return user && user.roles && user.roles.some(role => 
      typeof role === 'string' ? role === roleName : role.name === roleName
    );
  };

  // Helper function to get role names as string
  const getRoleNames = () => {
    if (!user || !user.roles) return 'No roles';
    return user.roles.map(role => 
      typeof role === 'string' ? role : role.name
    ).join(', ');
  };

  // Set default tab based on permissions
  useEffect(() => {
    if (user && !showLogin) {
      // Priority order: campaigns, users, companies, roles
      if (hasPermission('view_campaigns')) {
        setActiveTab('campaigns');
      } else if (hasPermission('view_users')) {
        setActiveTab('users');
      } else if (hasPermission('view_companies')) {
        setActiveTab('companies');
      } else if (hasPermission('manage_roles')) {
        setActiveTab('roles');
      }
    }
  }, [user, showLogin, hasPermission]);

  /**
   * Event Handler: User Logout
   * 
   * Clears all authentication state and returns to login screen
   * Security best practice: Clear all sensitive data from memory
   */
  const handleLogout = () => {
    setUser(null);
    setToken(null);
    onTokenChange(null); // Clear parent component's token
    setError(null);
    setShowLogin(true);
    setActiveTab('campaigns');
  };

  // Conditional Rendering: Show login screen if not authenticated
  if (showLogin) {
    return <Login onLogin={handleLogin} />;
  }

  // Main Application UI - Permission-Based Interface
  return (
    <div className="app-background min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Application Header - Common for all authenticated users */}
      <header className="flex justify-between items-center py-4 border-b border-gray-200 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Poster Campaigns</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Welcome, {user.username} ({user.user_type || 'unknown'}) - {getRoleNames()}
            {user.company_name && ` - ${user.company_name}`}
          </span>
          <SimplePermissionBox />
          <button onClick={handleLogout} className="inline-flex items-center justify-center px-3 py-1.5 text-sm border border-transparent rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-red-600 text-white hover:bg-red-700 focus:ring-red-500">
            Logout
          </button>
        </div>
      </header>

      {/* Permission Status Box - Removed since it's now in header */}

      <main>
        {/* Permission-Based Navigation */}
        {/* Show navigation tabs if user has any management permissions */}
        <PermissionGuard permission={["view_campaigns", "view_users", "view_companies", "manage_roles"]}>
          <div className="flex gap-4 mb-8 border-b border-gray-200">
            {/* Show campaigns tab if user has campaign permissions */}
            <PermissionGuard permission="view_campaigns">
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
            </PermissionGuard>
            {/* Show user management tab only if user has permission */}
            <PermissionGuard permission="view_users">
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
            </PermissionGuard>
            {/* Show company management tab only if user has permission */}
            <PermissionGuard permission="view_companies">
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
            </PermissionGuard>
            {/* Show role management tab only if user has manage_roles permission */}
            <PermissionGuard permission="manage_roles">
              <button 
                className={`px-6 py-3 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'roles' 
                    ? 'border-blue-600 text-blue-600 bg-blue-50' 
                    : 'border-transparent text-gray-500 hover:text-blue-600 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('roles')}
              >
                Role Management
              </button>
            </PermissionGuard>
          </div>
        </PermissionGuard>

        {/* Management Interfaces Based on Permissions */}
        <PermissionGuard permission="view_users">
          {activeTab === 'users' && <UserManagement token={token} />}
        </PermissionGuard>
        
        <PermissionGuard permission="view_companies">
          {activeTab === 'companies' && <CompanyManagement token={token} />}
        </PermissionGuard>

        {/* Role Management - Permission-based access */}
        <PermissionGuard permission="manage_roles">
          {activeTab === 'roles' && <RoleManagement token={token} />}
        </PermissionGuard>
        
        {/* Employee Campaign Management - Permission-based access */}
        <PermissionGuard permission="view_campaigns">
          {activeTab === 'campaigns' && !hasRole('client') && !hasRole('contractor') && (
            <EmployeeCampaignManagement token={token} user={user} />
          )}
        </PermissionGuard>
        
        {/* Client Interface - Role-based since it's specific business logic */}
        {hasRole('client') && <ClientCampaignManagement token={token} user={user} />}
        
        {/* Contractor Interface - Role-based since it's specific business logic */}
        {hasRole('contractor') && <ContractorCampaignManagement token={token} user={user} />}

        {/* Fallback for users without any permissions */}
        {!hasPermission('view_campaigns') && 
         !hasPermission('view_users') && 
         !hasPermission('view_companies') && 
         !hasPermission('manage_roles') && 
         !hasRole('client') && 
         !hasRole('contractor') && (
          <div className="bg-white p-6 shadow-sm border border-gray-300 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-600">
              You don't have permissions to access any management functions. 
              Please contact your administrator to request appropriate permissions.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(null);
  
  return (
    <SimplePermissionsProvider token={token}>
      <AppContent onTokenChange={setToken} />
    </SimplePermissionsProvider>
  );
}

export default App;