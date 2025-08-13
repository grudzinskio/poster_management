// components/SimplePermissionBox.jsx
// Small icon-based component to display user permissions

import React, { useState } from 'react';
import { useSimplePermissions, getPermissionDisplayName, getCategoryDisplayName } from '../hooks/useSimplePermissions.jsx';

function SimplePermissionBox() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { 
    userPermissions, 
    getMissingPermissionsByCategory,
    loading, 
    error 
  } = useSimplePermissions();

  if (loading) {
    return (
      <div className="relative">
        <div className="bg-white border border-gray-200 rounded-full p-2 shadow-sm">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative">
        <div className="bg-red-100 border border-red-300 rounded-full p-2 shadow-sm cursor-pointer"
             onClick={() => setIsExpanded(!isExpanded)}>
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        {isExpanded && (
          <div className="absolute top-12 right-0 bg-white border border-red-200 rounded-lg p-4 shadow-xl w-80 max-w-sm z-50">
            <div className="flex items-center text-red-800 font-medium text-sm mb-2">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Permission Error
            </div>
            <p className="text-red-700 text-xs">Failed to load permissions: {error}</p>
          </div>
        )}
      </div>
    );
  }

  const missingByCategory = getMissingPermissionsByCategory();
  const hasAnyMissingPermissions = Object.values(missingByCategory).some(perms => perms.length > 0);
  
  // Determine icon and color based on permission status
  const getStatusInfo = () => {
    if (!hasAnyMissingPermissions) {
      return {
        icon: (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        bgColor: 'bg-green-100',
        borderColor: 'border-green-300',
        title: 'Full Access',
        description: 'You have all system permissions'
      };
    } else {
      return {
        icon: (
          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        ),
        bgColor: 'bg-amber-100',
        borderColor: 'border-amber-300',
        title: 'Limited Access',
        description: 'Some features are restricted'
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="relative">
      {/* Icon Button */}
      <div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-full p-2 shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200`}
           onClick={() => setIsExpanded(!isExpanded)}
           title={statusInfo.title}>
        {statusInfo.icon}
      </div>
      
      {/* Expanded Panel */}
      {isExpanded && (
        <div className="absolute top-12 right-0 bg-white border border-gray-200 rounded-lg shadow-xl w-80 max-w-sm max-h-96 overflow-y-auto z-50">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {statusInfo.icon}
                <div className="ml-3">
                  <h3 className="font-medium text-sm text-gray-900">{statusInfo.title}</h3>
                  <p className="text-xs text-gray-600">{statusInfo.description}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {!hasAnyMissingPermissions ? (
              <div className="text-center py-4">
                <div className="text-green-600 mb-2">
                  <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">You have access to all {userPermissions.length} system features.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center pb-3 border-b border-gray-200">
                  <p className="text-xs text-gray-600">
                    <span className="font-medium text-green-600">{userPermissions.length}</span> permissions enabled
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-xs text-gray-700 mb-3">Restricted Features:</h4>
                  <div className="space-y-3">
                    {Object.entries(missingByCategory).map(([category, permissions]) => {
                      if (permissions.length === 0) return null;
                      
                      return (
                        <div key={category} className="bg-gray-50 rounded-md p-3">
                          <h5 className="font-medium text-xs text-gray-700 mb-2">
                            {getCategoryDisplayName(category)}
                          </h5>
                          <div className="space-y-1">
                            {permissions.slice(0, 3).map((permission) => (
                              <div key={permission} className="flex items-center text-xs text-gray-600">
                                <span className="w-1 h-1 bg-gray-400 rounded-full mr-2 flex-shrink-0"></span>
                                <span>{getPermissionDisplayName(permission)}</span>
                              </div>
                            ))}
                            {permissions.length > 3 && (
                              <div className="text-xs text-gray-500 pl-3">
                                +{permissions.length - 3} more...
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SimplePermissionBox;