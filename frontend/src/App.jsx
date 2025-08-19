// frontend/src/App.jsx

/**
 * Main App Component - Poster Campaign Management System
 * 
 * This component serves as the root of the application and manages:
 * - User authentication and authorization using new User system
 * - Role-based navigation and component rendering
 * - API communication with the backend server
 * - Global state management for campaigns and user data
 * - Emphasizes User.user.can() method and permissions array for visual display
 * 
 * Technologies Used:
 * - React 18 with Hooks (useState, useEffect)
 * - Fetch API for HTTP requests
 * - JWT Token-based authentication
 * - DRY permission system with User.user.can() pattern
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
import { PermissionGuard } from './components/Permission';
import { UserProvider, useUserPermissions } from './hooks/useUser.jsx';
import './App.css';

function AppContent({ onTokenChange }) {
  // Global State Management
  // basicUser: Basic user data from token for display purposes
  const [basicUser, setBasicUser] = useState(null);
  // token: JWT authentication token for API requests
  const [token, setToken] = useState(null);
  // showLogin: Boolean to control login/main app view
  const [showLogin, setShowLogin] = useState(true);
  // activeTab: Controls which management interface is displayed for employees
  const [activeTab, setActiveTab] = useState('campaigns');

  // Get permissions context using new User system - emphasizes User.user.can() method
  const { user, can } = useUserPermissions();

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
    setBasicUser(loginData.user);
    setToken(loginData.token);
    onTokenChange(loginData.token); // Update parent component's token
    setShowLogin(false);
  };

  // Helper function to check if user has a specific role - uses User.user.hasRole() pattern
  const hasRole = (roleName) => {
    return user?.hasRole(roleName) ?? false;
  };

  // Helper function to get role names as human-readable string
  const getRoleNames = () => {
    if (!user || !user.roles) return 'No roles';
    if (Array.isArray(user.roles)) {
      return user.roles.map(role => {
        // If role is an object, try to use .name or .description
        if (typeof role === 'object' && role !== null) {
          if (role.description) return role.description;
          if (role.name) return String(role.name).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          return JSON.stringify(role);
        }
        if (typeof role === 'string') {
          // Try to use user.getRoleDisplayName if available
          if (typeof user.getRoleDisplayName === 'function') {
            return user.getRoleDisplayName(role);
          }
          return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
        return String(role);
      }).join(', ');
    }
    return String(user.roles);
  }

  // Set default tab based on permissions using User.user.can() method
  useEffect(() => {
    if (user && !showLogin) {
      // Priority order: campaigns, users, companies, roles
      if (user.can('view_campaigns')) {
        setActiveTab('campaigns');
      } else if (user.can('view_users')) {
        setActiveTab('users');
      } else if (user.can('view_companies')) {
        setActiveTab('companies');
      } else if (user.can('manage_roles')) {
        setActiveTab('roles');
      }
    }
  }, [user, showLogin]);

  /**
   * Event Handler: User Logout
   * 
   * Clears all authentication state and returns to login screen
   * Security best practice: Clear all sensitive data from memory
   */
  const handleLogout = () => {
    setBasicUser(null);
    setToken(null);
    onTokenChange(null); // Clear parent component's token
    setShowLogin(true);
    setActiveTab('campaigns');
  };

  // Conditional Rendering: Show login screen if not authenticated
  if (showLogin) {
    return <Login onLogin={handleLogin} />;
  }

  // Main Application UI - Permission-Based Interface using User.user.can() method
  return (
    <div className="app-background min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Application Header - Common for all authenticated users */}
      <header className="flex justify-between items-center py-4 border-b border-gray-200 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Poster Campaigns</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Welcome, {user?.username || basicUser?.username} ({user?.user_type || basicUser?.user_type || 'unknown'})
            {' - '}
            {user ? getRoleNames() : (basicUser?.roles ? Array.isArray(basicUser.roles) ? basicUser.roles.map(role => {
              if (typeof role === 'object' && role !== null) {
                if (role.description) return role.description;
                if (role.name) return String(role.name).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                return JSON.stringify(role);
              }
              if (typeof role === 'string') {
                if (typeof basicUser.getRoleDisplayName === 'function') {
                  return basicUser.getRoleDisplayName(role);
                }
                return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              }
              return String(role);
            }).join(', ') : String(basicUser.roles) : 'No roles')}
            {(user?.company_name || basicUser?.company_name) && ` - ${user?.company_name || basicUser?.company_name}`}
          </span>
          <SimplePermissionBox />
          <button onClick={handleLogout} className="inline-flex items-center justify-center px-3 py-1.5 text-sm border border-red-600 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-red-600 text-white hover:bg-red-700 focus:ring-red-500">
            Logout
          </button>
        </div>
      </header>

      <main>
        {/* Permission-Based Navigation using User.user.can() method */}
        {/* Show navigation tabs if user has any management permissions */}
        <PermissionGuard permission={["view_campaigns", "view_users", "view_companies", "manage_roles"]}>
          <div className="flex gap-4 mb-8 border-b border-gray-200">
            {/* Show campaigns tab if user has campaign permissions */}
            <PermissionGuard permission="view_campaigns">
              <button 
                className={`px-6 py-3 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === 'campaigns' 
                    ? 'border-gray-800 text-gray-800 bg-gray-100' 
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
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
                    ? 'border-gray-800 text-gray-800 bg-gray-100' 
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
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
                    ? 'border-gray-800 text-gray-800 bg-gray-100' 
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
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
                    ? 'border-gray-800 text-gray-800 bg-gray-100' 
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('roles')}
              >
                Role Management
              </button>
            </PermissionGuard>
          </div>
        </PermissionGuard>

        {/* Management Interfaces Based on Permissions using User.user.can() method */}
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
            <EmployeeCampaignManagement token={token} user={user || basicUser} />
          )}
        </PermissionGuard>
        
        {/* Client Interface - Role-based since it's specific business logic */}
        {hasRole('client') && <ClientCampaignManagement token={token} user={user || basicUser} />}
        
        {/* Contractor Interface - Role-based since it's specific business logic */}
        {hasRole('contractor') && <ContractorCampaignManagement token={token} user={user || basicUser} />}

        {/* Fallback for users without any permissions - uses User.user.can() method */}
        {!can('view_campaigns') && 
         !can('view_users') && 
         !can('view_companies') && 
         !can('manage_roles') && 
         !hasRole('client') && 
         !hasRole('contractor') && (
          <div className="bg-white p-6 shadow-sm border border-gray-300 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
            <p className="text-gray-600">
              You don't have permissions to access any management functions. 
              Please contact your administrator to request appropriate permissions.
            </p>
            <div className="mt-4 text-sm text-gray-500">
              <strong>Debug Info:</strong> No permissions found for this user. 
              Expected permissions: view_campaigns, view_users, view_companies, or manage_roles.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(null);
  
  return (
    <UserProvider token={token}>
      <AppContent onTokenChange={setToken} />
    </UserProvider>
  );
}

export default App;