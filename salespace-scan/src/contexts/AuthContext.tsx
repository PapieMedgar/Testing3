import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService, User, LoginCredentials } from '@/lib/authService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authAPI } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
  isManager: () => boolean;
  isAgent: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(AuthService.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(AuthService.isAuthenticated());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Check authentication status on mount
  useEffect(() => {
    const validateAuth = async () => {
      setIsLoading(true);
      try {
        // Check if there's a token in localStorage
        if (AuthService.isAuthenticated()) {
          // First check if we have a stored user
          const storedUser = authAPI.getStoredUser();
          if (storedUser) {
            // If we have a stored user, ALWAYS consider authenticated
            // This is critical for login persistence on page refresh
            setUser(storedUser);
            setIsAuthenticated(true);
            
            // Then validate in the background without affecting the current session
            // We're not awaiting this to ensure the user stays logged in regardless of API response
            authAPI.validateToken().catch(error => {
              console.error('Background validation error:', error);
              // Don't logout on network errors
            });
          } else {
            // If no stored user but we have a token, try to extract user info from token
            // This is a fallback case that should rarely happen (token exists but no user data)
            try {
              // First try to parse the token to get user info
              const token = localStorage.getItem('auth_token');
              if (token) {
                try {
                  // For JWT tokens, try to decode the payload
                  const payload = token.split('.')[1];
                  if (payload) {
                    const decodedData = JSON.parse(atob(payload));
                    if (decodedData) {
                      // Create a minimal user object from the token payload
                      const minimalUser = {
                        id: decodedData.sub || decodedData.id || 1,
                        phone: decodedData.phone || "unknown",
                        role: decodedData.role || "AGENT",
                        is_active: true,
                        created_at: new Date().toISOString()
                      };
                      localStorage.setItem('user', JSON.stringify(minimalUser));
                      setUser(minimalUser);
                      setIsAuthenticated(true);
                      
                      // Still validate in the background to get full user data
                      authAPI.validateToken();
                      return;
                    }
                  }
                } catch (e) {
                  console.error("Failed to parse token:", e);
                }
              }
              
              // If token parsing failed, try to validate with the backend
              const isValid = await authAPI.validateToken();
              if (isValid) {
                // Get the user from localStorage (should be set by validateToken)
                const storedUser = authAPI.getStoredUser();
                if (storedUser) {
                  setUser(storedUser);
                  setIsAuthenticated(true);
                } else {
                  // If still no user after validation, but token is valid, stay logged in
                  setIsAuthenticated(true);
                }
              } else {
                // If explicitly invalid, logout
                handleLogout();
                toast.error('Your session has expired. Please log in again.');
              }
            } catch (validationError) {
              // On validation error, if we have a token, stay logged in
              // This ensures persistence even if the backend is temporarily unavailable
              if (AuthService.isAuthenticated()) {
                // Try to get user from token if possible
                setIsAuthenticated(true);
              } else {
                handleLogout();
              }
            }
          }
        } else {
          // No token, ensure logged out state
          handleLogout();
        }
      } catch (error) {
        console.error('Auth validation error:', error);
        // Don't logout on network errors if we have a token
        if (authAPI.isAuthenticated()) {
          // If we have a token, stay logged in despite errors
          const storedUser = authAPI.getStoredUser();
          if (storedUser) {
            setUser(storedUser);
            setIsAuthenticated(true);
          } else {
            // If no stored user but we have a token, stay logged in
            setIsAuthenticated(true);
          }
        } else {
          handleLogout();
        }
      } finally {
        setIsLoading(false);
      }
    };

    validateAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await authAPI.login(credentials.phone, credentials.password);
      setUser(response.user);
      setIsAuthenticated(true);
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please check your credentials.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const logout = () => {
    handleLogout();
    toast.info('You have been logged out');
    navigate('/login');
  };

  const isAdmin = () => user?.role === 'ADMIN';
  const isManager = () => user?.role === 'MANAGER';
  const isAgent = () => user?.role === 'AGENT';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        isAdmin,
        isManager,
        isAgent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};