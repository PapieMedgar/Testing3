import { API_BASE_URL } from './api';

export interface User {
  id: number;
  phone: string;
  role: 'ADMIN' | 'MANAGER' | 'AGENT';
  name: string;
  is_active: boolean;
  created_at: string;
  manager_id?: number;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface LoginCredentials {
  phone: string;
  password: string;
}

export class AuthService {
  /**
   * Authenticate user and store token
   */
  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      
      // Store auth data in localStorage
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('auth_timestamp', Date.now().toString());
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Get current authenticated user
   */
  static async getCurrentUser(): Promise<User> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get user data');
      }

      return await response.json();
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  /**
   * Validate if token is still valid
   */
  static async validateToken(): Promise<boolean> {
    const token = localStorage.getItem('auth_token');
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/validate`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  /**
   * Logout user and clear storage
   */
  static logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('auth_timestamp');
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    // Only check for token presence; actual validity is checked with backend
    const token = localStorage.getItem('auth_token');
    return !!token;
  }

  /**
   * Get current user from localStorage
   */
  static getUser(): User | null {
    const userJson = localStorage.getItem('user');
    if (!userJson) return null;
    
    try {
      return JSON.parse(userJson);
    } catch (error) {
      console.error('Failed to parse user data:', error);
      return null;
    }
  }

  /**
   * Check if user has specific role
   */
  static hasRole(role: 'ADMIN' | 'MANAGER' | 'AGENT'): boolean {
    const user = this.getUser();
    return user?.role === role;
  }

  /**
   * Check if user is admin
   */
  static isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  /**
   * Check if user is manager
   */
  static isManager(): boolean {
    return this.hasRole('MANAGER');
  }

  /**
   * Check if user is agent
   */
  static isAgent(): boolean {
    return this.hasRole('AGENT');
  }
}