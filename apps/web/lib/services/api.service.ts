// API service - Mock implementation for landing page deployment
// Database functionality is disabled for landing page deployment

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
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Mock API service for landing page
export class ApiService {
  async getHealthCheck(): Promise<ApiResponse> {
    return {
      success: true,
      message: 'API is running'
    };
  }

  async getStatus(): Promise<ApiResponse> {
    return {
      success: true,
      data: {
        status: 'healthy',
        version: '1.0.0',
        uptime: process.uptime()
      }
    };
  }
}

export const apiService = new ApiService();
