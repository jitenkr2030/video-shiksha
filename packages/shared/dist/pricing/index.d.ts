import { SubscriptionPlan, JobType } from '../types';
export interface CreditPackage {
    id: string;
    name: string;
    credits: number;
    price: number;
    currency: string;
    bonus?: number;
    popular?: boolean;
}
export interface UsageCalculation {
    totalCredits: number;
    breakdown: Record<JobType, number>;
    estimatedTime: number;
}
export declare const CREDIT_PACKAGES: CreditPackage[];
export declare class PricingCalculator {
    /**
     * Calculate credits required for a complete video project
     */
    static calculateProjectCredits(slideCount: number, hasCustomScript?: boolean, hasSubtitles?: boolean): UsageCalculation;
    /**
     * Get monthly credits for a subscription plan
     */
    static getPlanCredits(plan: SubscriptionPlan): number;
    /**
     * Calculate price per credit for packages
     */
    static getPricePerCredit(packageId: string): number;
    /**
     * Get best value package
     */
    static getBestValuePackage(): CreditPackage;
    /**
     * Check if user has enough credits for an operation
     */
    static canAffordOperation(userCredits: number, jobType: JobType, quantity?: number): boolean;
    /**
     * Calculate remaining credits after operation
     */
    static calculateRemainingCredits(userCredits: number, jobType: JobType, quantity?: number): number;
    /**
     * Get upgrade recommendation based on usage
     */
    static getUpgradeRecommendation(currentPlan: SubscriptionPlan, monthlyUsage: number): {
        recommendedPlan: SubscriptionPlan;
        reason: string;
        savings?: number;
    } | null;
    /**
     * Calculate ROI for subscription vs pay-as-you-go
     */
    static calculateSubscriptionROI(plan: SubscriptionPlan, expectedMonthlyUsage: number): {
        subscriptionCost: number;
        payAsYouGoCost: number;
        savings: number;
        roi: number;
    };
    /**
     * Get billing cycle dates
     */
    static getBillingCycleDates(startDate: Date): {
        currentPeriodStart: Date;
        currentPeriodEnd: Date;
        daysRemaining: number;
    };
}
export declare const formatPrice: (amount: number, currency?: string) => string;
export declare const formatCredits: (credits: number) => string;
export declare const getCreditValue: (credits: number) => string;
//# sourceMappingURL=index.d.ts.map