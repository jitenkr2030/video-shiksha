import { db } from '@/lib/db'
import { SubscriptionPlan } from '@videoshiksha/shared'
import { CREDIT_COSTS } from '@/videoshiksha/shared/constants'

export class CreditService {
  async getUserCredits(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        credits: true,
        plan: true,
        createdAt: true
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    return {
      currentCredits: user.credits,
      plan: user.plan,
      memberSince: user.createdAt
    }
  }

  async deductCredits(userId: string, jobType: string, quantity: number = 1) {
    const cost = CREDIT_COSTS[jobType] * quantity
    
    if (cost === 0) {
      return { success: true, creditsDeducted: 0 }
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    })

    if (!user) {
      throw new Error('User not found')
    }

    if (user.credits < cost) {
      throw new Error(`Insufficient credits. Required: ${cost}, Available: ${user.credits}`)
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        credits: {
          decrement: cost
        }
      }
    })

    // Create credit transaction record
    await this.createCreditTransaction(userId, 'DEDUCTION', cost, {
      jobType,
      quantity,
      description: `Credits deducted for ${jobType}`
    })

    return {
      success: true,
      creditsDeducted: cost,
      remainingCredits: updatedUser.credits
    }
  }

  async addCredits(userId: string, amount: number, reason: string, metadata?: any) {
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: amount
        }
      }
    })

    await this.createCreditTransaction(userId, 'ADDITION', amount, {
      reason,
      description: `Credits added: ${reason}`,
      metadata
    })

    return {
      success: true,
      creditsAdded: amount,
      newBalance: updatedUser.credits
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
    // In a real implementation, you would have a separate transactions table
    // For now, we'll just log the transaction
    console.log(`Credit transaction: ${type} - ${amount} credits for user ${userId}`, details)
  }

  async getCreditHistory(userId: string, page: number = 1, limit: number = 20) {
    // This would query a transactions table
    // For now, return placeholder data
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
    // This would calculate usage based on job history
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

    // Get jobs in the period
    const jobs = await db.job.findMany({
      where: {
        project: {
          userId
        },
        createdAt: {
          gte: startDate
        },
        status: 'COMPLETED'
      },
      select: {
        type: true,
        createdAt: true
      }
    })

    const usage = jobs.reduce((acc, job) => {
      const cost = CREDIT_COSTS[job.type] || 0
      acc.totalCredits += cost
      acc.byJobType[job.type] = (acc.byJobType[job.type] || 0) + cost
      return acc
    }, {
      totalCredits: 0,
      byJobType: {} as Record<string, number>
    })

    return {
      period,
      startDate,
      endDate: now,
      ...usage
    }
  }

  async checkCreditsSufficient(userId: string, jobType: string, quantity: number = 1) {
    const cost = CREDIT_COSTS[jobType] * quantity
    
    if (cost === 0) {
      return { sufficient: true, required: 0, available: 0 }
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    })

    if (!user) {
      throw new Error('User not found')
    }

    return {
      sufficient: user.credits >= cost,
      required: cost,
      available: user.credits,
      shortage: Math.max(0, cost - user.credits)
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

  async getPlanBenefits(plan: SubscriptionPlan) {
    const benefits = {
      [SubscriptionPlan.FREE]: {
        monthlyCredits: 10,
        maxProjects: 3,
        videoQuality: '720p',
        features: ['Basic video generation', 'Standard voices', 'Community support']
      },
      [SubscriptionPlan.BASIC]: {
        monthlyCredits: 100,
        maxProjects: 20,
        videoQuality: '1080p',
        features: ['HD video generation', 'Premium voices', 'Email support', 'Priority processing']
      },
      [SubscriptionPlan.PRO]: {
        monthlyCredits: 500,
        maxProjects: -1, // unlimited
        videoQuality: '4K',
        features: ['4K video generation', 'Custom voice cloning', 'Phone support', 'API access', 'White-label options']
      },
      [SubscriptionPlan.ENTERPRISE]: {
        monthlyCredits: 2000,
        maxProjects: -1, // unlimited
        videoQuality: '4K',
        features: ['Everything in Pro', 'Unlimited credits', 'Dedicated support', 'Custom integrations', 'SLA guarantee']
      }
    }

    return benefits[plan] || benefits[SubscriptionPlan.FREE]
  }

  async upgradePlan(userId: string, newPlan: SubscriptionPlan) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { plan: true }
    })

    if (!user) {
      throw new Error('User not found')
    }

    if (user.plan === newPlan) {
      throw new Error('User already has this plan')
    }

    const benefits = await this.getPlanBenefits(newPlan)
    
    // Update user plan
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        plan: newPlan,
        credits: {
          increment: benefits.monthlyCredits
        }
      }
    })

    // Add credits for the new plan
    await this.addCredits(
      userId,
      benefits.monthlyCredits,
      `Plan upgrade to ${newPlan}`,
      { previousPlan: user.plan, newPlan }
    )

    return {
      success: true,
      previousPlan: user.plan,
      newPlan,
      creditsAdded: benefits.monthlyCredits,
      newBalance: updatedUser.credits
    }
  }
}

export const creditService = new CreditService()