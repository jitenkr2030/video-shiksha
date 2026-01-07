import { Job, Worker } from 'bullmq'
import { db } from '../lib/db'
import { storageService } from '../services/storage.service'
import { libreOfficeService } from '../services/libreoffice.service'

export async function pptParseJob(job: Job) {
  const { projectId, fileUrl, key, userId } = job.data

  try {
    console.log(`Starting PPT parse for project ${projectId}`)

    // Update job status
    await updateJobStatus(job.id, 'RUNNING', 10)

    // Download file from storage
    const fileBuffer = await storageService.downloadFile(key)
    
    // Update progress
    await updateJobStatus(job.id, 'RUNNING', 30)

    // Extract slides using LibreOffice
    const slides = await libreOfficeService.extractSlides(fileBuffer)
    
    // Update progress
    await updateJobStatus(job.id, 'RUNNING', 60)

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

    // Update progress
    await updateJobStatus(job.id, 'RUNNING', 90)

    // Update project status
    await db.project.update({
      where: { id: projectId },
      data: { status: 'COMPLETED' }
    })

    // Complete job
    await updateJobStatus(job.id, 'COMPLETED', 100, {
      slidesCount: savedSlides.length,
      message: 'Successfully parsed presentation'
    })

    console.log(`Completed PPT parse for project ${projectId}, extracted ${savedSlides.length} slides`)
    
    return {
      success: true,
      slidesCount: savedSlides.length,
      slides: savedSlides.map(s => ({ id: s.id, title: s.title }))
    }

  } catch (error) {
    console.error(`PPT parse error for project ${projectId}:`, error)
    
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