import { Job } from 'bullmq'
import { db } from '../lib/db'
import { aiService } from '../services/ai.service'

export async function scriptGenerateJob(job: Job) {
  const { slideId, content, customPrompt } = job.data

  try {
    console.log(`Starting script generation for slide ${slideId}`)

    // Update job status
    await updateJobStatus(job.id, 'RUNNING', 10)

    // Get slide info
    const slide = await db.slide.findUnique({
      where: { id: slideId },
      include: { project: true }
    })

    if (!slide) {
      throw new Error('Slide not found')
    }

    // Update progress
    await updateJobStatus(job.id, 'RUNNING', 30)

    // Generate script using AI
    const scriptContent = await aiService.generateScript(content, customPrompt)
    
    // Update progress
    await updateJobStatus(job.id, 'RUNNING', 70)

    // Save script to database
    const script = await db.script.create({
      data: {
        slideId,
        content: scriptContent,
        voiceSettings: {
          provider: 'openai',
          voice: 'alloy',
          speed: 1.0,
          pitch: 1.0,
          language: 'en'
        }
      }
    })

    // Update progress
    await updateJobStatus(job.id, 'RUNNING', 90)

    // Complete job
    await updateJobStatus(job.id, 'COMPLETED', 100, {
      scriptId: script.id,
      content: scriptContent,
      message: 'Successfully generated script'
    })

    console.log(`Completed script generation for slide ${slideId}`)
    
    return {
      success: true,
      scriptId: script.id,
      content: scriptContent
    }

  } catch (error) {
    console.error(`Script generation error for slide ${slideId}:`, error)
    
    // Fail job
    await updateJobStatus(job.id, 'FAILED', 0, null, error.message)
    
    throw error
  }
}

async function updateJobStatus(jobId: string, status: string, progress: number, result?: any, error?: string) {
  await db.job.update({
    where: { id: jobId },
    data: {
      status,
      progress,
      result,
      error,
      updatedAt: new Date(),
      startedAt: status === 'RUNNING' ? new Date() : undefined,
      completedAt: status === 'COMPLETED' || status === 'FAILED' ? new Date() : undefined
    }
  })
}