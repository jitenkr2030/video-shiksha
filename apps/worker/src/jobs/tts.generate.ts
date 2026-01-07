import { Job } from 'bullmq'
import { db } from '../lib/db'
import { aiService } from '../services/ai.service'
import { storageService } from '../services/storage.service'

export async function ttsGenerateJob(job: Job) {
  const { scriptId, content, voiceSettings } = job.data

  try {
    console.log(`Starting TTS generation for script ${scriptId}`)

    // Update job status
    await updateJobStatus(job.id, 'RUNNING', 10)

    // Get script info
    const script = await db.script.findUnique({
      where: { id: scriptId },
      include: { slide: true }
    })

    if (!script) {
      throw new Error('Script not found')
    }

    // Update progress
    await updateJobStatus(job.id, 'RUNNING', 30)

    // Generate audio using AI service
    const audioBuffer = await aiService.generateSpeech(
      content,
      voiceSettings.voice,
      {
        speed: voiceSettings.speed,
        pitch: voiceSettings.pitch
      }
    )
    
    // Update progress
    await updateJobStatus(job.id, 'RUNNING', 70)

    // Upload audio to storage
    const audioKey = `audio/${script.slide.projectId}/${scriptId}.mp3`
    const audioUrl = await storageService.uploadBuffer(
      audioBuffer,
      audioKey,
      'audio/mpeg'
    )

    // Update slide with audio URL
    await db.slide.update({
      where: { id: script.slideId },
      data: { audioUrl }
    })

    // Update progress
    await updateJobStatus(job.id, 'RUNNING', 90)

    // Complete job
    await updateJobStatus(job.id, 'COMPLETED', 100, {
      audioUrl,
      scriptId,
      message: 'Successfully generated audio'
    })

    console.log(`Completed TTS generation for script ${scriptId}`)
    
    return {
      success: true,
      audioUrl,
      scriptId
    }

  } catch (error) {
    console.error(`TTS generation error for script ${scriptId}:`, error)
    
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