import { Job } from 'bullmq'
import { db } from '../lib/db'
import { ffmpegService } from '../services/ffmpeg.service'
import { storageService } from '../services/storage.service'

export async function videoRenderJob(job: Job) {
  const { videoId, projectId, slides, settings } = job.data

  try {
    console.log(`Starting video render for project ${projectId}`)

    // Update job status
    await updateJobStatus(job.id, 'RUNNING', 5)

    // Get video info
    const video = await db.video.findUnique({
      where: { id: videoId }
    })

    if (!video) {
      throw new Error('Video not found')
    }

    // Update video status to processing
    await db.video.update({
      where: { id: videoId },
      data: { status: 'PROCESSING' }
    })

    // Update progress
    await updateJobStatus(job.id, 'RUNNING', 10)

    // Prepare slide data for rendering
    const slideData = slides.map((slide, index) => ({
      ...slide,
      duration: slide.duration || 5,
      transitionDuration: settings.transitionDuration || 1.0
    }))

    // Update progress
    await updateJobStatus(job.id, 'RUNNING', 20)

    // Render video using FFmpeg
    const videoBuffer = await ffmpegService.renderVideo(slideData, {
      resolution: settings.resolution || '1080p',
      format: settings.format || 'mp4',
      quality: settings.quality || 'medium'
    })

    // Update progress
    await updateJobStatus(job.id, 'RUNNING', 80)

    // Upload video to storage
    const videoKey = `videos/${projectId}/${videoId}.mp4`
    const videoUrl = await storageService.uploadBuffer(
      videoBuffer,
      videoKey,
      'video/mp4'
    )

    // Update progress
    await updateJobStatus(job.id, 'RUNNING', 85)

    // Generate thumbnail
    const thumbnailBuffer = await ffmpegService.generateThumbnail(videoBuffer)
    const thumbnailKey = `thumbnails/${videoId}.jpg`
    const thumbnailUrl = await storageService.uploadBuffer(
      thumbnailBuffer,
      thumbnailKey,
      'image/jpeg'
    )

    // Update progress
    await updateJobStatus(job.id, 'RUNNING', 90)

    // Get video duration
    const duration = await ffmpegService.getVideoDuration(videoBuffer)

    // Update video record
    await db.video.update({
      where: { id: videoId },
      data: {
        url: videoUrl,
        thumbnailUrl,
        duration,
        status: 'COMPLETED',
        metadata: {
          ...video.metadata,
          completedAt: new Date().toISOString(),
          slideCount: slides.length,
          settings
        }
      }
    })

    // Update project status
    await db.project.update({
      where: { id: projectId },
      data: { status: 'COMPLETED' }
    })

    // Update progress
    await updateJobStatus(job.id, 'RUNNING', 95)

    // Complete job
    await updateJobStatus(job.id, 'COMPLETED', 100, {
      videoUrl,
      thumbnailUrl,
      duration,
      message: 'Successfully rendered video'
    })

    console.log(`Completed video render for project ${projectId}`)
    
    return {
      success: true,
      videoUrl,
      thumbnailUrl,
      duration
    }

  } catch (error) {
    console.error(`Video render error for project ${projectId}:`, error)
    
    // Update video status to failed
    await db.video.update({
      where: { id: videoId },
      data: { status: 'FAILED' }
    })

    // Update project status to failed
    await db.project.update({
      where: { id: projectId },
      data: { status: 'FAILED' }
    })

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