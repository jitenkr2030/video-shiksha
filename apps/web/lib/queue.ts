import Redis from 'ioredis'
import { Queue, Worker, BackoffOptions } from 'bullmq'

// Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

// Queue connection
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
}

// Create queues
export const videoQueue = new Queue('video-processing', { connection })
export const scriptQueue = new Queue('script-generation', { connection })
export const ttsQueue = new Queue('tts-generation', { connection })
export const renderQueue = new Queue('video-rendering', { connection })

// Job types
export enum JobType {
  PPT_PARSE = 'ppt-parse',
  SCRIPT_GENERATE = 'script-generate',
  TTS_GENERATE = 'tts-generate',
  VIDEO_RENDER = 'video-render',
  SUBTITLE_GENERATE = 'subtitle-generate',
}

// Job priorities
export const JobPriority = {
  LOW: 1,
  NORMAL: 5,
  HIGH: 10,
  URGENT: 20,
}

// Default backoff options
const DEFAULT_BACKOFF: BackoffOptions = {
  type: 'exponential',
  delay: 1000,
}

// Queue service class
export class QueueService {
  // Add job to queue
  async addJob(
    queueName: string,
    jobType: JobType,
    data: any,
    options: {
      delay?: number
      priority?: number
      attempts?: number
      backoff?: BackoffOptions
    } = {}
  ) {
    const queue = this.getQueue(queueName)
    
    return queue.add(
      jobType,
      data,
      {
        delay: options.delay,
        priority: options.priority || JobPriority.NORMAL,
        attempts: options.attempts || 3,
        backoff: options.backoff || DEFAULT_BACKOFF,
      }
    )
  }

  // Get job status
  async getJobStatus(queueName: string, jobId: string) {
    const queue = this.getQueue(queueName)
    const job = await queue.getJob(jobId)
    
    if (!job) {
      return null
    }

    return {
      id: job.id,
      data: job.data,
      progress: job.progress,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
      returnvalue: job.returnvalue,
      state: await job.getState(),
    }
  }

  // Get queue jobs
  async getQueueJobs(queueName: string, state: 'active' | 'waiting' | 'completed' | 'failed' = 'waiting') {
    const queue = this.getQueue(queueName)
    return queue.getJobs([state], 0, -1)
  }

  // Remove job
  async removeJob(queueName: string, jobId: string) {
    const queue = this.getQueue(queueName)
    const job = await queue.getJob(jobId)
    
    if (job) {
      await job.remove()
      return true
    }
    
    return false
  }

  // Pause queue
  async pauseQueue(queueName: string) {
    const queue = this.getQueue(queueName)
    await queue.pause()
  }

  // Resume queue
  async resumeQueue(queueName: string) {
    const queue = this.getQueue(queueName)
    await queue.resume()
  }

  // Get queue stats
  async getQueueStats(queueName: string) {
    const queue = this.getQueue(queueName)
    
    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
    ])

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    }
  }

  private getQueue(queueName: string) {
    switch (queueName) {
      case 'video-processing':
        return videoQueue
      case 'script-generation':
        return scriptQueue
      case 'tts-generation':
        return ttsQueue
      case 'video-rendering':
        return renderQueue
      default:
        throw new Error(`Unknown queue: ${queueName}`)
    }
  }

  // Clean up completed jobs
  async cleanCompletedJobs(queueName: string, keepLast: number = 100) {
    const queue = this.getQueue(queueName)
    await queue.clean(24 * 60 * 60 * 1000, 0, 'completed') // Keep last 24 hours
  }

  // Clean up failed jobs
  async cleanFailedJobs(queueName: string) {
    const queue = this.getQueue(queueName)
    await queue.clean(7 * 24 * 60 * 60 * 1000, 0, 'failed') // Keep failed jobs for 7 days
  }
}

export const queueService = new QueueService()

// Redis utility functions
export const redisUtils = {
  // Cache data
  async set(key: string, value: any, ttl: number = 3600) {
    await redis.setex(key, ttl, JSON.stringify(value))
  },

  // Get cached data
  async get(key: string) {
    const value = await redis.get(key)
    return value ? JSON.parse(value) : null
  },

  // Delete cached data
  async del(key: string) {
    await redis.del(key)
  },

  // Check if key exists
  async exists(key: string) {
    return (await redis.exists(key)) === 1
  },

  // Increment counter
  async incr(key: string) {
    return redis.incr(key)
  },

  // Set with expiration only if key doesn't exist
  async setnx(key: string, value: any, ttl: number = 3600) {
    const result = await redis.set(key, JSON.stringify(value), 'EX', ttl, 'NX')
    return result === 'OK'
  },
}

// Close connections
export async function closeConnections() {
  await videoQueue.close()
  await scriptQueue.close()
  await ttsQueue.close()
  await renderQueue.close()
  await redis.quit()
}