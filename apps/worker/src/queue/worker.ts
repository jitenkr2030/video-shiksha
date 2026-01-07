import { Worker, Job } from 'bullmq'
import Redis from 'ioredis'
import { pptParseJob } from '../jobs/ppt.parse'
import { scriptGenerateJob } from '../jobs/script.generate'
import { ttsGenerateJob } from '../jobs/tts.generate'
import { videoRenderJob } from '../jobs/video.render'
import { subtitleGenerateJob } from '../jobs/subtitle.generate'

// Redis connection
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
}

// Create workers
export const pptWorker = new Worker(
  'video-processing',
  async (job: Job) => {
    switch (job.name) {
      case 'ppt-parse':
        return await pptParseJob(job)
      default:
        throw new Error(`Unknown job type: ${job.name}`)
    }
  },
  { connection }
)

export const scriptWorker = new Worker(
  'script-generation',
  async (job: Job) => {
    switch (job.name) {
      case 'script-generate':
        return await scriptGenerateJob(job)
      default:
        throw new Error(`Unknown job type: ${job.name}`)
    }
  },
  { connection }
)

export const ttsWorker = new Worker(
  'tts-generation',
  async (job: Job) => {
    switch (job.name) {
      case 'tts-generate':
        return await ttsGenerateJob(job)
      default:
        throw new Error(`Unknown job type: ${job.name}`)
    }
  },
  { connection }
)

export const renderWorker = new Worker(
  'video-rendering',
  async (job: Job) => {
    switch (job.name) {
      case 'video-render':
        return await videoRenderJob(job)
      default:
        throw new Error(`Unknown job type: ${job.name}`)
    }
  },
  { connection }
)

export const subtitleWorker = new Worker(
  'subtitle-generation',
  async (job: Job) => {
    switch (job.name) {
      case 'subtitle-generate':
        return await subtitleGenerateJob(job)
      default:
        throw new Error(`Unknown job type: ${job.name}`)
    }
  },
  { connection }
)

// Error handling
pptWorker.on('error', (err) => {
  console.error('PPT Worker error:', err)
})

scriptWorker.on('error', (err) => {
  console.error('Script Worker error:', err)
})

ttsWorker.on('error', (err) => {
  console.error('TTS Worker error:', err)
})

renderWorker.on('error', (err) => {
  console.error('Render Worker error:', err)
})

subtitleWorker.on('error', (err) => {
  console.error('Subtitle Worker error:', err)
})

// Job completion logging
pptWorker.on('completed', (job) => {
  console.log(`PPT job completed: ${job.id}`)
})

scriptWorker.on('completed', (job) => {
  console.log(`Script job completed: ${job.id}`)
})

ttsWorker.on('completed', (job) => {
  console.log(`TTS job completed: ${job.id}`)
})

renderWorker.on('completed', (job) => {
  console.log(`Render job completed: ${job.id}`)
})

subtitleWorker.on('completed', (job) => {
  console.log(`Subtitle job completed: ${job.id}`)
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down workers...')
  
  await Promise.all([
    pptWorker.close(),
    scriptWorker.close(),
    ttsWorker.close(),
    renderWorker.close(),
    subtitleWorker.close()
  ])
  
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('Shutting down workers...')
  
  await Promise.all([
    pptWorker.close(),
    scriptWorker.close(),
    ttsWorker.close(),
    renderWorker.close(),
    subtitleWorker.close()
  ])
  
  process.exit(0)
})