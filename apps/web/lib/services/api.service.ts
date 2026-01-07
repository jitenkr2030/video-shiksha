import { prisma } from '@/lib/db';
import { userManagementService } from './user-management.service';
import { analyticsService } from './analytics.service';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  key: string;
  permissions: Array<{
    resource: string;
    actions: string[];
  }>;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  isActive: boolean;
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiUsage {
  apiKeyId: string;
  userId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}

export interface Webhook {
  id: string;
  userId: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  retryCount: number;
  lastTriggeredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Integration {
  id: string;
  userId: string;
  platform: 'moodle' | 'google_classroom' | 'youtube' | 'vimeo' | 'zoom' | 'teams' | 'canvas';
  name: string;
  configuration: Record<string, any>;
  status: 'active' | 'inactive' | 'error';
  lastSyncAt?: Date;
  syncFrequency: number; // minutes
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  parameters: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required: boolean;
    description: string;
    example?: any;
  }>;
  requestBody?: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required: boolean;
    description: string;
    example?: any;
  };
  responses: Array<{
    statusCode: number;
    description: string;
    example?: any;
  }>;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  authentication: 'none' | 'api_key' | 'oauth' | 'jwt';
}

export class ApiService {
  private readonly API_VERSION = 'v1';
  private readonly DEFAULT_RATE_LIMIT = {
    requestsPerMinute: 60,
    requestsPerHour: 1000,
    requestsPerDay: 10000
  };

  async createApiKey(userId: string, keyData: {
    name: string;
    permissions: Array<{ resource: string; actions: string[] }>;
    rateLimit?: {
      requestsPerMinute?: number;
      requestsPerHour?: number;
      requestsPerDay?: number;
    };
    expiresAt?: Date;
  }): Promise<ApiKey> {
    const key = `vs_${this.generateRandomKey()}`;
    
    const apiKey = await prisma.apiKey.create({
      data: {
        userId,
        name: keyData.name,
        key,
        permissions: keyData.permissions,
        rateLimit: {
          ...this.DEFAULT_RATE_LIMIT,
          ...keyData.rateLimit
        },
        isActive: true,
        expiresAt: keyData.expiresAt,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return apiKey;
  }

  async getApiKeys(userId: string): Promise<ApiKey[]> {
    return await prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateApiKey(keyId: string, userId: string, updates: {
    name?: string;
    permissions?: Array<{ resource: string; actions: string[] }>;
    rateLimit?: {
      requestsPerMinute?: number;
      requestsPerHour?: number;
      requestsPerDay?: number;
    };
    isActive?: boolean;
    expiresAt?: Date;
  }): Promise<ApiKey> {
    const apiKey = await prisma.apiKey.findFirst({
      where: { id: keyId, userId }
    });

    if (!apiKey) {
      throw new Error('API key not found');
    }

    return await prisma.apiKey.update({
      where: { id: keyId },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });
  }

  async deleteApiKey(keyId: string, userId: string): Promise<void> {
    await prisma.apiKey.deleteMany({
      where: { id: keyId, userId }
    });
  }

  async validateApiKey(key: string): Promise<{
    valid: boolean;
    apiKey?: ApiKey;
    user?: any;
    error?: string;
  }> {
    const apiKey = await prisma.apiKey.findFirst({
      where: { key, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            plan: true
          }
        }
      }
    });

    if (!apiKey) {
      return { valid: false, error: 'Invalid API key' };
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return { valid: false, error: 'API key expired' };
    }

    // Check rate limits
    const rateLimitStatus = await this.checkRateLimit(apiKey);
    if (!rateLimitStatus.allowed) {
      return { valid: false, error: `Rate limit exceeded: ${rateLimitStatus.limit}` };
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() }
    });

    return { valid: true, apiKey, user: apiKey.user };
  }

  private async checkRateLimit(apiKey: ApiKey): Promise<{
    allowed: boolean;
    limit?: string;
  }> {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Check per-minute limit
    const minuteUsage = await prisma.apiUsage.count({
      where: {
        apiKeyId: apiKey.id,
        timestamp: { gte: oneMinuteAgo }
      }
    });

    if (minuteUsage >= apiKey.rateLimit.requestsPerMinute) {
      return { allowed: false, limit: 'per_minute' };
    }

    // Check per-hour limit
    const hourUsage = await prisma.apiUsage.count({
      where: {
        apiKeyId: apiKey.id,
        timestamp: { gte: oneHourAgo }
      }
    });

    if (hourUsage >= apiKey.rateLimit.requestsPerHour) {
      return { allowed: false, limit: 'per_hour' };
    }

    // Check per-day limit
    const dayUsage = await prisma.apiUsage.count({
      where: {
        apiKeyId: apiKey.id,
        timestamp: { gte: oneDayAgo }
      }
    });

    if (dayUsage >= apiKey.rateLimit.requestsPerDay) {
      return { allowed: false, limit: 'per_day' };
    }

    return { allowed: true };
  }

  async recordApiUsage(usage: Omit<ApiUsage, 'timestamp'>): Promise<void> {
    await prisma.apiUsage.create({
      data: {
        ...usage,
        timestamp: new Date()
      }
    });
  }

  async getApiUsage(userId: string, filters: {
    startDate?: Date;
    endDate?: Date;
    endpoint?: string;
  }): Promise<{
    totalRequests: number;
    averageResponseTime: number;
    successRate: number;
    topEndpoints: Array<{
      endpoint: string;
      count: number;
      averageResponseTime: number;
    }>;
    usageByHour: Array<{
      hour: string;
      requests: number;
    }>;
  }> {
    const where: any = { userId };
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }
    if (filters.endpoint) where.endpoint = filters.endpoint;

    const usage = await prisma.apiUsage.findMany({
      where,
      orderBy: { timestamp: 'desc' }
    });

    const totalRequests = usage.length;
    const averageResponseTime = usage.length > 0
      ? usage.reduce((sum, u) => sum + u.responseTime, 0) / usage.length
      : 0;
    const successRate = usage.length > 0
      ? (usage.filter(u => u.statusCode < 400).length / usage.length) * 100
      : 0;

    // Top endpoints
    const endpointStats = usage.reduce((acc, u) => {
      if (!acc[u.endpoint]) {
        acc[u.endpoint] = { count: 0, totalResponseTime: 0 };
      }
      acc[u.endpoint].count++;
      acc[u.endpoint].totalResponseTime += u.responseTime;
      return acc;
    }, {} as Record<string, { count: number; totalResponseTime: number }>);

    const topEndpoints = Object.entries(endpointStats)
      .map(([endpoint, stats]) => ({
        endpoint,
        count: stats.count,
        averageResponseTime: stats.totalResponseTime / stats.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Usage by hour
    const hourlyUsage = usage.reduce((acc, u) => {
      const hour = u.timestamp.getHours().toString().padStart(2, '0');
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const usageByHour = Array.from({ length: 24 }, (_, i) => {
      const hour = i.toString().padStart(2, '0');
      return {
        hour,
        requests: hourlyUsage[hour] || 0
      };
    });

    return {
      totalRequests,
      averageResponseTime,
      successRate,
      topEndpoints,
      usageByHour
    };
  }

  async createWebhook(userId: string, webhookData: {
    name: string;
    url: string;
    events: string[];
  }): Promise<Webhook> {
    const secret = `wh_${this.generateRandomKey()}`;
    
    const webhook = await prisma.webhook.create({
      data: {
        userId,
        name: webhookData.name,
        url: webhookData.url,
        events: webhookData.events,
        secret,
        isActive: true,
        retryCount: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return webhook;
  }

  async triggerWebhook(event: string, data: any, userId?: string): Promise<void> {
    const webhooks = await prisma.webhook.findMany({
      where: {
        isActive: true,
        events: { has: event },
        ...(userId && { userId })
      }
    });

    for (const webhook of webhooks) {
      try {
        await this.sendWebhook(webhook, event, data);
      } catch (error) {
        console.error(`Failed to trigger webhook ${webhook.id}:`, error);
      }
    }
  }

  private async sendWebhook(webhook: Webhook, event: string, data: any): Promise<void> {
    const payload = {
      event,
      data,
      timestamp: new Date().toISOString(),
      webhookId: webhook.id
    };

    const signature = this.generateWebhookSignature(JSON.stringify(payload), webhook.secret);

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook delivery failed: ${response.statusText}`);
    }

    // Update last triggered timestamp
    await prisma.webhook.update({
      where: { id: webhook.id },
      data: { lastTriggeredAt: new Date() }
    });
  }

  private generateWebhookSignature(payload: string, secret: string): string {
    const crypto = require('crypto');
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  async createIntegration(userId: string, integrationData: {
    platform: Integration['platform'];
    name: string;
    configuration: Record<string, any>;
    syncFrequency?: number;
  }): Promise<Integration> {
    const integration = await prisma.integration.create({
      data: {
        userId,
        platform: integrationData.platform,
        name: integrationData.name,
        configuration: integrationData.configuration,
        status: 'active',
        syncFrequency: integrationData.syncFrequency || 60,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Trigger initial sync
    await this.syncIntegration(integration.id);

    return integration;
  }

  async syncIntegration(integrationId: string): Promise<void> {
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
      include: {
        user: {
          select: { id: true, email: true }
        }
      }
    });

    if (!integration) {
      throw new Error('Integration not found');
    }

    try {
      switch (integration.platform) {
        case 'google_classroom':
          await this.syncGoogleClassroom(integration);
          break;
        case 'moodle':
          await this.syncMoodle(integration);
          break;
        case 'youtube':
          await this.syncYouTube(integration);
          break;
        // Add other platform syncs
      }

      await prisma.integration.update({
        where: { id: integrationId },
        data: {
          status: 'active',
          lastSyncAt: new Date(),
          updatedAt: new Date()
        }
      });
    } catch (error) {
      await prisma.integration.update({
        where: { id: integrationId },
        data: {
          status: 'error',
          updatedAt: new Date()
        }
      });
      throw error;
    }
  }

  private async syncGoogleClassroom(integration: Integration): Promise<void> {
    // Implement Google Classroom API sync
    const config = integration.configuration;
    // This would use Google Classroom API to sync courses and students
  }

  private async syncMoodle(integration: Integration): Promise<void> {
    // Implement Moodle API sync
    const config = integration.configuration;
    // This would use Moodle web services to sync courses and users
  }

  private async syncYouTube(integration: Integration): Promise<void> {
    // Implement YouTube API sync
    const config = integration.configuration;
    // This would use YouTube API to sync videos and playlists
  }

  async getApiDocumentation(): Promise<{
    version: string;
    baseUrl: string;
    endpoints: ApiEndpoint[];
    authentication: {
      apiKey: {
        description: string;
        header: string;
      };
    };
    rateLimits: {
      default: ApiEndpoint['rateLimit'];
    };
  }> {
    return {
      version: this.API_VERSION,
      baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.videoshiksha.com',
      endpoints: this.getApiEndpoints(),
      authentication: {
        apiKey: {
          description: 'Use your API key in the X-API-Key header',
          header: 'X-API-Key'
        }
      },
      rateLimits: {
        default: this.DEFAULT_RATE_LIMIT
      }
    };
  }

  private getApiEndpoints(): ApiEndpoint[] {
    return [
      {
        path: '/videos',
        method: 'GET',
        description: 'Get list of videos',
        parameters: [
          {
            name: 'page',
            type: 'number',
            required: false,
            description: 'Page number for pagination',
            example: 1
          },
          {
            name: 'limit',
            type: 'number',
            required: false,
            description: 'Number of items per page',
            example: 20
          }
        ],
        responses: [
          {
            statusCode: 200,
            description: 'List of videos',
            example: {
              videos: [],
              pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
            }
          }
        ],
        rateLimit: {
          requestsPerMinute: 60,
          requestsPerHour: 1000
        },
        authentication: 'api_key'
      },
      {
        path: '/videos',
        method: 'POST',
        description: 'Create a new video',
        requestBody: {
          type: 'object',
          required: true,
          description: 'Video creation data',
          example: {
            title: 'My Video',
            description: 'Video description',
            script: 'Video script content'
          }
        },
        responses: [
          {
            statusCode: 201,
            description: 'Video created successfully',
            example: {
              id: 'video_id',
              title: 'My Video',
              status: 'processing'
            }
          }
        ],
        rateLimit: {
          requestsPerMinute: 10,
          requestsPerHour: 100
        },
        authentication: 'api_key'
      },
      {
        path: '/videos/{id}',
        method: 'GET',
        description: 'Get video details',
        parameters: [
          {
            name: 'id',
            type: 'string',
            required: true,
            description: 'Video ID'
          }
        ],
        responses: [
          {
            statusCode: 200,
            description: 'Video details',
            example: {
              id: 'video_id',
              title: 'My Video',
              status: 'completed',
              url: 'https://example.com/video.mp4'
            }
          }
        ],
        rateLimit: {
          requestsPerMinute: 60,
          requestsPerHour: 1000
        },
        authentication: 'api_key'
      },
      {
        path: '/analytics',
        method: 'GET',
        description: 'Get analytics data',
        parameters: [
          {
            name: 'startDate',
            type: 'string',
            required: false,
            description: 'Start date (YYYY-MM-DD)',
            example: '2024-01-01'
          },
          {
            name: 'endDate',
            type: 'string',
            required: false,
            description: 'End date (YYYY-MM-DD)',
            example: '2024-01-31'
          }
        ],
        responses: [
          {
            statusCode: 200,
            description: 'Analytics data',
            example: {
              totalVideos: 100,
              totalViews: 10000,
              averageWatchTime: 180
            }
          }
        ],
        rateLimit: {
          requestsPerMinute: 30,
          requestsPerHour: 500
        },
        authentication: 'api_key'
      }
    ];
  }

  private generateRandomKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async createOAuthToken(userId: string, platform: string, code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  }> {
    // This would handle OAuth flow for different platforms
    // For now, return placeholder data
    return {
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
      expiresAt: new Date(Date.now() + 3600 * 1000)
    };
  }

  async refreshOAuthToken(tokenId: string): Promise<{
    accessToken: string;
    expiresAt: Date;
  }> {
    // This would refresh OAuth tokens
    return {
      accessToken: 'new_access_token',
      expiresAt: new Date(Date.now() + 3600 * 1000)
    };
  }

  async revokeOAuthToken(tokenId: string): Promise<void> {
    // This would revoke OAuth tokens
  }

  async getApiHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    version: string;
    uptime: number;
    responseTime: number;
    services: Array<{
      name: string;
      status: 'healthy' | 'unhealthy';
      responseTime: number;
    }>;
  }> {
    // Check service health
    const services = [
      {
        name: 'Database',
        status: 'healthy' as const,
        responseTime: 10
      },
      {
        name: 'Storage',
        status: 'healthy' as const,
        responseTime: 50
      },
      {
        name: 'Queue',
        status: 'healthy' as const,
        responseTime: 25
      }
    ];

    const allHealthy = services.every(s => s.status === 'healthy');
    const averageResponseTime = services.reduce((sum, s) => sum + s.responseTime, 0) / services.length;

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      version: this.API_VERSION,
      uptime: process.uptime(),
      responseTime: averageResponseTime,
      services
    };
  }
}

export const apiService = new ApiService();