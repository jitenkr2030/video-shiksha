import { prisma } from '@/lib/db';
import { userManagementService } from './user-management.service';
import { v4 as uuidv4 } from 'uuid';

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  features: {
    videosPerMonth: number;
    storageLimit: number; // in GB
    bandwidthLimit: number; // in GB
    apiCallsPerMonth: number;
    maxVideoLength: number; // in minutes
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
  completedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class MonetizationService {
  async getPricingPlans(): Promise<PricingPlan[]> {
    return await prisma.pricingPlan.findMany({
      where: { active: true },
      orderBy: { price: 'asc' }
    });
  }

  async getPricingPlan(planId: string): Promise<PricingPlan | null> {
    return await prisma.pricingPlan.findUnique({
      where: { id: planId }
    });
  }

  async createSubscription(
    userId: string,
    planId: string,
    paymentMethodId: string,
    couponCode?: string
  ): Promise<Subscription> {
    const plan = await prisma.pricingPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      throw new Error('Pricing plan not found');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if user already has an active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active'
      }
    });

    if (existingSubscription) {
      throw new Error('User already has an active subscription');
    }

    // Apply coupon if provided
    let finalPrice = plan.price;
    if (couponCode) {
      const coupon = await this.validateCoupon(couponCode, planId);
      if (coupon) {
        finalPrice = this.applyCoupon(plan.price, coupon);
        await this.incrementCouponUsage(coupon.id);
      }
    }

    // Calculate subscription period
    const now = new Date();
    const periodEnd = new Date(now);
    if (plan.billingCycle === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    // Create subscription (this would integrate with Stripe/Razorpay)
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId,
        status: 'pending',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        stripeSubscriptionId: `sub_${uuidv4()}`,
        stripeCustomerId: `cus_${uuidv4()}`,
        createdAt: now,
        updatedAt: now
      }
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        userId,
        subscriptionId: subscription.id,
        amount: finalPrice,
        currency: plan.currency,
        status: 'pending',
        paymentMethod: 'card',
        paymentIntentId: `pi_${uuidv4()}`,
        description: `Subscription to ${plan.name}`,
        metadata: {
          planId,
          couponCode: couponCode || null
        },
        createdAt: now,
        updatedAt: now
      }
    });

    return subscription;
  }

  async cancelSubscription(userId: string, cancelAtPeriodEnd: boolean = true): Promise<Subscription> {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active'
      }
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd,
        updatedAt: new Date()
      }
    });

    return updatedSubscription;
  }

  async updateSubscription(userId: string, newPlanId: string): Promise<Subscription> {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active'
      }
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    const newPlan = await prisma.pricingPlan.findUnique({
      where: { id: newPlanId }
    });

    if (!newPlan) {
      throw new Error('New pricing plan not found');
    }

    // Update subscription
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        planId: newPlanId,
        updatedAt: new Date()
      }
    });

    // Update user plan
    await userManagementService.updateUserPlan(userId, newPlanId as any);

    return updatedSubscription;
  }

  async purchaseCredits(
    userId: string,
    packageId: string,
    paymentMethodId: string,
    couponCode?: string
  ): Promise<{ credits: number; payment: Payment }> {
    const creditPackage = await prisma.creditPackage.findUnique({
      where: { id: packageId }
    });

    if (!creditPackage) {
      throw new Error('Credit package not found');
    }

    // Apply coupon if provided
    let finalPrice = creditPackage.price;
    if (couponCode) {
      const coupon = await this.validateCoupon(couponCode, undefined, packageId);
      if (coupon) {
        finalPrice = this.applyCoupon(creditPackage.price, coupon);
        await this.incrementCouponUsage(coupon.id);
      }
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: finalPrice,
        currency: creditPackage.currency,
        status: 'pending',
        paymentMethod: 'card',
        paymentIntentId: `pi_${uuidv4()}`,
        description: `Purchase of ${creditPackage.name}`,
        metadata: {
          packageId,
          couponCode: couponCode || null
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Add credits to user account
    const totalCredits = creditPackage.credits + (creditPackage.bonusCredits || 0);
    await userManagementService.addCredits(userId, totalCredits, `Purchase of ${creditPackage.name}`);

    return { credits: totalCredits, payment };
  }

  async getCreditPackages(): Promise<CreditPackage[]> {
    return await prisma.creditPackage.findMany({
      where: { active: true },
      orderBy: { price: 'asc' }
    });
  }

  async createCoupon(couponData: Omit<Coupon, 'id' | 'usedCount' | 'createdAt' | 'updatedAt'>): Promise<Coupon> {
    return await prisma.coupon.create({
      data: {
        ...couponData,
        usedCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  async validateCoupon(
    code: string,
    planId?: string,
    packageId?: string
  ): Promise<Coupon | null> {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!coupon || !coupon.active) {
      return null;
    }

    // Check expiration
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return null;
    }

    // Check usage limit
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return null;
    }

    // Check applicability
    if (planId && coupon.applicablePlans && !coupon.applicablePlans.includes(planId)) {
      return null;
    }

    if (packageId && coupon.applicablePackages && !coupon.applicablePackages.includes(packageId)) {
      return null;
    }

    return coupon;
  }

  private applyCoupon(price: number, coupon: Coupon): number {
    if (coupon.type === 'percentage') {
      return Math.round(price * (1 - coupon.value / 100));
    } else {
      return Math.max(0, price - coupon.value);
    }
  }

  private async incrementCouponUsage(couponId: string): Promise<void> {
    await prisma.coupon.update({
      where: { id: couponId },
      data: {
        usedCount: { increment: 1 },
        updatedAt: new Date()
      }
    });
  }

  async processPayment(paymentId: string, status: 'completed' | 'failed'): Promise<Payment> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { subscription: true }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        updatedAt: new Date()
      }
    });

    // If payment is completed and has subscription, activate subscription
    if (status === 'completed' && payment.subscriptionId) {
      await prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: 'active',
          updatedAt: new Date()
        }
      });

      // Update user plan
      if (payment.subscription) {
        await userManagementService.updateUserPlan(
          payment.subscription.userId,
          payment.subscription.planId as any
        );
      }
    }

    return updatedPayment;
  }

  async refundPayment(paymentId: string, reason?: string): Promise<Payment> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'completed') {
      throw new Error('Can only refund completed payments');
    }

    const refundedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'refunded',
        metadata: {
          ...payment.metadata,
          refundReason: reason || 'Customer request'
        },
        updatedAt: new Date()
      }
    });

    return refundedPayment;
  }

  async getUserSubscription(userId: string): Promise<Subscription | null> {
    return await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active'
      },
      include: {
        plan: true
      }
    });
  }

  async getUserPayments(userId: string, limit: number = 10): Promise<Payment[]> {
    return await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  async calculateUsageCost(userId: string, usage: {
    videosCreated: number;
    storageUsed: number;
    bandwidthUsed: number;
    apiCalls: number;
  }): Promise<number> {
    const subscription = await this.getUserSubscription(userId);
    
    if (!subscription) {
      // Pay-per-use pricing for free users
      const videoCost = usage.videosCreated * 50; // 50 credits per video
      const storageCost = Math.ceil(usage.storageUsed / 1024) * 10; // 10 credits per GB
      const bandwidthCost = Math.ceil(usage.bandwidthUsed / 1024) * 5; // 5 credits per GB
      const apiCost = Math.ceil(usage.apiCalls / 100) * 1; // 1 credit per 100 API calls
      
      return videoCost + storageCost + bandwidthCost + apiCost;
    }

    // Check if usage exceeds plan limits
    const plan = subscription.plan;
    let overageCost = 0;

    if (usage.videosCreated > plan.features.videosPerMonth) {
      overageCost += (usage.videosCreated - plan.features.videosPerMonth) * 25;
    }

    if (usage.storageUsed > plan.features.storageLimit * 1024) {
      overageCost += Math.ceil((usage.storageUsed - plan.features.storageLimit * 1024) / 1024) * 5;
    }

    if (usage.bandwidthUsed > plan.features.bandwidthLimit * 1024) {
      overageCost += Math.ceil((usage.bandwidthUsed - plan.features.bandwidthLimit * 1024) / 1024) * 3;
    }

    if (usage.apiCalls > plan.features.apiCallsPerMonth) {
      overageCost += Math.ceil((usage.apiCalls - plan.features.apiCallsPerMonth) / 100) * 1;
    }

    return overageCost;
  }

  async generateInvoice(userId: string, paymentId: string): Promise<string> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: {
          select: { name: true, email: true }
        },
        subscription: {
          include: { plan: true }
        }
      }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Generate invoice PDF
    const invoiceData = {
      invoiceNumber: `INV-${Date.now()}`,
      date: payment.createdAt.toISOString().split('T')[0],
      dueDate: new Date(payment.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      customer: {
        name: payment.user.name,
        email: payment.user.email
      },
      items: [
        {
          description: payment.description,
          quantity: 1,
          unitPrice: payment.amount,
          total: payment.amount
        }
      ],
      subtotal: payment.amount,
      tax: Math.round(payment.amount * 0.18), // 18% GST
      total: Math.round(payment.amount * 1.18),
      status: payment.status
    };

    // This would use a PDF generation service
    const invoiceUrl = `invoices/${userId}/${paymentId}.pdf`;
    
    return invoiceUrl;
  }

  async getRevenueStats(startDate?: Date, endDate?: Date): Promise<{
    totalRevenue: number;
    subscriptionRevenue: number;
    creditRevenue: number;
    refunds: number;
    netRevenue: number;
    transactionCount: number;
    averageTransactionValue: number;
  }> {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        subscription: true
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

  async createReferral(referrerId: string, referredId: string, code: string): Promise<Referral> {
    return await prisma.referral.create({
      data: {
        referrerId,
        referredId,
        code,
        status: 'pending',
        rewardCredits: 50,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  async completeReferral(referralId: string): Promise<void> {
    const referral = await prisma.referral.findUnique({
      where: { id: referralId }
    });

    if (!referral || referral.status !== 'pending') {
      throw new Error('Invalid referral');
    }

    // Update referral status
    await prisma.referral.update({
      where: { id: referralId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Add reward credits to referrer
    await userManagementService.addCredits(
      referral.referrerId,
      referral.rewardCredits,
      `Referral reward for ${referral.code}`
    );
  }
}

export const monetizationService = new MonetizationService();