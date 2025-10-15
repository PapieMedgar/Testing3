import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { authAPI } from '@/lib/api';

interface ProtectedRouteProps {
  allowedRoles?: ('ADMIN' | 'MANAGER' | 'AGENT')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [localLoading, setLocalLoading] = useState(true);

  // Additional check to validate token on route change
  useEffect(() => {
    const validateToken = async () => {
      // Only validate if we have a token
      if (authAPI.isAuthenticated()) {
        try {
          // We don't need to await this since validateToken now handles
          // background validation and maintains session persistence
          // This will update the user data in the background without affecting the current session
          await authAPI.validateToken();
        } catch (error) {
          console.error("Token validation error:", error);
          // Even if validation fails, we'll still consider the user authenticated
          // if they have a token in localStorage
        }
      }
      setLocalLoading(false);
    };
    
    validateToken();
  }, []);

  if (isLoading || localLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading...</span>
      </div>
    );
  }

  // Check if we have a token in localStorage, even if isAuthenticated is false
  // This ensures we don't redirect to login if we have a token
  if (!isAuthenticated && !authAPI.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // If roles are specified, check if user has permission
  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission = user && allowedRoles.includes(user.role);
    
    if (!hasPermission) {
      // Redirect to appropriate page based on role
      if (user?.role === 'ADMIN') {
        return <Navigate to="/admin" replace />;
      } else if (user?.role === 'MANAGER') {
        return <Navigate to="/manager" replace />;
      } else if (user?.role === 'AGENT') {
        return <Navigate to="/agent" replace />;
      } else {
        return <Navigate to="/unauthorized" replace />;
      }
    }
  }

  return <Outlet />;
};