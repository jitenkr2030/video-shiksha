// Admin panel service - Mock implementation for landing page deployment
// Database functionality is disabled for landing page deployment

export interface AdminDashboard {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalRevenue: number;
    totalVideos: number;
    systemHealth: {
      uptime: number;
      errorRate: number;
      averageResponseTime: number;
      queueSize: number;
    };
    recentActivity: Array<{
      id: string;
      type: 'user' | 'video' | 'payment' | 'security';
      message: string;
      timestamp: Date;
      severity: 'info' | 'warning' | 'error';
    }>;
  };
  metrics: {
    userGrowth: Array<{ date: string; users: number; newUsers: number }>;
    revenueChart: Array<{ date: string; revenue: number; subscriptions: number; credits: number }>;
    videoStats: Array<{ date: string; created: number; completed: number; failed: number }>;
    systemLoad: Array<{ time: string; cpu: number; memory: number; disk: number }>;
  };
  alerts: Array<{
    id: string;
    type: 'security' | 'performance' | 'business' | 'system';
    title: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
    acknowledged: boolean;
  }>;
}

export interface UserManagement {
  users: Array<{
    id: string;
    email: string;
    name: string;
    role: 'student' | 'teacher' | 'admin';
    status: 'active' | 'inactive' | 'suspended';
    credits: number;
    videosCreated: number;
    storageUsed: number;
    joinedAt: Date;
    lastActive: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  lastCheck: Date;
  services: Array<{
    name: string;
    status: 'up' | 'down' | 'degraded';
    latency: number;
    lastError?: string;
  }>;
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkIn: number;
    networkOut: number;
  };
}

// Mock admin panel service for landing page
export class AdminPanelService {
  async getDashboard(): Promise<AdminDashboard> {
    return {
      overview: {
        totalUsers: 1000,
        activeUsers: 150,
        totalRevenue: 15000,
        totalVideos: 500,
        systemHealth: {
          uptime: 99.9,
          errorRate: 0.1,
          averageResponseTime: 150,
          queueSize: 5
        },
        recentActivity: []
      },
      metrics: {
        userGrowth: [],
        revenueChart: [],
        videoStats: [],
        systemLoad: []
      },
      alerts: []
    };
  }

  async getUsers(): Promise<UserManagement> {
    return {
      users: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
    };
  }

  async getSystemHealth(): Promise<SystemHealth> {
    return {
      status: 'healthy',
      uptime: 86400,
      lastCheck: new Date(),
      services: [],
      metrics: {
        cpuUsage: 45,
        memoryUsage: 60,
        diskUsage: 40,
        networkIn: 1000,
        networkOut: 2000
      }
    };
  }
}

export const adminPanelService = new AdminPanelService();
