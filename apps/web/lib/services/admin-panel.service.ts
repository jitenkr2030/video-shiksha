import { prisma } from '@/lib/db';
import { analyticsService } from './analytics.service';
import { securityService } from './security.service';
import { monetizationService } from './monetization.service';
import { userManagementService } from './user-management.service';
import { startOfDay, endOfDay, subDays, subMonths, format } from 'date-fns';

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
    plan: string;
    status: 'active' | 'inactive' | 'suspended';
    credits: number;
    videosCreated: number;
    lastLoginAt: Date;
    createdAt: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    role?: string;
    plan?: string;
    status?: string;
    search?: string;
  };
}

export interface SystemConfiguration {
  general: {
    siteName: string;
    siteUrl: string;
    supportEmail: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    defaultPlan: string;
  };
  security: {
    maxLoginAttempts: number;
    lockoutDuration: number;
    sessionTimeout: number;
    twoFactorRequired: boolean;
    allowedIpRanges: string[];
    blockedCountries: string[];
  };
  limits: {
    freePlanVideos: number;
    freePlanStorage: number;
    maxFileSize: number;
    maxVideoLength: number;
    concurrentJobs: number;
  };
  features: {
    aiScriptGeneration: boolean;
    multilingualSupport: boolean;
    advancedAnalytics: boolean;
    apiAccess: boolean;
    whiteLabel: boolean;
  };
  notifications: {
    emailEnabled: boolean;
    smtpSettings: {
      host: string;
      port: number;
      secure: boolean;
      user: string;
      password: string;
    };
    templates: {
      welcome: boolean;
      passwordReset: boolean;
      paymentConfirmation: boolean;
      subscriptionExpiry: boolean;
    };
  };
}

export interface ContentModeration {
  pendingVideos: Array<{
    id: string;
    title: string;
    userId: string;
    userName: string;
    thumbnailUrl: string;
    duration: number;
    createdAt: Date;
    flags: Array<{
      type: 'inappropriate' | 'copyright' | 'spam' | 'quality';
      description: string;
      severity: 'low' | 'medium' | 'high';
    }>;
  }>;
  reportedContent: Array<{
    id: string;
    type: 'video' | 'comment' | 'user';
    contentId: string;
    reporterId: string;
    reason: string;
    description: string;
    status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
    createdAt: Date;
  }>;
  moderationQueue: {
    totalPending: number;
    averageReviewTime: number;
    moderatorsOnline: number;
    resolutionRate: number;
  };
}

export class AdminPanelService {
  async getDashboard(timeRange: { start: Date; end: Date }): Promise<AdminDashboard> {
    // Get overview metrics
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: subDays(new Date(), 30)
        }
      }
    });

    const revenueData = await monetizationService.getRevenueStats(timeRange.start, timeRange.end);
    const totalRevenue = revenueData.totalRevenue;

    const totalVideos = await prisma.video.count({
      where: {
        createdAt: {
          gte: timeRange.start,
          lte: timeRange.end
        }
      }
    });

    const systemHealth = await this.getSystemHealth();
    const recentActivity = await this.getRecentActivity();

    // Get metrics data
    const userGrowth = await this.getUserGrowthData(timeRange);
    const revenueChart = await this.getRevenueChartData(timeRange);
    const videoStats = await this.getVideoStatsData(timeRange);
    const systemLoad = await this.getSystemLoadData();

    // Get alerts
    const alerts = await this.getActiveAlerts();

    return {
      overview: {
        totalUsers,
        activeUsers,
        totalRevenue,
        totalVideos,
        systemHealth,
        recentActivity
      },
      metrics: {
        userGrowth,
        revenueChart,
        videoStats,
        systemLoad
      },
      alerts
    };
  }

  async getUsers(filters: UserManagement['filters'], pagination: { page: number; limit: number }): Promise<UserManagement> {
    const where: any = {};

    if (filters.role) where.role = filters.role;
    if (filters.plan) where.plan = filters.plan;
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const skip = (pagination.page - 1) * pagination.limit;
    const total = await prisma.user.count({ where });
    const totalPages = Math.ceil(total / pagination.limit);

    const users = await prisma.user.findMany({
      where,
      include: {
        _count: {
          select: { videos: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pagination.limit
    });

    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan,
      status: user.lockedUntil && user.lockedUntil > new Date() ? 'suspended' : 'active',
      credits: user.credits,
      videosCreated: user._count.videos,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt
    }));

    return {
      users: formattedUsers,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages
      },
      filters
    };
  }

  async updateUserStatus(userId: string, status: 'active' | 'suspended' | 'inactive', reason?: string): Promise<void> {
    const updateData: any = { updatedAt: new Date() };

    if (status === 'suspended') {
      updateData.lockedUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
    } else {
      updateData.lockedUntil = null;
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    // Log the action
    await prisma.adminActionLog.create({
      data: {
        userId,
        action: 'update_user_status',
        details: { status, reason },
        timestamp: new Date()
      }
    });
  }

  async updateUserRole(userId: string, role: 'student' | 'teacher' | 'admin'): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { 
        role,
        updatedAt: new Date()
      }
    });

    // Log the action
    await prisma.adminActionLog.create({
      data: {
        userId,
        action: 'update_user_role',
        details: { newRole: role },
        timestamp: new Date()
      }
    });
  }

  async addCreditsToUser(userId: string, amount: number, reason: string): Promise<void> {
    await userManagementService.addCredits(userId, amount, reason);

    // Log the action
    await prisma.adminActionLog.create({
      data: {
        userId,
        action: 'add_credits',
        details: { amount, reason },
        timestamp: new Date()
      }
    });
  }

  async getSystemConfiguration(): Promise<SystemConfiguration> {
    const config = await prisma.systemConfiguration.findFirst({
      where: { active: true }
    });

    if (!config) {
      return this.getDefaultConfiguration();
    }

    return config.settings as SystemConfiguration;
  }

  async updateSystemConfiguration(settings: Partial<SystemConfiguration>): Promise<void> {
    await prisma.systemConfiguration.upsert({
      where: { id: 'default' },
      update: {
        settings,
        updatedAt: new Date()
      },
      create: {
        id: 'default',
        settings,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Log the action
    await prisma.adminActionLog.create({
      data: {
        action: 'update_system_configuration',
        details: { updatedKeys: Object.keys(settings) },
        timestamp: new Date()
      }
    });
  }

  async getContentModeration(): Promise<ContentModeration> {
    // Get pending videos
    const pendingVideos = await prisma.video.findMany({
      where: {
        status: 'pending_review'
      },
      include: {
        user: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const formattedVideos = pendingVideos.map(video => ({
      id: video.id,
      title: video.title,
      userId: video.userId,
      userName: video.user.name,
      thumbnailUrl: video.thumbnailUrl || '',
      duration: video.duration || 0,
      createdAt: video.createdAt,
      flags: [] // Would be populated from moderation flags
    }));

    // Get reported content
    const reportedContent = await prisma.reportedContent.findMany({
      where: {
        status: 'pending'
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Get moderation queue stats
    const moderationQueue = await this.getModerationQueueStats();

    return {
      pendingVideos: formattedVideos,
      reportedContent,
      moderationQueue
    };
  }

  async approveVideo(videoId: string): Promise<void> {
    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: 'approved',
        updatedAt: new Date()
      }
    });

    // Log the action
    await prisma.adminActionLog.create({
      data: {
        action: 'approve_video',
        details: { videoId },
        timestamp: new Date()
      }
    });
  }

  async rejectVideo(videoId: string, reason: string): Promise<void> {
    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: 'rejected',
        rejectionReason: reason,
        updatedAt: new Date()
      }
    });

    // Log the action
    await prisma.adminActionLog.create({
      data: {
        action: 'reject_video',
        details: { videoId, reason },
        timestamp: new Date()
      }
    });
  }

  async resolveReport(reportId: string, action: 'approve' | 'remove' | 'dismiss', note?: string): Promise<void> {
    await prisma.reportedContent.update({
      where: { id: reportId },
      data: {
        status: 'resolved',
        resolution: action,
        adminNote: note,
        updatedAt: new Date()
      }
    });

    // Log the action
    await prisma.adminActionLog.create({
      data: {
        action: 'resolve_report',
        details: { reportId, action, note },
        timestamp: new Date()
      }
    });
  }

  async getSystemLogs(filters: {
    level?: 'info' | 'warning' | 'error' | 'debug';
    startDate?: Date;
    endDate?: Date;
    search?: string;
  }): Promise<Array<{
    id: string;
    level: string;
    message: string;
    timestamp: Date;
    source: string;
    details?: any;
  }>> {
    // This would typically integrate with a logging service
    // For now, return placeholder data
    return [];
  }

  async exportData(type: 'users' | 'videos' | 'payments' | 'analytics', format: 'csv' | 'json' | 'xlsx'): Promise<string> {
    const exportId = `export_${type}_${Date.now()}.${format}`;
    
    // Generate export based on type
    let data: any[] = [];
    
    switch (type) {
      case 'users':
        data = await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            plan: true,
            credits: true,
            createdAt: true,
            lastLoginAt: true
          }
        });
        break;
      case 'videos':
        data = await prisma.video.findMany({
          include: {
            user: {
              select: { name: true }
            }
          }
        });
        break;
      case 'payments':
        data = await prisma.payment.findMany({
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        });
        break;
      case 'analytics':
        // This would aggregate analytics data
        data = [];
        break;
    }

    // Generate file based on format
    const fileContent = this.generateExportFile(data, format);
    
    // Upload to storage
    const fileUrl = await storage.uploadFile(
      Buffer.from(fileContent, 'utf-8'),
      `exports/${exportId}`,
      `application/${format === 'csv' ? 'csv' : format === 'json' ? 'json' : 'vnd.openxmlformats-officedocument.spreadsheetml.sheet'}`
    );

    return fileUrl;
  }

  async runSystemMaintenance(): Promise<{
    success: boolean;
    tasks: Array<{
      name: string;
      status: 'completed' | 'failed' | 'skipped';
      message: string;
    }>;
  }> {
    const tasks = [];
    
    try {
      // Clean up expired tokens
      await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });
      tasks.push({ name: 'Clean expired tokens', status: 'completed' as const, message: 'Removed expired refresh tokens' });
    } catch (error) {
      tasks.push({ name: 'Clean expired tokens', status: 'failed' as const, message: error.message });
    }

    try {
      // Clean up old audit logs
      const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days
      await prisma.securityAuditLog.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      });
      tasks.push({ name: 'Clean old audit logs', status: 'completed' as const, message: 'Removed audit logs older than 90 days' });
    } catch (error) {
      tasks.push({ name: 'Clean old audit logs', status: 'failed' as const, message: error.message });
    }

    try {
      // Update user statistics
      await this.updateUserStatistics();
      tasks.push({ name: 'Update user statistics', status: 'completed' as const, message: 'User statistics updated successfully' });
    } catch (error) {
      tasks.push({ name: 'Update user statistics', status: 'failed' as const, message: error.message });
    }

    return {
      success: tasks.every(task => task.status === 'completed'),
      tasks
    };
  }

  private async getSystemHealth(): Promise<AdminDashboard['overview']['systemHealth']> {
    // This would typically integrate with monitoring services
    return {
      uptime: 99.9,
      errorRate: 0.1,
      averageResponseTime: 250,
      queueSize: 15
    };
  }

  private async getRecentActivity(): Promise<AdminDashboard['overview']['recentActivity']> {
    const activities = await prisma.adminActionLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 10,
      include: {
        user: {
          select: { name: true }
        }
      }
    });

    return activities.map(activity => ({
      id: activity.id,
      type: this.getActivityType(activity.action),
      message: this.formatActivityMessage(activity),
      timestamp: activity.timestamp,
      severity: this.getActivitySeverity(activity.action)
    }));
  }

  private getActivityType(action: string): 'user' | 'video' | 'payment' | 'security' {
    if (action.includes('user')) return 'user';
    if (action.includes('video')) return 'video';
    if (action.includes('payment')) return 'payment';
    if (action.includes('security')) return 'security';
    return 'user';
  }

  private formatActivityMessage(activity: any): string {
    switch (activity.action) {
      case 'update_user_status':
        return `Updated user status: ${activity.details.status}`;
      case 'update_user_role':
        return `Updated user role to ${activity.details.newRole}`;
      case 'add_credits':
        return `Added ${activity.details.amount} credits to user`;
      case 'approve_video':
        return 'Approved video';
      case 'reject_video':
        return 'Rejected video';
      default:
        return activity.action;
    }
  }

  private getActivitySeverity(action: string): 'info' | 'warning' | 'error' {
    if (action.includes('reject') || action.includes('suspend')) return 'warning';
    if (action.includes('error') || action.includes('failed')) return 'error';
    return 'info';
  }

  private async getUserGrowthData(timeRange: { start: Date; end: Date }): Promise<AdminDashboard['metrics']['userGrowth']> {
    const days = Math.ceil((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const data = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(timeRange.start.getTime() + i * 24 * 60 * 60 * 1000);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const totalUsers = await prisma.user.count({
        where: {
          createdAt: {
            lte: dayEnd
          }
        }
      });

      const newUsers = await prisma.user.count({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      });

      data.push({
        date: format(date, 'yyyy-MM-dd'),
        users: totalUsers,
        newUsers
      });
    }

    return data;
  }

  private async getRevenueChartData(timeRange: { start: Date; end: Date }): Promise<AdminDashboard['metrics']['revenueChart']> {
    // This would aggregate revenue data by day
    return [];
  }

  private async getVideoStatsData(timeRange: { start: Date; end: Date }): Promise<AdminDashboard['metrics']['videoStats']> {
    // This would aggregate video statistics by day
    return [];
  }

  private async getSystemLoadData(): Promise<AdminDashboard['metrics']['systemLoad']> {
    // This would get system load metrics from monitoring
    return [];
  }

  private async getActiveAlerts(): Promise<AdminDashboard['alerts']> {
    // This would get active alerts from monitoring system
    return [];
  }

  private getDefaultConfiguration(): SystemConfiguration {
    return {
      general: {
        siteName: 'VideoShiksha',
        siteUrl: 'https://videoshiksha.com',
        supportEmail: 'support@videoshiksha.com',
        maintenanceMode: false,
        registrationEnabled: true,
        defaultPlan: 'free'
      },
      security: {
        maxLoginAttempts: 5,
        lockoutDuration: 30,
        sessionTimeout: 60,
        twoFactorRequired: false,
        allowedIpRanges: [],
        blockedCountries: []
      },
      limits: {
        freePlanVideos: 5,
        freePlanStorage: 1024, // 1GB
        maxFileSize: 100 * 1024 * 1024, // 100MB
        maxVideoLength: 600, // 10 minutes
        concurrentJobs: 3
      },
      features: {
        aiScriptGeneration: true,
        multilingualSupport: true,
        advancedAnalytics: true,
        apiAccess: false,
        whiteLabel: false
      },
      notifications: {
        emailEnabled: true,
        smtpSettings: {
          host: '',
          port: 587,
          secure: false,
          user: '',
          password: ''
        },
        templates: {
          welcome: true,
          passwordReset: true,
          paymentConfirmation: true,
          subscriptionExpiry: true
        }
      }
    };
  }

  private async getModerationQueueStats(): Promise<ContentModeration['moderationQueue']> {
    const totalPending = await prisma.video.count({
      where: {
        status: 'pending_review'
      }
    });

    return {
      totalPending,
      averageReviewTime: 15, // minutes
      moderatorsOnline: 2,
      resolutionRate: 85 // percentage
    };
  }

  private generateExportFile(data: any[], format: string): string {
    switch (format) {
      case 'csv':
        return this.generateCSV(data);
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'xlsx':
        return this.generateXLSX(data);
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  private generateCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }

  private generateXLSX(data: any[]): string {
    // This would use a library like xlsx to generate Excel files
    return JSON.stringify(data, null, 2);
  }

  private async updateUserStatistics(): Promise<void> {
    // Update user statistics like video counts, storage usage, etc.
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: { videos: true }
        }
      }
    });

    for (const user of users) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          usage: {
            videosCreated: user._count.videos,
            storageUsed: 0, // Would calculate from actual storage
            bandwidthUsed: 0,
            apiCalls: 0
          }
        }
      });
    }
  }
}

export const adminPanelService = new AdminPanelService();