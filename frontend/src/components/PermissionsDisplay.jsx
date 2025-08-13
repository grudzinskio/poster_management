// components/PermissionsDisplay.jsx
// Component to display user permissions and restrictions

import React from 'react';
import { usePermissions } from '../hooks/usePermissions.jsx';

function PermissionsDisplay() {
  const { permissions, getRestrictedFunctions, loading } = usePermissions();

  if (loading) {
    return (
      <div className="bg-white p-6 shadow-sm border border-gray-300 mb-6">
        <div className="flex items-center justify-center py-4">
          <div className="spinner"></div>
          <span className="ml-2 text-gray-600">Loading permissions...</span>
        </div>
      </div>
    );
  }

  const restrictedFunctions = getRestrictedFunctions();
  
  // Group permissions by module
  const permissionsByModule = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {});

  // Group restricted functions by module (simplified categorization)
  const restrictedByModule = restrictedFunctions.reduce((acc, func) => {
    let module = 'other';
    if (func.includes('user')) module = 'user_management';
    else if (func.includes('company')) module = 'company_management';
    else if (func.includes('campaign')) module = 'campaign_management';
    else if (func.includes('role')) module = 'role_management';
    
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(func);
    return acc;
  }, {});

  const moduleDisplayNames = {
    user_management: 'User Management',
    company_management: 'Company Management',
    campaign_management: 'Campaign Management',
    campaign_images: 'Campaign Images',
    role_management: 'Role Management',
    system_utilities: 'System Utilities',
    other: 'Other'
  };

  const functionDisplayNames = {
    // User management
    view_user_list: 'View User List',
    view_user_details: 'View User Details',
    create_user_form: 'Create User Form',
    save_new_user: 'Save New User',
    edit_user_form: 'Edit User Form',
    update_user_data: 'Update User Data',
    delete_user_confirm: 'Delete User Confirmation',
    remove_user_record: 'Remove User Record',
    change_user_password: 'Change User Password',
    
    // Company management
    view_company_list: 'View Company List',
    view_company_details: 'View Company Details',
    create_company_form: 'Create Company Form',
    save_new_company: 'Save New Company',
    edit_company_form: 'Edit Company Form',
    update_company_data: 'Update Company Data',
    delete_company_confirm: 'Delete Company Confirmation',
    remove_company_record: 'Remove Company Record',
    
    // Campaign management
    view_campaign_list: 'View Campaign List',
    view_campaign_details: 'View Campaign Details',
    create_campaign_form: 'Create Campaign Form',
    save_new_campaign: 'Save New Campaign',
    edit_campaign_form: 'Edit Campaign Form',
    update_campaign_data: 'Update Campaign Data',
    delete_campaign_confirm: 'Delete Campaign Confirmation',
    remove_campaign_record: 'Remove Campaign Record',
    assign_contractor_to_campaign: 'Assign Contractor to Campaign',
    
    // Campaign images
    view_campaign_images: 'View Campaign Images',
    upload_campaign_image: 'Upload Campaign Image',
    review_campaign_image: 'Review Campaign Image',
    delete_campaign_image: 'Delete Campaign Image',
    
    // Role management
    view_role_list: 'View Role List',
    view_role_details: 'View Role Details',
    create_role_form: 'Create Role Form',
    save_new_role: 'Save New Role',
    edit_role_form: 'Edit Role Form',
    update_role_data: 'Update Role Data',
    delete_role_confirm: 'Delete Role Confirmation',
    remove_role_record: 'Remove Role Record'
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Allowed Actions */}
      <div className="bg-green-50 border border-green-200 p-6 shadow-sm">
        <div className="flex items-center mb-4">
          <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-green-800">Your Permissions</h3>
        </div>
        
        {Object.keys(permissionsByModule).length === 0 ? (
          <p className="text-green-700 text-sm">No specific permissions assigned.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(permissionsByModule).map(([module, perms]) => (
              <div key={module} className="bg-white rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2 text-sm">
                  {moduleDisplayNames[module] || module}
                </h4>
                <ul className="text-xs text-green-700 space-y-1">
                  {perms.map((perm, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                      <span>{functionDisplayNames[perm.function_name] || perm.function_name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Restricted Actions */}
      <div className="bg-red-50 border border-red-200 p-6 shadow-sm">
        <div className="flex items-center mb-4">
          <svg className="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-semibold text-red-800">Restricted Actions</h3>
        </div>
        
        {restrictedFunctions.length === 0 ? (
          <p className="text-red-700 text-sm">You have access to all system functions.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(restrictedByModule).map(([module, functions]) => (
              <div key={module} className="bg-white rounded-lg p-4 border border-red-200">
                <h4 className="font-semibold text-red-800 mb-2 text-sm">
                  {moduleDisplayNames[module] || module}
                </h4>
                <ul className="text-xs text-red-700 space-y-1">
                  {functions.map((func, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                      <span>{functionDisplayNames[func] || func}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PermissionsDisplay;
