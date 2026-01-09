// User management service - Mock implementation for landing page deployment
// Database functionality is disabled for landing page deployment

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'student' | 'teacher' | 'admin';
  plan: 'free' | 'starter' | 'creator' | 'enterprise';
  credits: number;
  emailVerified: boolean;
  phone?: string;
  bio?: string;
  website?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    youtube?: string;
    instagram?: string;
  };
  preferences: {
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
      marketing: boolean;
    };
    privacy: {
      profileVisibility: 'public' | 'private' | 'unlisted';
      showEmail: boolean;
      showPhone: boolean;
    };
  };
  subscription?: {
    id: string;
    planId: string;
    status: 'active' | 'cancelled' | 'expired' | 'pending';
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
  };
  usage: {
    videosCreated: number;
    storageUsed: number;
    bandwidthUsed: number;
    apiCalls: number;
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role?: 'student' | 'teacher' | 'admin';
  phone?: string;
  referralCode?: string;
}

export interface UpdateUserRequest {
  name?: string;
  avatar?: File;
  bio?: string;
  website?: string;
  phone?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    youtube?: string;
    instagram?: string;
  };
  preferences?: {
    language?: string;
    timezone?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
      marketing?: boolean;
    };
    privacy?: {
      profileVisibility?: 'public' | 'private' | 'unlisted';
      showEmail?: boolean;
      showPhone?: boolean;
    };
  };
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Mock user management service for landing page
export class UserManagementService {
  async createUser(data: CreateUserRequest): Promise<User> {
    return {
      id: crypto.randomUUID(),
      email: data.email,
      name: data.name,
      role: data.role || 'student',
      plan: 'free',
      credits: 100,
      emailVerified: false,
      phone: data.phone,
      preferences: {
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: true,
          marketing: false
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showPhone: false
        }
      },
      usage: {
        videosCreated: 0,
        storageUsed: 0,
        bandwidthUsed: 0,
        apiCalls: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async validateUserCredentials(email: string, password: string): Promise<User | null> {
    return {
      id: crypto.randomUUID(),
      email,
      name: 'Demo User',
      role: 'student',
      plan: 'free',
      credits: 100,
      emailVerified: true,
      preferences: {
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: true,
          marketing: false
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showPhone: false
        }
      },
      usage: {
        videosCreated: 0,
        storageUsed: 0,
        bandwidthUsed: 0,
        apiCalls: 0
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date()
    };
  }

  async getUserById(userId: string): Promise<User | null> {
    return {
      id: userId,
      email: 'demo@example.com',
      name: 'Demo User',
      role: 'student',
      plan: 'free',
      credits: 100,
      emailVerified: true,
      preferences: {
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: true,
          marketing: false
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showPhone: false
        }
      },
      usage: {
        videosCreated: 0,
        storageUsed: 0,
        bandwidthUsed: 0,
        apiCalls: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async updateUser(userId: string, data: UpdateUserRequest): Promise<User> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const updatedPreferences = data.preferences ? {
      language: data.preferences.language || user.preferences.language,
      timezone: data.preferences.timezone || user.preferences.timezone,
      notifications: {
        email: data.preferences.notifications?.email ?? user.preferences.notifications.email,
        push: data.preferences.notifications?.push ?? user.preferences.notifications.push,
        marketing: data.preferences.notifications?.marketing ?? user.preferences.notifications.marketing
      },
      privacy: {
        profileVisibility: data.preferences.privacy?.profileVisibility || user.preferences.privacy.profileVisibility,
        showEmail: data.preferences.privacy?.showEmail ?? user.preferences.privacy.showEmail,
        showPhone: data.preferences.privacy?.showPhone ?? user.preferences.privacy.showPhone
      }
    } : user.preferences;
    
    return {
      ...user,
      name: data.name || user.name,
      bio: data.bio || user.bio,
      website: data.website || user.website,
      phone: data.phone || user.phone,
      socialLinks: data.socialLinks || user.socialLinks,
      preferences: updatedPreferences,
      updatedAt: new Date()
    };
  }

  async validateToken(token: string): Promise<{ userId: string } | null> {
    if (token && token.length > 0) {
      return { userId: crypto.randomUUID() };
    }
    return null;
  }

  async updateUserCredits(userId: string, credits: number): Promise<User> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return {
      ...user,
      credits: user.credits + credits,
      updatedAt: new Date()
    };
  }

  async getUserUsage(userId: string): Promise<User['usage']> {
    return {
      videosCreated: 0,
      storageUsed: 0,
      bandwidthUsed: 0,
      apiCalls: 0
    };
  }

  async updateUserUsage(userId: string, usage: Partial<User['usage']>): Promise<User> {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return {
      ...user,
      usage: { ...user.usage, ...usage },
      updatedAt: new Date()
    };
  }
}

export const userManagementService = new UserManagementService();
