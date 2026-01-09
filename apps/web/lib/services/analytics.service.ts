// Analytics service - Mock implementation for landing page deployment
// Database functionality is disabled for landing page deployment

export interface AnalyticsTimeRange {
  start: Date;
  end: Date;
  type: 'day' | 'week' | 'month' | 'year';
}

export interface PlatformAnalytics {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalVideos: number;
    totalRevenue: number;
    conversionRate: number;
    churnRate: number;
    averageSessionDuration: number;
  };
  userMetrics: {
    newUsers: number;
    returningUsers: number;
    userGrowthRate: number;
    topUserSegments: Array<{
      segment: string;
      count: number;
      percentage: number;
    }>;
    userRetention: Array<{
      period: string;
      retentionRate: number;
    }>;
  };
  videoMetrics: {
    videosCreated: number;
    averageVideoLength: number;
    popularFormats: Array<{
      format: string;
      count: number;
      percentage: number;
    }>;
    popularLanguages: Array<{
      language: string;
      count: number;
      percentage: number;
    }>;
    renderSuccessRate: number;
    averageRenderTime: number;
  };
  revenueMetrics: {
    totalRevenue: number;
    recurringRevenue: number;
    averageRevenuePerUser: number;
    revenueByPlan: Array<{
      planName: string;
      revenue: number;
      users: number;
    }>;
    revenueGrowthRate: number;
  };
  usageMetrics: {
    totalCreditsUsed: number;
    averageCreditsPerUser: number;
    storageUtilization: number;
    bandwidthUtilization: number;
    apiCallVolume: number;
  };
  systemHealth: {
    uptime: number;
    errorRate: number;
    averageResponseTime: number;
    queueSize: number;
    databaseConnections: number;
  };
}

export interface UserAnalytics {
  overview: {
    videosCreated: number;
    totalDuration: number;
    creditsUsed: number;
    storageUsed: number;
    lastActivity: Date;
  };
  activity: Array<{
    date: string;
    videosCreated: number;
    creditsUsed: number;
    renderTime: number;
  }>;
  usage: {
    byLanguage: Array<{
      language: string;
      count: number;
      percentage: number;
    }>;
    byFormat: Array<{
      format: string;
      count: number;
      percentage: number;
    }>;
  };
}

// Mock analytics service for landing page
export class AnalyticsService {
  async getPlatformAnalytics(): Promise<PlatformAnalytics> {
    return {
      overview: {
        totalUsers: 1000,
        activeUsers: 150,
        totalVideos: 500,
        totalRevenue: 15000,
        conversionRate: 5.5,
        churnRate: 2.1,
        averageSessionDuration: 12.5
      },
      userMetrics: {
        newUsers: 50,
        returningUsers: 100,
        userGrowthRate: 15.2,
        topUserSegments: [],
        userRetention: []
      },
      videoMetrics: {
        videosCreated: 500,
        averageVideoLength: 5.5,
        popularFormats: [],
        popularLanguages: [],
        renderSuccessRate: 98.5,
        averageRenderTime: 45
      },
      revenueMetrics: {
        totalRevenue: 15000,
        recurringRevenue: 12000,
        averageRevenuePerUser: 15,
        revenueByPlan: [],
        revenueGrowthRate: 12.5
      },
      usageMetrics: {
        totalCreditsUsed: 50000,
        averageCreditsPerUser: 50,
        storageUtilization: 35,
        bandwidthUtilization: 25,
        apiCallVolume: 10000
      },
      systemHealth: {
        uptime: 99.9,
        errorRate: 0.1,
        averageResponseTime: 150,
        queueSize: 5,
        databaseConnections: 10
      }
    };
  }

  async getUserAnalytics(): Promise<UserAnalytics> {
    return {
      overview: {
        videosCreated: 0,
        totalDuration: 0,
        creditsUsed: 0,
        storageUsed: 0,
        lastActivity: new Date()
      },
      activity: [],
      usage: {
        byLanguage: [],
        byFormat: []
      }
    };
  }
}

export const analyticsService = new AnalyticsService();
