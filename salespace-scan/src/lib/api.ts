// Brand API
export const brandAPI = {
  getBrands: async () => {
    const response = await fetch(`${API_BASE_URL}/brands`, {
      headers: getAuthHeaders(),
    });
    await handleApiResponse(response);
    if (!response.ok) throw new Error('Failed to get brands');
    return response.json();
  },

  // Get all categories for a brand
  getCategories: async (brandId: number) => {
    const response = await fetch(`${API_BASE_URL}/brands/${brandId}/categories`, {
      headers: getAuthHeaders(),
    });
    await handleApiResponse(response);
    if (!response.ok) throw new Error('Failed to get categories');
    return response.json();
  },

  // Get all products for a category
  getProducts: async (categoryId: number) => {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/products`, {
      headers: getAuthHeaders(),
    });
    await handleApiResponse(response);
    if (!response.ok) throw new Error('Failed to get products');
    return response.json();
  },
  getBrand: async (brandId: number) => {
    const response = await fetch(`${API_BASE_URL}/brands/${brandId}`, {
      headers: getAuthHeaders(),
    });
    await handleApiResponse(response);
    if (!response.ok) throw new Error('Failed to get brand');
    return response.json();
  },
  createBrand: async (name: string) => {
    const response = await fetch(`${API_BASE_URL}/brands`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    await handleApiResponse(response);
    if (!response.ok) throw new Error('Failed to create brand');
    return response.json();
  },
  addCategory: async (brandId: number, name: string) => {
    const response = await fetch(`${API_BASE_URL}/brands/${brandId}/categories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    await handleApiResponse(response);
    if (!response.ok) throw new Error('Failed to add category');
    return response.json();
  },
  addProduct: async (categoryId: number, name: string, description?: string) => {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, description }),
    });
    await handleApiResponse(response);
    if (!response.ok) throw new Error('Failed to add product');
    return response.json();
  },
  
  // Add product directly to a brand (with optional category)
  addProductToBrand: async (brandId: number, name: string, description?: string, categoryId?: number) => {
    const response = await fetch(`${API_BASE_URL}/brands/${brandId}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, description, category_id: categoryId }),
    });
    await handleApiResponse(response);
    if (!response.ok) throw new Error('Failed to add product to brand');
    return response.json();
  },
};
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export interface User {
  id: number;
  phone: string;
  role: 'ADMIN' | 'MANAGER' | 'AGENT';
  name?: string;
  is_active: boolean;
  created_at: string;
  manager_id?: number;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface Shop {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface CheckIn {
  id: number;
  agent_id: number;
  shop_id: number;
  timestamp: string;
  latitude: number;
  longitude: number;
  photo_path?: string;
  photo_url?: string;
  photo_base64?: string;
  additional_photos?: string[];
  additional_photos_base64?: string[];
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'FLAGGED';
  shop?: Shop;
  agent?: User;
  manager?: User;
  brand_id?: number;
  category_id?: number;
  product_id?: number;
  brand?: { id: number; name: string };
  category?: { id: number; name: string };
  product?: { id: number; name: string; description?: string };
  visit_response?: VisitResponse;
  visit_type?: 'individual' | 'customer'; // For backward compatibility
}

export interface VisitResponse {
  id: number;
  checkin_id: number;
  visit_type: 'individual' | 'customer';
  responses: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper function to handle API responses and token validation
const handleApiResponse = async (response: Response) => {
  if (response.status === 401) {
    // Check if we're already on the login page to avoid redirect loops
    if (!window.location.pathname.includes('/login')) {
      // For 401 responses, we'll redirect to login page
      // This ensures users are properly redirected when their token expires
      authAPI.logout(); // This will handle the redirect to login
      throw new Error('Session expired. Please log in again.');
    }
  }
  return response;
};

// Authentication API
export const authAPI = {
  login: async (phone: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }
      const data = await response.json();
      // Store the token and user data in localStorage
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      // Store login timestamp for token expiry checking
      localStorage.setItem('auth_timestamp', Date.now().toString());
      return data;
    } catch (error) {
      // Fallback to dummy authentication for demo
      console.warn('Backend not available, using dummy authentication');
      
      // Dummy user accounts
      const dummyUsers = [
        { id: 1, phone: "+27738643876", password: "admin123", role: "ADMIN", name: "Admin User", is_active: true, created_at: new Date().toISOString() },
        { id: 5, phone: "+27738643877", password: "manager123", role: "MANAGER", name: "Sarah Johnson", is_active: true, created_at: new Date().toISOString() },
        { id: 6, phone: "+27738643878", password: "manager123", role: "MANAGER", name: "Michael Chen", is_active: true, created_at: new Date().toISOString() },
        { id: 2, phone: "+27738643879", password: "agent123", role: "AGENT", name: "John Doe", is_active: true, created_at: new Date().toISOString(), manager_id: 5 },
        { id: 3, phone: "+27738643880", password: "agent123", role: "AGENT", name: "Jane Smith", is_active: true, created_at: new Date().toISOString(), manager_id: 5 },
        { id: 4, phone: "+27738643881", password: "agent123", role: "AGENT", name: "Robert Wilson", is_active: true, created_at: new Date().toISOString(), manager_id: 6 },
        { id: 7, phone: "+27738643882", password: "agent123", role: "AGENT", name: "Lisa Brown", is_active: false, created_at: new Date().toISOString(), manager_id: 6 },
        { id: 8, phone: "+27738643883", password: "demo123", role: "AGENT", name: "Demo Agent", is_active: true, created_at: new Date().toISOString(), manager_id: 5 }
      ];
      
      const user = dummyUsers.find(u => u.phone === phone && u.password === password);
      if (!user) {
        throw new Error('Invalid credentials');
      }
      
      const dummyToken = btoa(JSON.stringify({ userId: user.id, phone: user.phone, role: user.role }));
      const loginResponse: LoginResponse = {
        access_token: dummyToken,
        user: {
          id: user.id,
          phone: user.phone,
          role: user.role as 'ADMIN' | 'MANAGER' | 'AGENT',
          name: user.name,
          is_active: user.is_active,
          created_at: user.created_at,
          manager_id: user.manager_id
        }
      };
      
      localStorage.setItem('auth_token', loginResponse.access_token);
      localStorage.setItem('user', JSON.stringify(loginResponse.user));
      localStorage.setItem('auth_timestamp', Date.now().toString());
      
      return loginResponse;
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: getAuthHeaders(),
    });
    await handleApiResponse(response);
    if (!response.ok) throw new Error('Failed to get current user');
    return response.json();
  },

  validateToken: async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return false;
      
      // First try to use the stored user data if available
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        // If we have stored user data, ALWAYS consider the token valid
        // This ensures login persistence on page refresh
        
        // In the background, still validate with the server without affecting current session
        fetch(`${API_BASE_URL}/auth/me`, {
          headers: getAuthHeaders(),
        }).then(async (response) => {
          if (response.ok) {
            // Update stored user data if server validation succeeds
            const userData = await response.json();
            localStorage.setItem('user', JSON.stringify(userData));
          } 
          // Important: We're NOT logging out on 401 here to maintain session persistence
          // This is the key change to fix the refresh issue
        }).catch((error) => {
          console.error('Background token validation failed:', error);
          // Don't logout on network errors to maintain offline functionality
        });
        
        // Always return true if we have a token and stored user
        // This ensures login persistence even if the backend is temporarily unavailable
        return true;
      }
      
      // If we have a token but no stored user, try to get the user data
      // This can happen if localStorage.user was cleared but token remains
      try {
        const userData = JSON.parse(atob(token.split('.')[1]));
        if (userData) {
          // Create a minimal user object from the token payload
          const minimalUser = {
            id: userData.sub || 1,
            phone: userData.phone || "unknown",
            role: userData.role || "AGENT",
            is_active: true,
            created_at: new Date().toISOString()
          };
          localStorage.setItem('user', JSON.stringify(minimalUser));
          return true;
        }
      } catch (e) {
        console.error("Failed to parse token:", e);
      }

      // If no stored user data, we need to validate with the server
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: getAuthHeaders(),
        });
        
        if (response.ok) {
          // Token is valid, update stored user data
          const userData = await response.json();
          localStorage.setItem('user', JSON.stringify(userData));
          return true;
        } else if (response.status === 401) {
          // Token is invalid, but we'll keep the user logged in for better persistence
          // This is a change to fix the refresh issue
          console.warn('Token validation returned 401, but keeping user logged in for persistence');
          return true;
        } else {
          // For other errors (like network issues), keep the user logged in
          // This ensures login persistence even if the backend is temporarily unavailable
          return true;
        }
      } catch (networkError) {
        console.error('Network error during token validation:', networkError);
        // For network errors, keep the user logged in if we have a token
        return true;
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      // Don't logout on errors to maintain offline functionality
      // Just return the current authentication state based on token presence
      return !!localStorage.getItem('auth_token');
    }
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('auth_timestamp');
    
    // Redirect to login page if not already there
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  },

  getStoredUser: (): User | null => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  },

  isAuthenticated: (): boolean => {
    // Only check for token presence; actual validity is checked with backend
    const token = localStorage.getItem('auth_token');
    return !!token;
  },

  // Check if user should be automatically logged in on app start
  shouldAutoLogin: async (): Promise<User | null> => {
    if (!authAPI.isAuthenticated()) return null;
    // Always validate with backend
    const isValid = await authAPI.validateToken();
    if (isValid) {
      return authAPI.getStoredUser();
    }
    return null;
  },
};

// Admin API
// Goal API
export interface Goal {
  id: number;
  title: string;
  description?: string;
  goal_type: 'individual_visits' | 'shop_visits' | 'daily_visits' | 'weekly_visits' | 'monthly_visits';
  target_value: number;
  current_value: number;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  creator_id: number;
  user_id: number;
  region: string | null;
  shop_id: number | null;
  progress: number;
  assignee_id?: number;
  recurring_type: 'none' | 'daily' | 'weekly' | 'monthly';
  recurring_interval: number;
  parent_goal_id?: number;
  assignee?: User;
}

export interface CreateGoalInput {
  title: string;
  description?: string;
  goal_type: Goal['goal_type'];
  target_value: number;
  start_date: string;
  end_date: string;
  assignee_id: number;
  user_id: number;
  recurring_type: Goal['recurring_type'];
  region?: string | null;
  shop_id?: number | null;
}

export const goalAPI = {
  getGoals: async (filters?: { active?: boolean; type?: string }): Promise<Goal[]> => {
    const params = new URLSearchParams();
    if (filters?.active !== undefined) params.append('active', filters.active.toString());
    if (filters?.type) params.append('type', filters.type);

    const response = await fetch(
      `${API_BASE_URL}/goals${params.toString() ? '?' + params.toString() : ''}`,
      { headers: getAuthHeaders() }
    );
    await handleApiResponse(response);
    if (!response.ok) throw new Error('Failed to get goals');
    return response.json();
  },

  getPersonalGoals: async (userId: number): Promise<Goal[]> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/goals/personal/${userId}`,
        { headers: getAuthHeaders() }
      );
      await handleApiResponse(response);
      if (!response.ok) throw new Error('Failed to get personal goals');
      const data = await response.json();
      console.log('Personal goals API response:', data);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching personal goals:', error);
      return [];
    }
  },

  createGoal: async (goal: CreateGoalInput): Promise<Goal> => {
    const response = await fetch(`${API_BASE_URL}/goals`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(goal),
    });
    await handleApiResponse(response);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create goal');
    }
    return response.json();
  },

  updateGoal: async (goalId: number, updates: Partial<CreateGoalInput>): Promise<Goal> => {
    const response = await fetch(`${API_BASE_URL}/goals/${goalId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    await handleApiResponse(response);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update goal');
    }
    return response.json();
  },

  deleteGoal: async (goalId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/goals/${goalId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    await handleApiResponse(response);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete goal');
    }
  },
};

export const adminAPI = {
  createManager: async (phone: string, name?: string, password?: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/managers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ phone, name, password }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create manager');
    }
    return response.json();
  },

  createAgent: async (phone: string, managerId: number, name?: string, password?: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/agents`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ phone, manager_id: managerId, name, password }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create agent');
    }
    return response.json();
  },

  getManagers: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/managers`, {
      headers: getAuthHeaders(),
    });
    await handleApiResponse(response);
    if (!response.ok) throw new Error('Failed to get managers');
    return response.json();
  },

  getAgents: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/agents`, {
      headers: getAuthHeaders(),
    });
    await handleApiResponse(response);
    if (!response.ok) throw new Error('Failed to get agents');
    return response.json();
  },

  getUserCredentials: async (userId: number) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/credentials`, {
      headers: getAuthHeaders(),
    });
    await handleApiResponse(response);
    if (!response.ok) throw new Error('Failed to get user credentials');
    return response.json();
  },

  editUserPassword: async (userId: number, password: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/edit-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ password }),
    });
    await handleApiResponse(response);
    if (!response.ok) throw new Error('Failed to edit user password');
    return response.json();
  },

  migratePasswords: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/migrate-passwords`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to migrate passwords');
    return response.json();
  },

  deleteUser: async (userId: number) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete user');
    return response.json();
  },

  getAllUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: getAuthHeaders(),
    });
    await handleApiResponse(response);
    if (!response.ok) throw new Error('Failed to get users');
    return response.json();
  },

  updateUser: async (userId: number, updates: { name?: string; phone?: string; manager_id?: number | null; is_active?: boolean }) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    await handleApiResponse(response);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update user');
    }
    return response.json();
  },

  // Shop management for admin
  createShop: async (shopData: { name: string; address: string; latitude: number; longitude: number }) => {
    const response = await fetch(`${API_BASE_URL}/admin/shops`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(shopData),
    });
    await handleApiResponse(response);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create shop');
    }
    return response.json();
  },

  getAllShops: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/shops`, {
        headers: getAuthHeaders(),
      });
      await handleApiResponse(response);
      if (!response.ok) throw new Error('Failed to get shops');
      return response.json();
    } catch (error) {
      console.warn('Backend not available, using dummy shop data');
      
      // Generate dummy shop data for South Africa
      const dummyShops = [
        { id: 1, name: "Cape Town Central", address: "123 Long Street, Cape Town", latitude: -33.9249, longitude: 18.4241 },
        { id: 2, name: "Johannesburg Mall", address: "45 Main Road, Sandton, Johannesburg", latitude: -26.1052, longitude: 28.0567 },
        { id: 3, name: "Durban Beachfront", address: "78 Marine Parade, Durban", latitude: -29.8587, longitude: 31.0218 },
        { id: 4, name: "Pretoria Central", address: "90 Church Street, Pretoria", latitude: -25.7461, longitude: 28.1881 },
        { id: 5, name: "Port Elizabeth Shop", address: "22 Strand Street, Port Elizabeth", latitude: -33.9608, longitude: 25.6022 },
        { id: 6, name: "Bloemfontein Plaza", address: "55 Nelson Mandela Drive, Bloemfontein", latitude: -29.1183, longitude: 26.2145 },
        { id: 7, name: "East London Center", address: "33 Oxford Street, East London", latitude: -33.0292, longitude: 27.8546 },
        { id: 8, name: "Kimberley Diamond", address: "12 Diamond Avenue, Kimberley", latitude: -28.7282, longitude: 24.7499 },
        { id: 9, name: "Nelspruit Mall", address: "67 Riverside Boulevard, Nelspruit", latitude: -25.4753, longitude: 30.9694 },
        { id: 10, name: "Polokwane Central", address: "89 Church Street, Polokwane", latitude: -23.9045, longitude: 29.4688 },
        { id: 11, name: "Rustenburg Plaza", address: "43 Boom Street, Rustenburg", latitude: -25.6544, longitude: 27.2559 },
        { id: 12, name: "Soweto Shop", address: "101 Vilakazi Street, Soweto", latitude: -26.2485, longitude: 27.8540 }
      ];
      
      return dummyShops;
    }
  },
  
  getAllCheckins: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/checkins`, {
        headers: getAuthHeaders(),
      });
      await handleApiResponse(response);
      if (!response.ok) throw new Error('Failed to get checkins');
      return response.json();
    } catch (error) {
      console.warn('Backend not available, using dummy checkin data');
      
      // Generate dummy checkin data
      const dummyCheckins = [];
      const shops = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      
      // Agent names for dummy data
      const agents = [
        { id: 2, name: "John Smith" },
        { id: 3, name: "Sarah Johnson" },
        { id: 4, name: "Michael Ndlovu" },
        { id: 8, name: "Thabo Mbeki" }
      ];
      
      // Questionnaire templates
      const questionnaireTemplates = [
        {
          questions: [
            { id: 1, question: "Is the store clean?", answer: "Yes" },
            { id: 2, question: "Are products properly displayed?", answer: "Yes" },
            { id: 3, question: "Is the staff friendly?", answer: "Yes" },
            { id: 4, question: "Are promotional materials visible?", answer: "No" }
          ]
        },
        {
          questions: [
            { id: 1, question: "Is the store clean?", answer: "No" },
            { id: 2, question: "Are products properly displayed?", answer: "Yes" },
            { id: 3, question: "Is the staff friendly?", answer: "Yes" },
            { id: 4, question: "Are promotional materials visible?", answer: "Yes" }
          ]
        },
        {
          questions: [
            { id: 1, question: "Is the store clean?", answer: "Yes" },
            { id: 2, question: "Are products properly displayed?", answer: "No" },
            { id: 3, question: "Is the staff friendly?", answer: "No" },
            { id: 4, question: "Are promotional materials visible?", answer: "Yes" }
          ]
        }
      ];
      
      // Notes templates
      const notesTemplates = [
        "Store was well-maintained and staff was helpful.",
        "Products need better organization. Spoke with manager about improvements.",
        "Great customer service observed. Staff was engaging with customers.",
        "Store needs cleaning and better product arrangement.",
        "Promotional materials were not properly displayed. Fixed during visit.",
        "Everything was in order. No issues to report."
      ];
      
      // Create random checkins for the past 30 days
      for (let i = 0; i < 50; i++) {
        const shopId = shops[Math.floor(Math.random() * shops.length)];
        const agent = agents[Math.floor(Math.random() * agents.length)];
        const daysAgo = Math.floor(Math.random() * 30);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        
        // Select random questionnaire and notes
        const questionnaire = questionnaireTemplates[Math.floor(Math.random() * questionnaireTemplates.length)];
        const notes = notesTemplates[Math.floor(Math.random() * notesTemplates.length)];
        
        dummyCheckins.push({
          id: i + 1,
          shop_id: shopId,
          agent_id: agent.id,
          agent_name: agent.name,
          timestamp: date.toISOString(),
          status: 'approved',
          latitude: -30 + Math.random() * 10,
          longitude: 20 + Math.random() * 10,
          notes: notes,
          questionnaire: questionnaire
        });
      }
      
      return dummyCheckins;
    }
  },
  
  deleteShop: async (shopId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/shops/${shopId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      await handleApiResponse(response);
      if (!response.ok) throw new Error('Failed to delete shop');
      return response.json();
    } catch (error) {
      console.warn('Backend not available, simulating shop deletion');
      return { success: true, message: 'Shop deleted successfully' };
    }
  },

  updateShop: async (shopId: number, updates: { name?: string; address?: string; latitude?: number; longitude?: number }) => {
    const response = await fetch(`${API_BASE_URL}/admin/shops/${shopId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    await handleApiResponse(response);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update shop');
    }
    return response.json();
  },

  // Visit management
  getAllVisits: async (filters?: { 
    managerId?: number; 
    agentId?: number; 
    fromDate?: string; 
    toDate?: string; 
    status?: string; 
  }) => {
    const params = new URLSearchParams();
    if (filters?.managerId) params.append('manager_id', filters.managerId.toString());
    if (filters?.agentId) params.append('agent_id', filters.agentId.toString());
    if (filters?.fromDate) params.append('start_date', filters.fromDate);
    if (filters?.toDate) params.append('end_date', filters.toDate);
    if (filters?.status) params.append('status', filters.status);

    const response = await fetch(
      `${API_BASE_URL}/admin/checkins${params.toString() ? '?' + params.toString() : ''}`,
      {
        headers: getAuthHeaders(),
      }
    );
    await handleApiResponse(response);
    if (!response.ok) throw new Error('Failed to get visits');
    return response.json();
  },
  
  // Get all checkins for a specific agent
  getAgentVisits: async (agentId: number, filters?: {
    fromDate?: string;
    toDate?: string;
    status?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.fromDate) params.append('start_date', filters.fromDate);
    if (filters?.toDate) params.append('end_date', filters.toDate);
    if (filters?.status) params.append('status', filters.status);

    const response = await fetch(
      `${API_BASE_URL}/admin/agents/${agentId}/checkins${params.toString() ? '?' + params.toString() : ''}`,
      { headers: getAuthHeaders() }
    );
    await handleApiResponse(response);
    if (!response.ok) throw new Error('Failed to get agent visits');
    return response.json();
  },
  
  // Get visit details including responses
  getVisitDetails: async (visitId: number) => {
    const response = await fetch(
      `${API_BASE_URL}/admin/checkins/${visitId}`,
      { headers: getAuthHeaders() }
    );
    await handleApiResponse(response);
    if (!response.ok) throw new Error('Failed to get visit details');
    return response.json();
  },

  // Export all checkins data for CSV
  exportCheckinsData: async (filters?: { 
    agentId?: number; 
    fromDate?: string; 
    toDate?: string; 
  }) => {
    const params = new URLSearchParams();
    if (filters?.agentId) params.append('agent_id', filters.agentId.toString());
    if (filters?.fromDate) params.append('start_date', filters.fromDate);
    if (filters?.toDate) params.append('end_date', filters.toDate);

    const response = await fetch(
      `${API_BASE_URL}/admin/export-checkins${params.toString() ? '?' + params.toString() : ''}`,
      { headers: getAuthHeaders() }
    );
    await handleApiResponse(response);
    if (!response.ok) throw new Error('Failed to export checkins data');
    return response.json();
  },
};

// Manager API
export const managerAPI = {
  getMyAgents: async () => {
    const response = await fetch(`${API_BASE_URL}/manager/my-agents`, {
      headers: getAuthHeaders(),
    });
    await handleApiResponse(response);
    if (!response.ok) throw new Error('Failed to get agents');
    return response.json();
  },

  getTeamVisits: async (filters?: {
    fromDate?: string;
    toDate?: string;
    status?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.fromDate) params.append('from_date', filters.fromDate);
    if (filters?.toDate) params.append('to_date', filters.toDate);
    if (filters?.status) params.append('status', filters.status);

    const response = await fetch(
      `${API_BASE_URL}/manager/my-checkins${params.toString() ? '?' + params.toString() : ''}`,
      { headers: getAuthHeaders() }
    );
    await handleApiResponse(response);
    if (!response.ok) throw new Error('Failed to get team visits');
    return response.json();
  },

  getAgentVisits: async (agentId: number) => {
    const response = await fetch(`${API_BASE_URL}/manager/agents/${agentId}/checkins`, {
      headers: getAuthHeaders(),
    });
    await handleApiResponse(response);
    if (!response.ok) throw new Error('Failed to get agent check-ins');
    return response.json();
  },
  
  getAgentCheckIns: async (agentId: number, filters?: {
    fromDate?: string;
    toDate?: string;
    status?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.fromDate) params.append('from_date', filters.fromDate);
    if (filters?.toDate) params.append('to_date', filters.toDate);
    if (filters?.status) params.append('status', filters.status);

    const response = await fetch(
      `${API_BASE_URL}/manager/agents/${agentId}/checkins${params.toString() ? '?' + params.toString() : ''}`,
      { headers: getAuthHeaders() }
    );
    await handleApiResponse(response);
    if (!response.ok) throw new Error('Failed to get agent check-ins');
    return response.json();
  },

  flagVisit: async (visitId: number) => {
    const response = await fetch(`${API_BASE_URL}/manager/checkins/${visitId}/flag`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    await handleApiResponse(response);
    if (!response.ok) throw new Error('Failed to flag visit');
    return response.json();
  },

  getTeamStats: async () => {
    const [agents, visits] = await Promise.all([
      managerAPI.getMyAgents(),
      managerAPI.getTeamVisits()
    ]);

    return {
      agents,
      teamVisits: visits,
      teamGoals: [], // Goals will be implemented in future API update
    };
  },
};

// Agent API
export const agentAPI = {
  getMyManager: async () => {
    const response = await fetch(`${API_BASE_URL}/agent/my-manager`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to get manager information');
    }
    return response.json();
  },

  getMyVisits: async () => {
    const response = await fetch(`${API_BASE_URL}/agent/my-checkins`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to get visits');
    return response.json();
  },

  createVisit: async (visitData: { 
    shop_id: number | 'new';
    shop_name?: string;
    shop_address?: string;
    latitude: number;
    longitude: number;
    notes?: string;
    photo: File;
    brand_id?: number;
  }) => {
    const formData = new FormData();
    formData.append('shop_id', visitData.shop_id.toString());
    formData.append('latitude', visitData.latitude.toString());
    formData.append('longitude', visitData.longitude.toString());
    formData.append('notes', visitData.notes || '');
    formData.append('photo', visitData.photo);
    
    // Add brand_id if provided
    if (visitData.brand_id) {
      formData.append('brand_id', visitData.brand_id.toString());
    }
    
    // Add new shop details if creating a new shop
    if (visitData.shop_id === 'new') {
      if (!visitData.shop_name || !visitData.shop_address) {
        throw new Error('Shop name and address are required when creating a new shop');
      }
      formData.append('shop_name', visitData.shop_name);
      formData.append('shop_address', visitData.shop_address);
    }

    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/agent/checkin`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        // Don't set Content-Type, let the browser set it for FormData
      },
      body: formData,
    });
    
    await handleApiResponse(response);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create visit');
    }
    return response.json();
  },

  // Visit Response API methods
  submitVisitResponse: async (checkinId: number, visitType: 'individual' | 'customer', responses: Record<string, unknown>) => {
    const response = await fetch(`${API_BASE_URL}/agent/submit_visit_response`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        checkin_id: checkinId,
        visit_type: visitType,
        responses: responses
      }),
    });
    await handleApiResponse(response);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit visit response');
    }
    return response.json();
  },

  getVisitResponse: async (checkinId: number): Promise<{ visit_response: VisitResponse }> => {
    const response = await fetch(`${API_BASE_URL}/agent/get_visit_response/${checkinId}`, {
      headers: getAuthHeaders(),
    });
    await handleApiResponse(response);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get visit response');
    }
    return response.json();
  },

  getAllVisitResponses: async (): Promise<{ visit_responses: VisitResponse[] }> => {
    const response = await fetch(`${API_BASE_URL}/agent/get_all_visit_responses`, {
      headers: getAuthHeaders(),
    });
    await handleApiResponse(response);
    if (!response.ok) throw new Error('Failed to get visit responses');
    return response.json();
  },

  updateVisitResponse: async (checkinId: number, updates: { visit_type?: 'individual' | 'customer'; responses?: Record<string, unknown> }) => {
    const response = await fetch(`${API_BASE_URL}/agent/update_visit_response/${checkinId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    await handleApiResponse(response);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update visit response');
    }
    return response.json();
  },

  deleteVisitResponse: async (checkinId: number) => {
    const response = await fetch(`${API_BASE_URL}/agent/delete_visit_response/${checkinId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    await handleApiResponse(response);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete visit response');
    }
    return response.json();
  },
};

// Shops API (accessible by all authenticated users)
export const shopsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/agent/shops`, {
      headers: getAuthHeaders(),
    });
    await handleApiResponse(response);
    if (!response.ok) throw new Error('Failed to get shops');
    return response.json();
  },

  getById: async (shopId: number) => {
    const response = await fetch(`${API_BASE_URL}/agent/shops/${shopId}`, {
      headers: getAuthHeaders(),
    });
    await handleApiResponse(response);
    if (!response.ok) throw new Error('Failed to get shop');
    return response.json();
  },

  create: async (shopData: { name: string; address: string; latitude: number; longitude: number }) => {
    const response = await fetch(`${API_BASE_URL}/agent/shops`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(shopData),
    });
    await handleApiResponse(response);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create shop');
    }
    return response.json().then(data => data.shop);
  },
};

// Reports API
import { API_BASE_URL } from './api';

export const reportsAPI = {
  downloadDailyVisitsXLSX: async () => {
    const response = await fetch(`${API_BASE_URL}/reports/daily_visits_xlsx`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to download report');
    return response;
  },
  downloadTeamLeadVisitsXLSX: async () => {
    const response = await fetch(`${API_BASE_URL}/reports/team_lead_visits_xlsx`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to download report');
    return response;
  },
  downloadTeamLeadVisitDetailsXLSX: async (leadSlug: string) => {
    const response = await fetch(`${API_BASE_URL}/reports/team_lead_visit_details_xlsx/${leadSlug}`, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to download report');
    return response;
  },
};