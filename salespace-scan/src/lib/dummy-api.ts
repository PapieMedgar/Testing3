// Dummy API service for demo purposes
// This replaces the real API calls with mock data

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'AGENT';
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
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'FLAGGED';
  agent_name?: string;
  shop_name?: string;
}

export interface Visit {
  id: number;
  shop_id: number;
  shop_name: string;
  shop_address: string;
  scheduled_date: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'MISSED';
  distance?: string;
}

// Dummy data
const DUMMY_SHOPS: Shop[] = [
  { id: 1, name: "SuperMart Downtown", address: "123 Main St, Downtown", latitude: -1.2921, longitude: 36.8219 },
  { id: 2, name: "TechStore Westlands", address: "456 Tech Ave, Westlands", latitude: -1.2676, longitude: 36.8078 },
  { id: 3, name: "FashionHub Karen", address: "789 Fashion Blvd, Karen", latitude: -1.3197, longitude: 36.6857 },
  { id: 4, name: "Electronics Plus", address: "321 Circuit St, Industrial Area", latitude: -1.3032, longitude: 36.8418 },
  { id: 5, name: "MegaMall Sarit", address: "654 Shopping Center, Sarit", latitude: -1.2574, longitude: 36.7865 },
];

const DUMMY_AGENTS: User[] = [
  { id: 2, username: "john_agent", email: "john@salesync.com", role: "AGENT" },
  { id: 3, username: "sarah_agent", email: "sarah@salesync.com", role: "AGENT" },
  { id: 4, username: "mike_agent", email: "mike@salesync.com", role: "AGENT" },
  { id: 5, username: "lisa_agent", email: "lisa@salesync.com", role: "AGENT" },
];

const DUMMY_MANAGERS: User[] = [
  { id: 6, username: "manager1", email: "manager1@salesync.com", role: "MANAGER" },
  { id: 7, username: "manager2", email: "manager2@salesync.com", role: "MANAGER" },
];

const DUMMY_CHECKINS: CheckIn[] = [
  {
    id: 1,
    agent_id: 2,
    shop_id: 1,
    timestamp: "2025-08-17T10:30:00Z",
    latitude: -1.2921,
    longitude: 36.8219,
    notes: "All products restocked successfully",
    status: "APPROVED",
    agent_name: "John Agent",
    shop_name: "SuperMart Downtown"
  },
  {
    id: 2,
    agent_id: 3,
    shop_id: 2,
    timestamp: "2025-08-17T14:15:00Z",
    latitude: -1.2676,
    longitude: 36.8078,
    notes: "New display setup completed",
    status: "PENDING",
    agent_name: "Sarah Agent",
    shop_name: "TechStore Westlands"
  },
  {
    id: 3,
    agent_id: 4,
    shop_id: 3,
    timestamp: "2025-08-16T09:45:00Z",
    latitude: -1.3197,
    longitude: 36.6857,
    notes: "Customer feedback collected",
    status: "FLAGGED",
    agent_name: "Mike Agent",
    shop_name: "FashionHub Karen"
  },
  {
    id: 4,
    agent_id: 2,
    shop_id: 4,
    timestamp: "2025-08-16T16:20:00Z",
    latitude: -1.3032,
    longitude: 36.8418,
    notes: "Inventory check completed",
    status: "APPROVED",
    agent_name: "John Agent",
    shop_name: "Electronics Plus"
  },
];

const DUMMY_VISITS: Visit[] = [
  {
    id: 1,
    shop_id: 1,
    shop_name: "SuperMart Downtown",
    shop_address: "123 Main St, Downtown",
    scheduled_date: "2025-08-18",
    status: "SCHEDULED",
    distance: "2.3 km"
  },
  {
    id: 2,
    shop_id: 2,
    shop_name: "TechStore Westlands",
    shop_address: "456 Tech Ave, Westlands",
    scheduled_date: "2025-08-18",
    status: "SCHEDULED",
    distance: "5.1 km"
  },
  {
    id: 3,
    shop_id: 3,
    shop_name: "FashionHub Karen",
    shop_address: "789 Fashion Blvd, Karen",
    scheduled_date: "2025-08-17",
    status: "COMPLETED",
    distance: "8.7 km"
  },
  {
    id: 4,
    shop_id: 5,
    shop_name: "MegaMall Sarit",
    shop_address: "654 Shopping Center, Sarit",
    scheduled_date: "2025-08-19",
    status: "SCHEDULED",
    distance: "3.4 km"
  },
];

// Simulated delay for realistic feel
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Authentication services (dummy)
export const authService = {
  login: async (credentials: { username: string; password: string }) => {
    await delay();
    return { id: 1, username: 'demo_user', email: 'demo@salesync.com', role: 'MANAGER' as const };
  },

  logout: () => {
    // Do nothing for demo
  },

  getCurrentUser: async (): Promise<User | null> => {
    await delay();
    return { id: 1, username: 'demo_user', email: 'demo@salesync.com', role: 'MANAGER' as const };
  }
};

// Admin services (dummy)
export const adminService = {
  getManagers: async () => {
    await delay();
    return DUMMY_MANAGERS;
  },

  createManager: async (managerData: Partial<User>) => {
    await delay();
    const newManager = { ...managerData, id: Date.now(), role: 'MANAGER' as const };
    return newManager;
  },

  deleteManager: async (managerId: number) => {
    await delay();
    return { success: true };
  },

  getShops: async () => {
    await delay();
    return DUMMY_SHOPS;
  },

  createShop: async (shopData: Partial<Shop>) => {
    await delay();
    const newShop = { ...shopData, id: Date.now() };
    return newShop;
  },

  updateShop: async (shopId: number, shopData: Partial<Shop>) => {
    await delay();
    return { ...shopData, id: shopId };
  },

  deleteShop: async (shopId: number) => {
    await delay();
    return { success: true };
  },

  getAllCheckins: async () => {
    await delay();
    return DUMMY_CHECKINS;
  }
};

// Manager services (dummy)
export const managerService = {
  getAssignedAgents: async () => {
    await delay();
    return DUMMY_AGENTS;
  },

  assignShopToAgent: async (shopId: number, agentId: number) => {
    await delay();
    return { success: true, shop_id: shopId, agent_id: agentId };
  },

  getManagerCheckins: async () => {
    await delay();
    return DUMMY_CHECKINS;
  },

  flagCheckin: async (checkinId: number) => {
    await delay();
    return { success: true, checkin_id: checkinId };
  },

  getShopVisitHistory: async () => {
    await delay();
    return DUMMY_CHECKINS.map(checkin => ({
      ...checkin,
      shop_name: DUMMY_SHOPS.find(shop => shop.id === checkin.shop_id)?.name || 'Unknown Shop'
    }));
  }
};

// Agent services (dummy)
export const agentService = {
  getAssignedVisits: async () => {
    await delay();
    return DUMMY_VISITS;
  },

  createCheckin: async (checkinData: FormData) => {
    await delay();
    const newCheckin = {
      id: Date.now(),
      agent_id: 1,
      shop_id: 1,
      timestamp: new Date().toISOString(),
      latitude: -1.2921,
      longitude: 36.8219,
      notes: checkinData.get('notes') as string || '',
      status: 'PENDING' as const
    };
    return newCheckin;
  },

  getCheckinHistory: async () => {
    await delay();
    return DUMMY_CHECKINS.filter(checkin => checkin.agent_id === 1);
  }
};

// Dashboard data
export const dashboardService = {
  getStats: async () => {
    await delay();
    return {
      totalVisits: 42,
      completedVisits: 38,
      pendingVisits: 4,
      totalShops: DUMMY_SHOPS.length,
      activeAgents: DUMMY_AGENTS.length,
      completionRate: 90.5
    };
  },

  getRecentActivity: async () => {
    await delay();
    return DUMMY_CHECKINS.slice(0, 5).map(checkin => ({
      id: checkin.id,
      message: `${checkin.agent_name} checked in at ${checkin.shop_name}`,
      timestamp: checkin.timestamp,
      type: checkin.status === 'APPROVED' ? 'success' : checkin.status === 'FLAGGED' ? 'warning' : 'info'
    }));
  }
};
