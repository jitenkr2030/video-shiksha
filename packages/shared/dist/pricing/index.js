import { Plan, JobType } from '../types';
import { SUBSCRIPTION_PLANS, CREDIT_COSTS } from '../constants';
export const CREDIT_PACKAGES = [
    {
        id: 'starter',
        name: 'Starter Pack',
        credits: 50,
        price: 4.99,
        currency: 'USD'
    },
    {
        id: 'standard',
        name: 'Standard Pack',
        credits: 150,
        price: 12.99,
        currency: 'USD',
        bonus: 25,
        popular: true
    },
    {
        id: 'professional',
        name: 'Professional Pack',
        credits: 500,
        price: 39.99,
        currency: 'USD',
        bonus: 100
    },
    {
        id: 'enterprise',
        name: 'Enterprise Pack',
        credits: 2000,
        price: 149.99,
        currency: 'USD',
        bonus: 500
    }
];
export class PricingCalculator {
    /**
     * Calculate credits required for a complete video project
     */
    static calculateProjectCredits(slideCount, hasCustomScript = false, hasSubtitles = true) {
        const breakdown = {
            [JobType.PPT_PARSE]: CREDIT_COSTS[JobType.PPT_PARSE],
            [JobType.PDF_PARSE]: CREDIT_COSTS[JobType.PDF_PARSE],
            [JobType.DOCX_PARSE]: CREDIT_COSTS[JobType.DOCX_PARSE],
            [JobType.SCRIPT_GENERATE]: hasCustomScript ? 0 : slideCount * CREDIT_COSTS[JobType.SCRIPT_GENERATE],
            [JobType.SCRIPT_TRANSLATE]: CREDIT_COSTS[JobType.SCRIPT_TRANSLATE],
            [JobType.TTS_GENERATE]: slideCount * CREDIT_COSTS[JobType.TTS_GENERATE],
            [JobType.VIDEO_RENDER]: CREDIT_COSTS[JobType.VIDEO_RENDER],
            [JobType.SUBTITLE_GENERATE]: hasSubtitles ? CREDIT_COSTS[JobType.SUBTITLE_GENERATE] : 0,
            [JobType.THUMBNAIL_GENERATE]: CREDIT_COSTS[JobType.THUMBNAIL_GENERATE],
            [JobType.ANALYTICS_UPDATE]: CREDIT_COSTS[JobType.ANALYTICS_UPDATE]
        };
        const totalCredits = Object.values(breakdown).reduce((sum, credits) => sum + credits, 0);
        // Estimate processing time (rough calculation)
        const estimatedTime = Math.max(1, // minimum 1 minute
        Math.round((slideCount * 2) + // 2 minutes per slide for processing
            (hasCustomScript ? 0 : slideCount * 0.5) + // script generation time
            5 // base video rendering time
        ));
        return {
            totalCredits,
            breakdown,
            estimatedTime
        };
    }
    /**
     * Get monthly credits for a subscription plan
     */
    static getPlanCredits(plan) {
        return SUBSCRIPTION_PLANS[plan].credits;
    }
    /**
     * Calculate price per credit for packages
     */
    static getPricePerCredit(packageId) {
        const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
        if (!pkg)
            return 0;
        const effectiveCredits = pkg.credits + (pkg.bonus || 0);
        return pkg.price / effectiveCredits;
    }
    /**
     * Get best value package
     */
    static getBestValuePackage() {
        return CREDIT_PACKAGES.reduce((best, current) => {
            const bestPricePerCredit = this.getPricePerCredit(best.id);
            const currentPricePerCredit = this.getPricePerCredit(current.id);
            return currentPricePerCredit < bestPricePerCredit ? current : best;
        });
    }
    /**
     * Check if user has enough credits for an operation
     */
    static canAffordOperation(userCredits, jobType, quantity = 1) {
        const requiredCredits = CREDIT_COSTS[jobType] * quantity;
        return userCredits >= requiredCredits;
    }
    /**
     * Calculate remaining credits after operation
     */
    static calculateRemainingCredits(userCredits, jobType, quantity = 1) {
        const requiredCredits = CREDIT_COSTS[jobType] * quantity;
        return Math.max(0, userCredits - requiredCredits);
    }
    /**
     * Get upgrade recommendation based on usage
     */
    static getUpgradeRecommendation(currentPlan, monthlyUsage) {
        const currentPlanData = SUBSCRIPTION_PLANS[currentPlan];
        if (monthlyUsage <= currentPlanData.credits * 0.8) {
            return null; // No upgrade needed
        }
        // Find next plan that can handle usage
        const plans = Object.values(Plan);
        const currentIndex = plans.indexOf(currentPlan);
        for (let i = currentIndex + 1; i < plans.length; i++) {
            const plan = plans[i];
            const planData = SUBSCRIPTION_PLANS[plan];
            if (planData.credits >= monthlyUsage) {
                const currentCost = currentPlanData.price;
                const newCost = planData.price;
                const payAsYouGoCost = (monthlyUsage - currentPlanData.credits) * 0.15; // $0.15 per extra credit
                const currentTotalCost = currentCost + payAsYouGoCost;
                const savings = Math.max(0, currentTotalCost - newCost);
                return {
                    recommendedPlan: plan,
                    reason: `Your monthly usage (${monthlyUsage} credits) exceeds your current plan's limit. Upgrade to save $${savings.toFixed(2)} per month.`,
                    savings: savings > 0 ? savings : undefined
                };
            }
        }
        return {
            recommendedPlan: Plan.ENTERPRISE,
            reason: 'Your usage exceeds all standard plans. Contact us for enterprise pricing.'
        };
    }
    /**
     * Calculate ROI for subscription vs pay-as-you-go
     */
    static calculateSubscriptionROI(plan, expectedMonthlyUsage) {
        const planData = SUBSCRIPTION_PLANS[plan];
        const subscriptionCost = planData.price;
        const payAsYouGoCost = expectedMonthlyUsage * 0.15; // $0.15 per credit
        const savings = Math.max(0, payAsYouGoCost - subscriptionCost);
        const roi = savings > 0 ? (savings / subscriptionCost) * 100 : 0;
        return {
            subscriptionCost,
            payAsYouGoCost,
            savings,
            roi
        };
    }
    /**
     * Get billing cycle dates
     */
    static getBillingCycleDates(startDate) {
        const currentPeriodStart = new Date(startDate);
        const currentPeriodEnd = new Date(startDate);
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
        const now = new Date();
        const daysRemaining = Math.ceil((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
            currentPeriodStart,
            currentPeriodEnd,
            daysRemaining: Math.max(0, daysRemaining)
        };
    }
}
// Utility functions for pricing display
export const formatPrice = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
};
export const formatCredits = (credits) => {
    if (credits >= 1000) {
        return `${(credits / 1000).toFixed(1)}k`;
    }
    return credits.toString();
};
export const getCreditValue = (credits) => {
    const value = credits * 0.15; // $0.15 per credit base value
    return formatPrice(value);
};
