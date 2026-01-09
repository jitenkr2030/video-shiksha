// Credit service - Mock implementation for landing page deployment
// Database functionality is disabled for landing page deployment
import { Plan } from '@videoshiksha/shared'
import { CREDIT_COSTS } from '@videoshiksha/shared/constants'

export class CreditService {
  async getUserCredits(userId: string) {
    return {
      currentCredits: 100,
      plan: 'free',
      memberSince: new Date()
    }
  }

  async deductCredits(userId: string, jobType: string, quantity: number = 1) {
    const cost = CREDIT_COSTS[jobType as keyof typeof CREDIT_COSTS] * quantity
    
    if (cost === 0) {
      return { success: true, creditsDeducted: 0 }
    }

    return {
      success: true,
      creditsDeducted: cost,
      remainingCredits: 100 - cost
    }
  }

  async addCredits(userId: string, amount: number, reason: string, metadata?: any) {
    return {
      success: true,
      creditsAdded: amount,
      newBalance: 100 + amount
    }
  }

  async createCreditTransaction(
    userId: string,
    type: 'ADDITION' | 'DEDUCTION',
    amount: number,
    details: {
      reason?: string
      description?: string
      jobType?: string
      quantity?: number
      metadata?: any
    }
  ) {
    console.log(`Credit transaction: ${type} - ${amount} credits for user ${userId}`, details)
  }

  async getCreditHistory(userId: string, page: number = 1, limit: number = 20) {
    return {
      transactions: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0
      }
    }
  }

  async getCreditUsage(userId: string, period: 'week' | 'month' | 'year' = 'month') {
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
    }

    return {
      period,
      startDate,
      endDate: now,
      totalCredits: 0,
      byJobType: {}
    }
  }

  async checkCreditsSufficient(userId: string, jobType: string, quantity: number = 1) {
    const cost = CREDIT_COSTS[jobType as keyof typeof CREDIT_COSTS] * quantity
    
    if (cost === 0) {
      return { sufficient: true, required: 0, available: 0 }
    }

    return {
      sufficient: true,
      required: cost,
      available: 100,
      shortage: 0
    }
  }

  async estimateProjectCredits(slideCount: number, options: {
    hasCustomScript?: boolean
    hasSubtitles?: boolean
    videoQuality?: 'low' | 'medium' | 'high'
  } = {}) {
    const {
      hasCustomScript = false,
      hasSubtitles = true,
      videoQuality = 'medium'
    } = options

    let totalCredits = 0

    // PPT parsing (usually free)
    totalCredits += CREDIT_COSTS.PPT_PARSE || 0

    // Script generation
    if (!hasCustomScript) {
      totalCredits += slideCount * (CREDIT_COSTS.SCRIPT_GENERATE || 1)
    }

    // TTS generation
    totalCredits += slideCount * (CREDIT_COSTS.TTS_GENERATE || 2)

    // Video rendering
    const videoMultiplier = videoQuality === 'high' ? 1.5 : videoQuality === 'low' ? 0.5 : 1
    totalCredits += (CREDIT_COSTS.VIDEO_RENDER || 5) * videoMultiplier

    // Subtitle generation
    if (hasSubtitles) {
      totalCredits += CREDIT_COSTS.SUBTITLE_GENERATE || 1
    }

    return {
      totalCredits,
      breakdown: {
        pptParsing: CREDIT_COSTS.PPT_PARSE || 0,
        scriptGeneration: hasCustomScript ? 0 : slideCount * (CREDIT_COSTS.SCRIPT_GENERATE || 1),
        ttsGeneration: slideCount * (CREDIT_COSTS.TTS_GENERATE || 2),
        videoRendering: (CREDIT_COSTS.VIDEO_RENDER || 5) * videoMultiplier,
        subtitleGeneration: hasSubtitles ? (CREDIT_COSTS.SUBTITLE_GENERATE || 1) : 0
      },
      slideCount,
      options
    }
  }

  async getPlanBenefits(plan: Plan) {
    const benefits: Record<string, any> = {
      [Plan.FREE]: {
        monthlyCredits: 10,
        maxProjects: 3,
        videoQuality: '720p',
        features: ['Basic video generation', 'Standard voices', 'Community support']
      },
      [Plan.STARTER]: {
        monthlyCredits: 100,
        maxProjects: 20,
        videoQuality: '1080p',
        features: ['HD video generation', 'Premium voices', 'Email support', 'Priority processing']
      },
      [Plan.CREATOR]: {
        monthlyCredits: 500,
        maxProjects: -1, // unlimited
        videoQuality: '4K',
        features: ['4K video generation', 'Custom voice cloning', 'Phone support', 'API access', 'White-label options']
      },
      [Plan.ENTERPRISE]: {
        monthlyCredits: 2000,
        maxProjects: -1, // unlimited
        videoQuality: '4K',
        features: ['Everything in Creator', 'Unlimited credits', 'Dedicated support', 'Custom integrations', 'SLA guarantee']
      },
      [Plan.INSTITUTE]: {
        monthlyCredits: 5000,
        maxProjects: -1,
        videoQuality: '4K',
        features: ['Everything in Enterprise', 'Multi-user support', 'Custom branding', 'Advanced analytics', 'Priority queue']
      }
    }

    return benefits[plan] || benefits[Plan.FREE]
  }

  async upgradePlan(userId: string, newPlan: Plan) {
    const benefits = await this.getPlanBenefits(newPlan)
    
    return {
      success: true,
      previousPlan: 'free',
      newPlan,
      creditsAdded: benefits.monthlyCredits,
      newBalance: 100 + benefits.monthlyCredits
    }
  }
}

export const creditService = new CreditService()
