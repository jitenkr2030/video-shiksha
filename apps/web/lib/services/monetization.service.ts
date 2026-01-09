// Monetization service - Mock implementation for landing page deployment
// Database functionality is disabled for landing page deployment

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  features: {
    videosPerMonth: number;
    storageLimit: number;
    bandwidthLimit: number;
    apiCallsPerMonth: number;
    maxVideoLength: number;
    maxResolution: string;
    watermark: boolean;
    prioritySupport: boolean;
    customBranding: boolean;
    analytics: boolean;
    teamMembers: number;
    languages: string[];
    exportFormats: string[];
  };
  credits: number;
  popular?: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'expired' | 'pending' | 'past_due';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  userId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'card' | 'upi' | 'net_banking' | 'wallet';
  paymentIntentId?: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditPackage {
  id: string;
  name: string;
  description: string;
  credits: number;
  price: number;
  currency: string;
  bonusCredits?: number;
  popular?: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  minAmount?: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: Date;
  applicablePlans?: string[];
  applicablePackages?: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  code: string;
  status: 'pending' | 'completed' | 'expired';
  rewardCredits: number;
  createdAt: Date;
}

// Mock monetization service for landing page
export class MonetizationService {
  async getPricingPlans(): Promise<PricingPlan[]> {
    return [
      {
        id: 'free',
        name: 'Free',
        description: 'Perfect for getting started',
        price: 0,
        currency: 'USD',
        billingCycle: 'monthly',
        features: {
          videosPerMonth: 5,
          storageLimit: 1,
          bandwidthLimit: 5,
          apiCallsPerMonth: 100,
          maxVideoLength: 5,
          maxResolution: '720p',
          watermark: true,
          prioritySupport: false,
          customBranding: false,
          analytics: false,
          teamMembers: 1,
          languages: ['en'],
          exportFormats: ['mp4']
        },
        credits: 100,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'starter',
        name: 'Starter',
        description: 'Great for individual creators',
        price: 29,
        currency: 'USD',
        billingCycle: 'monthly',
        features: {
          videosPerMonth: 50,
          storageLimit: 10,
          bandwidthLimit: 50,
          apiCallsPerMonth: 1000,
          maxVideoLength: 30,
          maxResolution: '1080p',
          watermark: false,
          prioritySupport: true,
          customBranding: false,
          analytics: true,
          teamMembers: 3,
          languages: ['en', 'hi', 'es'],
          exportFormats: ['mp4', 'mov']
        },
        credits: 500,
        popular: true,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'creator',
        name: 'Creator',
        description: 'For professional content creators',
        price: 79,
        currency: 'USD',
        billingCycle: 'monthly',
        features: {
          videosPerMonth: 200,
          storageLimit: 50,
          bandwidthLimit: 200,
          apiCallsPerMonth: 5000,
          maxVideoLength: 60,
          maxResolution: '4K',
          watermark: false,
          prioritySupport: true,
          customBranding: true,
          analytics: true,
          teamMembers: 10,
          languages: ['en', 'hi', 'es', 'fr', 'de'],
          exportFormats: ['mp4', 'mov', 'avi']
        },
        credits: 2000,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'For teams and organizations',
        price: 299,
        currency: 'USD',
        billingCycle: 'monthly',
        features: {
          videosPerMonth: -1,
          storageLimit: 500,
          bandwidthLimit: -1,
          apiCallsPerMonth: -1,
          maxVideoLength: -1,
          maxResolution: '4K',
          watermark: false,
          prioritySupport: true,
          customBranding: true,
          analytics: true,
          teamMembers: -1,
          languages: ['en', 'hi', 'es', 'fr', 'de', 'zh', 'ja'],
          exportFormats: ['mp4', 'mov', 'avi', 'mkv']
        },
        credits: 10000,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  async getCreditPackages(): Promise<CreditPackage[]> {
    return [
      {
        id: 'credits-100',
        name: '100 Credits',
        description: 'Small credit pack for occasional use',
        credits: 100,
        price: 10,
        currency: 'USD',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'credits-500',
        name: '500 Credits',
        description: 'Medium credit pack with bonus',
        credits: 500,
        price: 45,
        currency: 'USD',
        bonusCredits: 50,
        popular: true,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'credits-1000',
        name: '1000 Credits',
        description: 'Large credit pack with bonus',
        credits: 1000,
        price: 85,
        currency: 'USD',
        bonusCredits: 150,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  async createSubscription(userId: string, planId: string): Promise<Subscription> {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);

    return {
      id: crypto.randomUUID(),
      userId,
      planId,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: endDate,
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<Subscription> {
    return {
      id: subscriptionId,
      userId: '',
      planId: 'free',
      status: 'cancelled',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
      cancelAtPeriodEnd: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async getUserSubscription(userId: string): Promise<Subscription | null> {
    return {
      id: crypto.randomUUID(),
      userId,
      planId: 'free',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async createPayment(payment: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payment> {
    return {
      ...payment,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async getPaymentHistory(userId: string): Promise<Payment[]> {
    return [];
  }

  async validateCoupon(code: string): Promise<Coupon | null> {
    return {
      id: crypto.randomUUID(),
      code,
      type: 'percentage',
      value: 10,
      usedCount: 0,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async createReferral(referrerId: string): Promise<Referral> {
    return {
      id: crypto.randomUUID(),
      referrerId,
      referredId: '',
      code: `REF-${crypto.randomUUID().substring(0, 8).toUpperCase()}`,
      status: 'pending',
      rewardCredits: 50,
      createdAt: new Date()
    };
  }

  async getReferralStats(referrerId: string): Promise<{
    totalReferrals: number;
    completedReferrals: number;
    pendingReferrals: number;
    totalCreditsEarned: number;
  }> {
    return {
      totalReferrals: 0,
      completedReferrals: 0,
      pendingReferrals: 0,
      totalCreditsEarned: 0
    };
  }
}

export const monetizationService = new MonetizationService();
