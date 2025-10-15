import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, User } from '../lib/api';

export type UserRole = 'ADMIN' | 'MANAGER' | 'AGENT';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for stored auth token and validate it
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        const storedUser = await authAPI.shouldAutoLogin();
        if (storedUser) {
          setUser(storedUser);
          console.log('Auto-login successful:', storedUser);
        } else {
          console.log('No valid stored session found');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear any invalid data
        authAPI.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (phone: string, password: string) => {
    try {
      setIsLoading(true);
      const data = await authAPI.login(phone, password);
      setUser(data.user);
      
      // Navigate based on user role
      navigateToRoleDashboard(data.user.role);
      
      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
    navigate('/login');
  };

  const navigateToRoleDashboard = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        navigate('/dashboard');
        break;
      case 'MANAGER':
        navigate('/dashboard');
        break;
      case 'AGENT':
        navigate('/dashboard');
        break;
      default:
        navigate('/dashboard');
    }
  };

  return {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
    navigateToRoleDashboard
  };
};