import { prisma } from '@/lib/db';
import { startOfDay, endOfDay, subDays, subMonths, format } from 'date-fns';

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
    byResolution: Array<{
      resolution: string;
      count: number;
      percentage: number;
    }>;
  };
  performance: {
    averageRenderTime: number;
    successRate: number;
    errorTypes: Array<{
      error: string;
      count: number;
      percentage: number;
    }>;
  };
  engagement: {
    videoViews: number;
    averageWatchTime: number;
    shares: number;
    downloads: number;
    comments: number;
  };
}

export interface CourseAnalytics {
  overview: {
    totalEnrollments: number;
    completionRate: number;
    averageScore: number;
    totalRevenue: number;
    averageRating: number;
  };
  enrollment: Array<{
    date: string;
    enrollments: number;
    completions: number;
    revenue: number;
  }>;
  lessons: Array<{
    lessonId: string;
    title: string;
    views: number;
    averageWatchTime: number;
    completionRate: number;
    dropoffRate: number;
  }>;
  demographics: Array<{
    segment: string;
    count: number;
    percentage: number;
  }>;
  feedback: {
    averageRating: number;
    totalReviews: number;
    recentReviews: Array<{
      id: string;
      rating: number;
      comment: string;
      createdAt: Date;
    }>;
  };
}

export class AnalyticsService {
  async getPlatformAnalytics(timeRange: AnalyticsTimeRange): Promise<PlatformAnalytics> {
    const { start, end } = timeRange;

    // Overview metrics
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: subDays(new Date(), 30)
        }
      }
    });
    const totalVideos = await prisma.video.count({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      }
    });

    const revenueData = await this.getRevenueStats(start, end);
    const totalRevenue = revenueData.totalRevenue;

    const conversionRate = await this.calculateConversionRate(start, end);
    const churnRate = await this.calculateChurnRate(start, end);
    const averageSessionDuration = await this.getAverageSessionDuration(start, end);

    // User metrics
    const newUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      }
    });

    const returningUsers = activeUsers - newUsers;
    const userGrowthRate = await this.calculateUserGrowthRate(start, end);
    const topUserSegments = await this.getTopUserSegments(start, end);
    const userRetention = await this.getUserRetentionData(start, end);

    // Video metrics
    const videoMetrics = await this.getVideoMetrics(start, end);

    // Revenue metrics
    const revenueMetrics = await this.getRevenueMetrics(start, end);

    // Usage metrics
    const usageMetrics = await this.getUsageMetrics(start, end);

    // System health
    const systemHealth = await this.getSystemHealth();

    return {
      overview: {
        totalUsers,
        activeUsers,
        totalVideos,
        totalRevenue,
        conversionRate,
        churnRate,
        averageSessionDuration
      },
      userMetrics: {
        newUsers,
        returningUsers,
        userGrowthRate,
        topUserSegments,
        userRetention
      },
      videoMetrics,
      revenueMetrics,
      usageMetrics,
      systemHealth
    };
  }

  async getUserAnalytics(userId: string, timeRange: AnalyticsTimeRange): Promise<UserAnalytics> {
    const { start, end } = timeRange;

    // Overview
    const videosCreated = await prisma.video.count({
      where: {
        userId,
        createdAt: {
          gte: start,
          lte: end
        }
      }
    });

    const videos = await prisma.video.findMany({
      where: { userId },
      select: { duration: true }
    });

    const totalDuration = videos.reduce((sum, video) => sum + (video.duration || 0), 0);

    const creditTransactions = await prisma.creditTransaction.findMany({
      where: {
        userId,
        type: 'debit',
        createdAt: {
          gte: start,
          lte: end
        }
      }
    });

    const creditsUsed = creditTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { usage: true, lastLoginAt: true }
    });

    const storageUsed = user?.usage?.storageUsed || 0;
    const lastActivity = user?.lastLoginAt || new Date();

    // Activity timeline
    const activity = await this.getUserActivityTimeline(userId, start, end);

    // Usage breakdown
    const usage = await this.getUserUsageBreakdown(userId, start, end);

    // Performance metrics
    const performance = await this.getUserPerformanceMetrics(userId, start, end);

    // Engagement metrics
    const engagement = await this.getUserEngagementMetrics(userId, start, end);

    return {
      overview: {
        videosCreated,
        totalDuration,
        creditsUsed,
        storageUsed,
        lastActivity
      },
      activity,
      usage,
      performance,
      engagement
    };
  }

  async getCourseAnalytics(courseId: string, timeRange: AnalyticsTimeRange): Promise<CourseAnalytics> {
    const { start, end } = timeRange;

    // Overview
    const totalEnrollments = await prisma.courseEnrollment.count({
      where: {
        courseId,
        enrolledAt: {
          gte: start,
          lte: end
        }
      }
    });

    const completedEnrollments = await prisma.courseEnrollment.count({
      where: {
        courseId,
        completedAt: {
          gte: start,
          lte: end
        }
      }
    });

    const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;

    const assessmentSubmissions = await prisma.assessmentSubmission.findMany({
      where: {
        assessment: {
          course: {
            id: courseId
          }
        },
        submittedAt: {
          gte: start,
          lte: end
        }
      }
    });

    const averageScore = assessmentSubmissions.length > 0
      ? assessmentSubmissions.reduce((sum, submission) => sum + submission.score, 0) / assessmentSubmissions.length
      : 0;

    const totalRevenue = await this.getCourseRevenue(courseId, start, end);
    const averageRating = await this.getCourseAverageRating(courseId);

    // Enrollment timeline
    const enrollment = await this.getCourseEnrollmentTimeline(courseId, start, end);

    // Lesson analytics
    const lessons = await this.getCourseLessonAnalytics(courseId, start, end);

    // Demographics
    const demographics = await this.getCourseDemographics(courseId);

    // Feedback
    const feedback = await this.getCourseFeedback(courseId, start, end);

    return {
      overview: {
        totalEnrollments,
        completionRate,
        averageScore,
        totalRevenue,
        averageRating
      },
      enrollment,
      lessons,
      demographics,
      feedback
    };
  }

  private async calculateConversionRate(start: Date, end: Date): Promise<number> {
    const totalSignups = await prisma.user.count({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      }
    });

    const conversions = await prisma.subscription.count({
      where: {
        createdAt: {
          gte: start,
          lte: end
        },
        status: 'active'
      }
    });

    return totalSignups > 0 ? (conversions / totalSignups) * 100 : 0;
  }

  private async calculateChurnRate(start: Date, end: Date): Promise<number> {
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        status: 'active',
        currentPeriodStart: {
          lt: start
        }
      }
    });

    const cancelledSubscriptions = await prisma.subscription.count({
      where: {
        status: 'cancelled',
        updatedAt: {
          gte: start,
          lte: end
        }
      }
    });

    return activeSubscriptions > 0 ? (cancelledSubscriptions / activeSubscriptions) * 100 : 0;
  }

  private async getAverageSessionDuration(start: Date, end: Date): Promise<number> {
    // This would typically come from analytics tracking
    // For now, return a placeholder
    return 1800; // 30 minutes in seconds
  }

  private async calculateUserGrowthRate(start: Date, end: Date): Promise<number> {
    const previousPeriodStart = subDays(start, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    const currentUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      }
    });

    const previousUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: previousPeriodStart,
          lt: start
        }
      }
    });

    return previousUsers > 0 ? ((currentUsers - previousUsers) / previousUsers) * 100 : 0;
  }

  private async getTopUserSegments(start: Date, end: Date): Promise<Array<{ segment: string; count: number; percentage: number }>> {
    const users = await prisma.user.findMany({
      where: {
        createdAt: {
          lte: end
        }
      },
      select: { plan: true, role: true }
    });

    const segments = {
      'Free Students': users.filter(u => u.plan === 'free' && u.role === 'student').length,
      'Paid Students': users.filter(u => u.plan !== 'free' && u.role === 'student').length,
      'Free Teachers': users.filter(u => u.plan === 'free' && u.role === 'teacher').length,
      'Paid Teachers': users.filter(u => u.plan !== 'free' && u.role === 'teacher').length,
      'Admins': users.filter(u => u.role === 'admin').length
    };

    const total = users.length;
    return Object.entries(segments)
      .map(([segment, count]) => ({
        segment,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private async getUserRetentionData(start: Date, end: Date): Promise<Array<{ period: string; retentionRate: number }>> {
    // This would typically involve cohort analysis
    // For now, return placeholder data
    return [
      { period: 'Day 1', retentionRate: 100 },
      { period: 'Day 7', retentionRate: 75 },
      { period: 'Day 30', retentionRate: 45 },
      { period: 'Day 90', retentionRate: 25 }
    ];
  }

  private async getVideoMetrics(start: Date, end: Date): Promise<PlatformAnalytics['videoMetrics']> {
    const videos = await prisma.video.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      select: {
        duration: true,
        resolution: true,
        format: true,
        language: true,
        status: true
      }
    });

    const videosCreated = videos.length;
    const averageVideoLength = videos.length > 0
      ? videos.reduce((sum, video) => sum + (video.duration || 0), 0) / videos.length
      : 0;

    const formatCounts = videos.reduce((acc, video) => {
      acc[video.format || 'mp4'] = (acc[video.format || 'mp4'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const popularFormats = Object.entries(formatCounts)
      .map(([format, count]) => ({
        format,
        count,
        percentage: (count / videos.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const languageCounts = videos.reduce((acc, video) => {
      acc[video.language || 'en'] = (acc[video.language || 'en'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const popularLanguages = Object.entries(languageCounts)
      .map(([language, count]) => ({
        language,
        count,
        percentage: (count / videos.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const successfulVideos = videos.filter(video => video.status === 'completed').length;
    const renderSuccessRate = videos.length > 0 ? (successfulVideos / videos.length) * 100 : 0;
    const averageRenderTime = 120; // Placeholder

    return {
      videosCreated,
      averageVideoLength,
      popularFormats,
      popularLanguages,
      renderSuccessRate,
      averageRenderTime
    };
  }

  private async getRevenueMetrics(start: Date, end: Date): Promise<PlatformAnalytics['revenueMetrics']> {
    const revenueData = await this.getRevenueStats(start, end);
    
    const subscriptions = await prisma.subscription.findMany({
      where: { status: 'active' },
      include: { plan: true }
    });

    const revenueByPlan = subscriptions.reduce((acc, subscription) => {
      const planName = subscription.plan.name;
      if (!acc[planName]) {
        acc[planName] = { revenue: 0, users: 0 };
      }
      acc[planName].revenue += subscription.plan.price;
      acc[planName].users += 1;
      return acc;
    }, {} as Record<string, { revenue: number; users: number }>);

    const revenueByPlanArray = Object.entries(revenueByPlan).map(([planName, data]) => ({
      planName,
      revenue: data.revenue,
      users: data.users
    }));

    const activeUsers = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: subDays(new Date(), 30)
        }
      }
    });

    const averageRevenuePerUser = activeUsers > 0 ? revenueData.totalRevenue / activeUsers : 0;
    const revenueGrowthRate = await this.calculateRevenueGrowthRate(start, end);

    return {
      totalRevenue: revenueData.totalRevenue,
      recurringRevenue: revenueData.subscriptionRevenue,
      averageRevenuePerUser,
      revenueByPlan: revenueByPlanArray,
      revenueGrowthRate
    };
  }

  private async getUsageMetrics(start: Date, end: Date): Promise<PlatformAnalytics['usageMetrics']> {
    const creditTransactions = await prisma.creditTransaction.findMany({
      where: {
        type: 'debit',
        createdAt: {
          gte: start,
          lte: end
        }
      }
    });

    const totalCreditsUsed = creditTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

    const activeUsers = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: subDays(new Date(), 30)
        }
      }
    });

    const averageCreditsPerUser = activeUsers > 0 ? totalCreditsUsed / activeUsers : 0;

    // Storage and bandwidth would come from your storage service
    const storageUtilization = 65; // Placeholder percentage
    const bandwidthUtilization = 45; // Placeholder percentage

    const apiCallVolume = creditTransactions.length; // Simplified

    return {
      totalCreditsUsed,
      averageCreditsPerUser,
      storageUtilization,
      bandwidthUtilization,
      apiCallVolume
    };
  }

  private async getSystemHealth(): Promise<PlatformAnalytics['systemHealth']> {
    // These would typically come from monitoring services
    return {
      uptime: 99.9,
      errorRate: 0.1,
      averageResponseTime: 250,
      queueSize: 15,
      databaseConnections: 25
    };
  }

  private async getUserActivityTimeline(userId: string, start: Date, end: Date): Promise<UserAnalytics['activity']> {
    const videos = await prisma.video.findMany({
      where: {
        userId,
        createdAt: {
          gte: start,
          lte: end
        }
      },
      select: {
        createdAt: true,
        duration: true
      }
    });

    const creditTransactions = await prisma.creditTransaction.findMany({
      where: {
        userId,
        type: 'debit',
        createdAt: {
          gte: start,
          lte: end
        }
      },
      select: {
        createdAt: true,
        amount: true
      }
    });

    // Group by day
    const dailyData = new Map<string, UserAnalytics['activity'][0]>();

    videos.forEach(video => {
      const date = format(video.createdAt, 'yyyy-MM-dd');
      if (!dailyData.has(date)) {
        dailyData.set(date, {
          date,
          videosCreated: 0,
          creditsUsed: 0,
          renderTime: 0
        });
      }
      const day = dailyData.get(date)!;
      day.videosCreated++;
      day.renderTime += video.duration || 0;
    });

    creditTransactions.forEach(transaction => {
      const date = format(transaction.createdAt, 'yyyy-MM-dd');
      if (!dailyData.has(date)) {
        dailyData.set(date, {
          date,
          videosCreated: 0,
          creditsUsed: 0,
          renderTime: 0
        });
      }
      const day = dailyData.get(date)!;
      day.creditsUsed += transaction.amount;
    });

    return Array.from(dailyData.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  private async getUserUsageBreakdown(userId: string, start: Date, end: Date): Promise<UserAnalytics['usage']> {
    const videos = await prisma.video.findMany({
      where: {
        userId,
        createdAt: {
          gte: start,
          lte: end
        }
      },
      select: {
        language: true,
        format: true,
        resolution: true
      }
    });

    const totalVideos = videos.length;

    const languageCounts = videos.reduce((acc, video) => {
      acc[video.language || 'en'] = (acc[video.language || 'en'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byLanguage = Object.entries(languageCounts)
      .map(([language, count]) => ({
        language,
        count,
        percentage: totalVideos > 0 ? (count / totalVideos) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    const formatCounts = videos.reduce((acc, video) => {
      acc[video.format || 'mp4'] = (acc[video.format || 'mp4'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byFormat = Object.entries(formatCounts)
      .map(([format, count]) => ({
        format,
        count,
        percentage: totalVideos > 0 ? (count / totalVideos) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    const resolutionCounts = videos.reduce((acc, video) => {
      acc[video.resolution || '1080p'] = (acc[video.resolution || '1080p'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byResolution = Object.entries(resolutionCounts)
      .map(([resolution, count]) => ({
        resolution,
        count,
        percentage: totalVideos > 0 ? (count / totalVideos) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    return {
      byLanguage,
      byFormat,
      byResolution
    };
  }

  private async getUserPerformanceMetrics(userId: string, start: Date, end: Date): Promise<UserAnalytics['performance']> {
    const videos = await prisma.video.findMany({
      where: {
        userId,
        createdAt: {
          gte: start,
          lte: end
        }
      },
      select: {
        status: true,
        renderTime: true
      }
    });

    const totalVideos = videos.length;
    const successfulVideos = videos.filter(video => video.status === 'completed').length;
    const successRate = totalVideos > 0 ? (successfulVideos / totalVideos) * 100 : 0;

    const averageRenderTime = videos.length > 0
      ? videos.reduce((sum, video) => sum + (video.renderTime || 0), 0) / videos.length
      : 0;

    // Error types would come from error logging
    const errorTypes = [
      { error: 'Processing failed', count: 2, percentage: 40 },
      { error: 'Invalid format', count: 1, percentage: 20 },
      { error: 'Timeout', count: 2, percentage: 40 }
    ];

    return {
      averageRenderTime,
      successRate,
      errorTypes
    };
  }

  private async getUserEngagementMetrics(userId: string, start: Date, end: Date): Promise<UserAnalytics['engagement']> {
    // These would typically come from analytics tracking
    return {
      videoViews: 1250,
      averageWatchTime: 180,
      shares: 45,
      downloads: 23,
      comments: 12
    };
  }

  private async getRevenueStats(start: Date, end: Date): Promise<{
    totalRevenue: number;
    subscriptionRevenue: number;
    creditRevenue: number;
    refunds: number;
    netRevenue: number;
    transactionCount: number;
    averageTransactionValue: number;
  }> {
    const payments = await prisma.payment.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      }
    });

    const totalRevenue = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    const subscriptionRevenue = payments
      .filter(p => p.status === 'completed' && p.subscriptionId)
      .reduce((sum, p) => sum + p.amount, 0);

    const creditRevenue = payments
      .filter(p => p.status === 'completed' && !p.subscriptionId)
      .reduce((sum, p) => sum + p.amount, 0);

    const refunds = payments
      .filter(p => p.status === 'refunded')
      .reduce((sum, p) => sum + p.amount, 0);

    const completedPayments = payments.filter(p => p.status === 'completed');

    return {
      totalRevenue,
      subscriptionRevenue,
      creditRevenue,
      refunds,
      netRevenue: totalRevenue - refunds,
      transactionCount: completedPayments.length,
      averageTransactionValue: completedPayments.length > 0 ? totalRevenue / completedPayments.length : 0
    };
  }

  private async calculateRevenueGrowthRate(start: Date, end: Date): Promise<number> {
    const previousPeriodStart = subDays(start, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    const currentRevenue = await this.getRevenueStats(start, end);
    const previousRevenue = await this.getRevenueStats(previousPeriodStart, start);

    return previousRevenue.totalRevenue > 0
      ? ((currentRevenue.totalRevenue - previousRevenue.totalRevenue) / previousRevenue.totalRevenue) * 100
      : 0;
  }

  private async getCourseRevenue(courseId: string, start: Date, end: Date): Promise<number> {
    // This would calculate revenue from course purchases
    return 0; // Placeholder
  }

  private async getCourseAverageRating(courseId: string): Promise<number> {
    // This would calculate average rating from reviews
    return 4.5; // Placeholder
  }

  private async getCourseEnrollmentTimeline(courseId: string, start: Date, end: Date): Promise<CourseAnalytics['enrollment']> {
    // This would return daily enrollment data
    return []; // Placeholder
  }

  private async getCourseLessonAnalytics(courseId: string, start: Date, end: Date): Promise<CourseAnalytics['lessons']> {
    // This would return analytics for each lesson
    return []; // Placeholder
  }

  private async getCourseDemographics(courseId: string): Promise<CourseAnalytics['demographics']> {
    // This would return demographic data
    return []; // Placeholder
  }

  private async getCourseFeedback(courseId: string, start: Date, end: Date): Promise<CourseAnalytics['feedback']> {
    // This would return course reviews and feedback
    return {
      averageRating: 4.5,
      totalReviews: 23,
      recentReviews: []
    };
  }
}

export const analyticsService = new AnalyticsService();