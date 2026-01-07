import { db } from '@/lib/db'
import { storage } from '@/lib/storage'
import { queueService, JobType } from '@/lib/queue'
import { validateFile, sanitizeFileName } from '@/lib/utils'

export class PPTService {
  async uploadPresentation(file: File, userId: string, projectId: string) {
    // Validate file
    const validation = validateFile(
      file,
      ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
      100 * 1024 * 1024 // 100MB
    )

    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // Upload to storage
    const fileName = sanitizeFileName(file.name)
    const key = storage.generateKey(userId, projectId, fileName)
    const fileUrl = await storage.uploadFile(file, key)

    // Save file info to database
    const project = await db.project.update({
      where: { id: projectId },
      data: {
        // Add file info to project metadata or create separate file table
      }
    })

    // Queue PPT parsing job
    await queueService.addJob(
      'video-processing',
      JobType.PPT_PARSE,
      {
        projectId,
        fileUrl,
        key,
        userId
      }
    )

    return {
      success: true,
      fileUrl,
      projectId
    }
  }

  async parsePresentation(projectId: string, fileUrl: string) {
    try {
      // This would integrate with LibreOffice or a PPT parsing library
      // For now, we'll simulate the parsing process
      
      const slides = await this.extractSlidesFromFile(fileUrl)
      
      // Save slides to database
      const savedSlides = await Promise.all(
        slides.map(async (slide, index) => {
          return await db.slide.create({
            data: {
              projectId,
              order: index + 1,
              title: slide.title,
              content: slide.content,
              imageUrl: slide.imageUrl,
              duration: slide.duration || 5
            }
          })
        })
      )

      // Queue script generation for each slide
      for (const slide of savedSlides) {
        await queueService.addJob(
          'script-generation',
          JobType.SCRIPT_GENERATE,
          {
            slideId: slide.id,
            content: slide.content
          }
        )
      }

      return savedSlides
    } catch (error) {
      console.error('PPT parsing error:', error)
      throw new Error('Failed to parse presentation')
    }
  }

  private async extractSlidesFromFile(fileUrl: string): Promise<Array<{
    title: string
    content: string
    imageUrl?: string
    duration?: number
  }>> {
    // This is a placeholder implementation
    // In a real app, you would use LibreOffice or a PPT parsing library
    
    return [
      {
        title: 'Introduction',
        content: 'Welcome to this presentation. Today we will explore the main topics and key concepts.',
        duration: 5
      },
      {
        title: 'Main Topic',
        content: 'Let\'s dive into the main subject matter and understand its importance in our context.',
        duration: 7
      },
      {
        title: 'Key Points',
        content: 'Here are the essential points you need to remember about this topic.',
        duration: 6
      },
      {
        title: 'Conclusion',
        content: 'To summarize what we\'ve learned and discuss next steps.',
        duration: 4
      }
    ]
  }

  async getProjectSlides(projectId: string) {
    return await db.slide.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
      include: {
        scripts: true
      }
    })
  }

  async updateSlide(slideId: string, updates: {
    title?: string
    content?: string
    duration?: number
  }) {
    return await db.slide.update({
      where: { id: slideId },
      data: updates
    })
  }

  async deleteSlide(slideId: string) {
    return await db.slide.delete({
      where: { id: slideId }
    })
  }

  async reorderSlides(projectId: string, slideOrders: Array<{
    slideId: string
    newOrder: number
  }>) {
    const updates = slideOrders.map(({ slideId, newOrder }) =>
      db.slide.update({
        where: { id: slideId },
        data: { order: newOrder }
      })
    )

    await Promise.all(updates)
  }
}

export const pptService = new PPTService()