import { db } from '@/lib/db'
import { storage } from '@/lib/storage'
import { queueService, JobType } from '@/lib/queue'

export class VideoService {
  async renderVideo(projectId: string, settings?: {
    resolution?: string
    format?: string
    quality?: string
    transitionDuration?: number
  }) {
    try {
      const project = await db.project.findUnique({
        where: { id: projectId },
        include: {
          slides: {
            include: {
              scripts: true
            },
            orderBy: { order: 'asc' }
          }
        }
      })

      if (!project) {
        throw new Error('Project not found')
      }

      // Check if all slides have audio
      const slidesWithoutAudio = project.slides.filter(slide => !slide.audioUrl)
      if (slidesWithoutAudio.length > 0) {
        throw new Error(`${slidesWithoutAudio.length} slides missing audio. Please generate audio for all slides first.`)
      }

      // Create video record
      const video = await db.video.create({
        data: {
          projectId,
          status: 'PENDING',
          resolution: settings?.resolution || 'FULL_HD_1080',
          format: settings?.format || 'MP4',
          metadata: {
            settings: settings || {},
            slideCount: project.slides.length,
            createdAt: new Date().toISOString()
          }
        }
      })

      // Queue video rendering job
      await queueService.addJob(
        'video-rendering',
        JobType.VIDEO_RENDER,
        {
          videoId: video.id,
          projectId,
          slides: project.slides.map(slide => ({
            id: slide.id,
            title: slide.title,
            content: slide.content,
            audioUrl: slide.audioUrl,
            imageUrl: slide.imageUrl,
            duration: slide.duration
          })),
          settings: settings || {}
        }
      )

      return video
    } catch (error) {
      console.error('Video rendering error:', error)
      throw new Error('Failed to start video rendering')
    }
  }

  async updateVideoStatus(videoId: string, status: string, progress?: number, result?: any, error?: string) {
    return await db.video.update({
      where: { id: videoId },
      data: {
        status,
        progress: progress || 0,
        url: result?.videoUrl,
        thumbnailUrl: result?.thumbnailUrl,
        metadata: result ? {
          ...result,
          completedAt: new Date().toISOString()
        } : undefined,
        updatedAt: new Date()
      }
    })
  }

  async getProjectVideos(projectId: string) {
    return await db.video.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    })
  }

  async getVideo(videoId: string) {
    return await db.video.findUnique({
      where: { id: videoId },
      include: {
        project: {
          select: {
            title: true,
            userId: true
          }
        }
      }
    })
  }

  async deleteVideo(videoId: string) {
    try {
      const video = await db.video.findUnique({
        where: { id: videoId },
        select: { url: true, thumbnailUrl: true }
      })

      // Delete files from storage
      if (video?.url) {
        const videoKey = video.url.split('/').pop()
        if (videoKey) {
          await storage.deleteFile(`videos/${videoKey}`)
        }
      }

      if (video?.thumbnailUrl) {
        const thumbKey = video.thumbnailUrl.split('/').pop()
        if (thumbKey) {
          await storage.deleteFile(`thumbnails/${thumbKey}`)
        }
      }

      // Delete database record
      await db.video.delete({
        where: { id: videoId }
      })

      return { success: true }
    } catch (error) {
      console.error('Video deletion error:', error)
      throw new Error('Failed to delete video')
    }
  }

  async generateVideoThumbnail(videoId: string, videoUrl: string) {
    try {
      // This would use FFmpeg to generate thumbnail
      // For now, we'll create a placeholder
      
      const thumbnailKey = `thumbnails/${videoId}-${Date.now()}.jpg`
      const thumbnailUrl = await storage.uploadBuffer(
        Buffer.from('placeholder-thumbnail'), // Would be actual thumbnail buffer
        thumbnailKey,
        'image/jpeg'
      )

      // Update video with thumbnail URL
      await db.video.update({
        where: { id: videoId },
        data: { thumbnailUrl }
      })

      return thumbnailUrl
    } catch (error) {
      console.error('Thumbnail generation error:', error)
      throw new Error('Failed to generate thumbnail')
    }
  }

  async getVideoStats(userId: string) {
    const videos = await db.video.findMany({
      where: {
        project: {
          userId
        }
      },
      include: {
        project: {
          select: {
            title: true,
            createdAt: true
          }
        }
      }
    })

    const stats = {
      totalVideos: videos.length,
      completedVideos: videos.filter(v => v.status === 'COMPLETED').length,
      processingVideos: videos.filter(v => v.status === 'PROCESSING').length,
      failedVideos: videos.filter(v => v.status === 'FAILED').length,
      totalDuration: videos.reduce((acc, v) => acc + (v.duration || 0), 0),
      averageDuration: 0,
      resolutionDistribution: {} as Record<string, number>,
      formatDistribution: {} as Record<string, number>
    }

    if (videos.length > 0) {
      stats.averageDuration = stats.totalDuration / videos.length
    }

    // Calculate distributions
    videos.forEach(video => {
      stats.resolutionDistribution[video.resolution] = (stats.resolutionDistribution[video.resolution] || 0) + 1
      stats.formatDistribution[video.format] = (stats.formatDistribution[video.format] || 0) + 1
    })

    return stats
  }

  async getUserVideos(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit

    const [videos, total] = await Promise.all([
      db.video.findMany({
        where: {
          project: {
            userId
          }
        },
        include: {
          project: {
            select: {
              title: true,
              createdAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      db.video.count({
        where: {
          project: {
            userId
          }
        }
      })
    ])

    return {
      videos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  async updateVideoMetadata(videoId: string, metadata: any) {
    return await db.video.update({
      where: { id: videoId },
      data: {
        metadata,
        updatedAt: new Date()
      }
    })
  }

  async getVideoProcessingLogs(videoId: string) {
    // This would retrieve processing logs from your logging system
    // For now, return placeholder data
    return [
      {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: 'Video processing started'
      },
      {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: 'Processing slide 1/3'
      }
    ]
  }
}

export const videoService = new VideoService()