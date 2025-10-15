import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { authAPI } from '@/lib/api';

export const AuthDebug: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  const handleClearStorage = () => {
    authAPI.logout();
    window.location.reload();
  };

  const getStoredData = () => {
    return {
      token: localStorage.getItem('auth_token')?.substring(0, 50) + '...',
      user: localStorage.getItem('user'),
      timestamp: localStorage.getItem('auth_timestamp'),
    };
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border rounded-lg p-4 shadow-lg max-w-md">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div className="space-y-2 text-sm">
        <div>
          <strong>Status:</strong> {isLoading ? 'Loading...' : isAuthenticated ? 'Authenticated' : 'Not authenticated'}
        </div>
        {user && (
          <div>
            <strong>User:</strong> {user.phone} ({user.role})
          </div>
        )}
        <div>
          <strong>Stored Token:</strong> {getStoredData().token || 'None'}
        </div>
        <div>
          <strong>Timestamp:</strong> {getStoredData().timestamp || 'None'}
        </div>
        <button
          onClick={handleClearStorage}
          className="bg-red-500 text-white px-2 py-1 rounded text-xs"
        >
          Clear Storage & Reload
        </button>
      </div>
    </div>
  );
};
