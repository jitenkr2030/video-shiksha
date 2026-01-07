import { db } from '@/lib/db'
import { aiService } from '@/lib/ai'
import { storage } from '@/lib/storage'

export class TTSService {
  async generateSpeech(scriptId: string) {
    try {
      const script = await db.script.findUnique({
        where: { id: scriptId },
        include: {
          slide: true
        }
      })

      if (!script) {
        throw new Error('Script not found')
      }

      // Generate audio using AI service
      const audioBuffer = await aiService.generateSpeech(
        script.content,
        script.voiceSettings.voice,
        {
          speed: script.voiceSettings.speed,
          pitch: script.voiceSettings.pitch
        }
      )

      // Upload audio to storage
      const audioKey = `audio/${script.slide.projectId}/${scriptId}.mp3`
      const audioUrl = await storage.uploadBuffer(
        audioBuffer,
        audioKey,
        'audio/mpeg'
      )

      // Update slide with audio URL
      await db.slide.update({
        where: { id: script.slideId },
        data: { audioUrl }
      })

      return {
        success: true,
        audioUrl,
        scriptId
      }
    } catch (error) {
      console.error('TTS generation error:', error)
      throw new Error('Failed to generate speech')
    }
  }

  async regenerateSpeech(scriptId: string, newVoiceSettings?: any) {
    try {
      const script = await db.script.findUnique({
        where: { id: scriptId }
      })

      if (!script) {
        throw new Error('Script not found')
      }

      // Update voice settings if provided
      if (newVoiceSettings) {
        await db.script.update({
          where: { id: scriptId },
          data: { voiceSettings: newVoiceSettings }
        })
      }

      // Generate new audio
      return await this.generateSpeech(scriptId)
    } catch (error) {
      console.error('Speech regeneration error:', error)
      throw new Error('Failed to regenerate speech')
    }
  }

  async getAvailableVoices() {
    return await aiService.getVoices()
  }

  async getVoicePreview(voiceId: string, text: string = 'Hello, this is a preview of the voice.') {
    try {
      const audioBuffer = await aiService.generateSpeech(text, voiceId)
      
      // Upload preview audio
      const previewKey = `previews/${voiceId}-${Date.now()}.mp3`
      const previewUrl = await storage.uploadBuffer(
        audioBuffer,
        previewKey,
        'audio/mpeg'
      )

      return {
        previewUrl,
        voiceId
      }
    } catch (error) {
      console.error('Voice preview error:', error)
      throw new Error('Failed to generate voice preview')
    }
  }

  async getProjectAudioFiles(projectId: string) {
    const slides = await db.slide.findMany({
      where: { projectId },
      select: {
        id: true,
        title: true,
        audioUrl: true,
        scripts: {
          select: {
            id: true,
            voiceSettings: true
          }
        }
      },
      orderBy: { order: 'asc' }
    })

    return slides.map(slide => ({
      slideId: slide.id,
      title: slide.title,
      audioUrl: slide.audioUrl,
      voiceSettings: slide.scripts[0]?.voiceSettings,
      hasAudio: !!slide.audioUrl
    }))
  }

  async deleteAudio(slideId: string) {
    try {
      const slide = await db.slide.findUnique({
        where: { id: slideId },
        select: { audioUrl: true }
      })

      if (slide?.audioUrl) {
        // Extract key from URL and delete from storage
        const key = slide.audioUrl.split('/').pop()
        if (key) {
          await storage.deleteFile(`audio/${key}`)
        }
      }

      // Update slide to remove audio URL
      await db.slide.update({
        where: { id: slideId },
        data: { audioUrl: null }
      })

      return { success: true }
    } catch (error) {
      console.error('Audio deletion error:', error)
      throw new Error('Failed to delete audio')
    }
  }

  async getAudioDuration(audioUrl: string): Promise<number> {
    // This would use audio analysis to get actual duration
    // For now, return estimated duration based on word count
    try {
      const response = await fetch(audioUrl)
      const buffer = await response.arrayBuffer()
      
      // In a real implementation, you would use a library like 'music-metadata'
      // to get the actual duration from the audio file
      
      // Placeholder: estimate 2.5 seconds per word
      return 30 // placeholder duration
    } catch (error) {
      console.error('Duration detection error:', error)
      return 30 // fallback duration
    }
  }

  async validateAudioFile(audioUrl: string): Promise<boolean> {
    try {
      const response = await fetch(audioUrl, { method: 'HEAD' })
      return response.ok && response.headers.get('content-type')?.includes('audio')
    } catch (error) {
      return false
    }
  }

  async getAudioStats(projectId: string) {
    const audioFiles = await this.getProjectAudioFiles(projectId)
    
    const stats = {
      totalSlides: audioFiles.length,
      slidesWithAudio: audioFiles.filter(file => file.hasAudio).length,
      slidesWithoutAudio: audioFiles.filter(file => !file.hasAudio).length,
      completionRate: 0,
      totalDuration: 0,
      voiceDistribution: {} as Record<string, number>
    }

    stats.completionRate = (stats.slidesWithAudio / stats.totalSlides) * 100

    // Calculate voice distribution
    audioFiles.forEach(file => {
      if (file.voiceSettings) {
        const voice = file.voiceSettings.voice
        stats.voiceDistribution[voice] = (stats.voiceDistribution[voice] || 0) + 1
      }
    })

    return stats
  }
}

export const ttsService = new TTSService()