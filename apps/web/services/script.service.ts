import { db } from '@/lib/db'
import { aiService } from '@/lib/ai'
import { queueService, JobType } from '@/lib/queue'

export class ScriptService {
  async generateScript(slideId: string, customPrompt?: string) {
    try {
      const slide = await db.slide.findUnique({
        where: { id: slideId }
      })

      if (!slide) {
        throw new Error('Slide not found')
      }

      // Generate script using AI
      const scriptContent = await aiService.generateScript(slide.content, customPrompt)

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

      // Queue TTS generation
      await queueService.addJob(
        'tts-generation',
        JobType.TTS_GENERATE,
        {
          scriptId: script.id,
          content: scriptContent,
          voiceSettings: script.voiceSettings
        }
      )

      return script
    } catch (error) {
      console.error('Script generation error:', error)
      throw new Error('Failed to generate script')
    }
  }

  async regenerateScript(slideId: string, customPrompt?: string) {
    // Delete existing script
    await db.script.deleteMany({
      where: { slideId }
    })

    // Generate new script
    return await this.generateScript(slideId, customPrompt)
  }

  async updateScript(scriptId: string, updates: {
    content?: string
    voiceSettings?: any
  }) {
    return await db.script.update({
      where: { id: scriptId },
      data: updates
    })
  }

  async getSlideScripts(slideId: string) {
    return await db.script.findMany({
      where: { slideId },
      orderBy: { generatedAt: 'desc' }
    })
  }

  async getProjectScripts(projectId: string) {
    return await db.script.findMany({
      where: {
        slide: {
          projectId
        }
      },
      include: {
        slide: {
          select: {
            title: true,
            order: true
          }
        }
      },
      orderBy: {
        slide: {
          order: 'asc'
        }
      }
    })
  }

  async generateAllScriptsForProject(projectId: string, customPrompt?: string) {
    const slides = await db.slide.findMany({
      where: { projectId },
      orderBy: { order: 'asc' }
    })

    const scripts = await Promise.all(
      slides.map(slide => 
        this.generateScript(slide.id, customPrompt)
      )
    )

    return scripts
  }

  async getScriptWithAudio(scriptId: string) {
    return await db.script.findUnique({
      where: { id: scriptId },
      include: {
        slide: {
          select: {
            title: true,
            duration: true
          }
        }
      }
    })
  }

  async updateVoiceSettings(scriptId: string, voiceSettings: {
    provider: string
    voice: string
    speed: number
    pitch: number
    language: string
  }) {
    // Update script voice settings
    const script = await db.script.update({
      where: { id: scriptId },
      data: { voiceSettings }
    })

    // Regenerate audio with new settings
    await queueService.addJob(
      'tts-generation',
      JobType.TTS_GENERATE,
      {
        scriptId: script.id,
        content: script.content,
        voiceSettings
      }
    )

    return script
  }

  async deleteScript(scriptId: string) {
    return await db.script.delete({
      where: { id: scriptId }
    })
  }

  async getScriptAnalysis(projectId: string) {
    const scripts = await this.getProjectScripts(projectId)
    
    const totalWords = scripts.reduce((acc, script) => {
      return acc + script.content.split(' ').length
    }, 0)

    const totalDuration = scripts.reduce((acc, script) => {
      return acc + (script.slide?.duration || 0)
    }, 0)

    const averageWordsPerSlide = Math.round(totalWords / scripts.length)

    return {
      totalSlides: scripts.length,
      totalWords,
      totalDuration,
      averageWordsPerSlide,
      estimatedVideoLength: totalDuration
    }
  }
}

export const scriptService = new ScriptService()