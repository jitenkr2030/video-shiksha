// Video service - Mock implementation for landing page deployment
// Database functionality is disabled for landing page deployment

export interface Video {
  id: string;
  projectId: string;
  status: string;
  progress: number;
  url?: string;
  thumbnailUrl?: string;
  resolution: string;
  format: string;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

export class VideoService {
  async renderVideo(projectId: string, settings?: {
    resolution?: string
    format?: string
    quality?: string
    transitionDuration?: number
  }) {
    const video: Video = {
      id: crypto.randomUUID(),
      projectId,
      status: 'PENDING',
      progress: 0,
      resolution: settings?.resolution || 'FULL_HD_1080',
      format: settings?.format || 'MP4',
      metadata: {
        settings: settings || {},
        slideCount: 0,
        createdAt: new Date().toISOString()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return video
  }

  async updateVideoStatus(videoId: string, status: string, progress?: number, result?: any, error?: string) {
    return {
      id: videoId,
      projectId: '',
      status,
      progress: progress || 0,
      url: result?.videoUrl,
      thumbnailUrl: result?.thumbnailUrl,
      resolution: 'FULL_HD_1080',
      format: 'MP4',
      metadata: result ? {
        ...result,
        completedAt: new Date().toISOString()
      } : {},
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  async getProjectVideos(projectId: string) {
    return []
  }

  async getVideo(videoId: string) {
    return {
      id: videoId,
      projectId: '',
      status: 'COMPLETED',
      progress: 100,
      url: `videos/${videoId}.mp4`,
      resolution: 'FULL_HD_1080',
      format: 'MP4',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  async deleteVideo(videoId: string) {
    return { success: true }
  }

  async cancelRendering(videoId: string) {
    return { success: true, status: 'CANCELLED' }
  }

  async retryRendering(videoId: string) {
    return {
      id: videoId,
      projectId: '',
      status: 'PENDING',
      progress: 0,
      resolution: 'FULL_HD_1080',
      format: 'MP4',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  async getVideoFormats() {
    return [
      { id: 'MP4', name: 'MP4', description: 'Most compatible format' },
      { id: 'MOV', name: 'MOV', description: 'Apple QuickTime' },
      { id: 'WEBM', name: 'WebM', description: 'Web optimized' },
      { id: 'AVI', name: 'AVI', description: 'Microsoft Video' }
    ]
  }

  async getResolutions() {
    return [
      { id: 'HD_720', name: '720p', width: 1280, height: 720 },
      { id: 'FULL_HD_1080', name: '1080p', width: 1920, height: 1080 },
      { id: 'QHD_1440', name: '1440p', width: 2560, height: 1440 },
      { id: 'UHD_4K', name: '4K', width: 3840, height: 2160 }
    ]
  }

  async getVideoStats(projectId: string) {
    return {
      totalVideos: 0,
      completedVideos: 0,
      pendingVideos: 0,
      failedVideos: 0,
      totalStorageUsed: 0
    }
  }
}

export const videoService = new VideoService()
