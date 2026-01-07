import { Job } from 'bullmq'
import { db } from '../lib/db'
import { ffmpegService } from '../services/ffmpeg.service'
import { storageService } from '../services/storage.service'

export async function subtitleGenerateJob(job: Job) {
  const { videoId, projectId } = job.data

  try {
    console.log(`Starting subtitle generation for video ${videoId}`)

    // Update job status
    await updateJobStatus(job.id, 'RUNNING', 10)

    // Get video info with slides
    const video = await db.video.findUnique({
      where: { id: videoId },
      include: {
        project: {
          include: {
            slides: {
              include: {
                scripts: true
              },
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    })

    if (!video) {
      throw new Error('Video not found')
    }

    // Update progress
    await updateJobStatus(job.id, 'RUNNING', 20)

    // Download video from storage
    const videoKey = `videos/${projectId}/${videoId}.mp3`
    const videoBuffer = await storageService.downloadFile(videoKey)

    // Update progress
    await updateJobStatus(job.id, 'RUNNING', 30)

    // Prepare subtitle data
    const subtitleData = video.project.slides.map((slide, index) => {
      const script = slide.scripts[0]
      if (!script) return null

      // Calculate timing based on slide duration
      const startTime = slide.slidesBefore?.reduce((acc, s) => acc + s.duration, 0) || 0
      const endTime = startTime + slide.duration

      return {
        index: index + 1,
        startTime,
        endTime,
        text: script.content,
        slideId: slide.id
      }
    }).filter(Boolean)

    // Update progress
    await updateJobStatus(job.id, 'RUNNING', 50)

    // Generate subtitles using FFmpeg
    const subtitleBuffer = await ffmpegService.generateSubtitles(subtitleData)

    // Update progress
    await updateJobStatus(job.id, 'RUNNING', 80)

    // Upload subtitles to storage
    const subtitleKey = `subtitles/${videoId}.srt`
    const subtitleUrl = await storageService.uploadBuffer(
      subtitleBuffer,
      subtitleKey,
      'text/plain'
    )

    // Update progress
    await updateJobStatus(job.id, 'RUNNING', 90)

    // Update video metadata with subtitle URL
    await db.video.update({
      where: { id: videoId },
      data: {
        metadata: {
          ...video.metadata,
          subtitleUrl,
          subtitlesGenerated: true,
          subtitlesGeneratedAt: new Date().toISOString()
        }
      }
    })

    // Complete job
    await updateJobStatus(job.id, 'COMPLETED', 100, {
      subtitleUrl,
      subtitlesCount: subtitleData.length,
      message: 'Successfully generated subtitles'
    })

    console.log(`Completed subtitle generation for video ${videoId}`)
    
    return {
      success: true,
      subtitleUrl,
      subtitlesCount: subtitleData.length
    }

  } catch (error) {
    console.error(`Subtitle generation error for video ${videoId}:`, error)
    
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