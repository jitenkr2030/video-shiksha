import OpenAI from 'openai'
import ElevenLabs from 'elevenlabs'

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const elevenLabs = new ElevenLabs({
  apiKey: process.env.ELEVENLABS_API_KEY,
})

export class AIService {
  // OpenAI - Script Generation
  async generateScript(slideContent: string, customPrompt?: string): Promise<string> {
    try {
      const prompt = customPrompt || `
        Convert the following slide content into a natural, engaging narration script:
        
        "${slideContent}"
        
        Guidelines:
        - Keep it conversational and easy to understand
        - Aim for 2-3 sentences per slide
        - Use clear, simple language
        - Make it sound like a natural presentation
        - Include relevant details from the slide content
      `

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating engaging presentation scripts that convert slide content into natural narration.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
      })

      return response.choices[0]?.message?.content || slideContent
    } catch (error) {
      console.error('Script generation error:', error)
      throw new Error('Failed to generate script')
    }
  }

  // ElevenLabs - Text to Speech
  async generateSpeech(
    text: string,
    voiceId: string = 'pNInz6obpgDQGcFmaJgB', // Default voice
    settings: {
      speed?: number
      pitch?: number
    } = {}
  ): Promise<Buffer> {
    try {
      const response = await elevenLabs.generate({
        voice: voiceId,
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          style: 0.0,
          use_speaker_boost: true,
        },
      })

      const audioBuffer = await response.arrayBuffer()
      return Buffer.from(audioBuffer)
    } catch (error) {
      console.error('Speech generation error:', error)
      throw new Error('Failed to generate speech')
    }
  }

  // Get available voices
  async getVoices(): Promise<any[]> {
    try {
      const voices = await elevenLabs.voices.getAll()
      return voices.voices
    } catch (error) {
      console.error('Error fetching voices:', error)
      return []
    }
  }

  // Generate video title and description
  async generateVideoMetadata(slidesContent: string[]): Promise<{
    title: string
    description: string
  }> {
    try {
      const allContent = slidesContent.join('\n\n')
      
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating engaging titles and descriptions for educational videos.'
          },
          {
            role: 'user',
            content: `
              Based on the following presentation content, generate a catchy title and compelling description:
              
              Content: ${allContent}
              
              Return the response in JSON format:
              {
                "title": "Catchy title (max 60 characters)",
                "description": "Compelling description (max 160 characters)"
              }
            `
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      })

      const content = response.choices[0]?.message?.content
      if (content) {
        return JSON.parse(content)
      }

      return {
        title: 'Generated Video',
        description: 'A video created from your presentation'
      }
    } catch (error) {
      console.error('Metadata generation error:', error)
      return {
        title: 'Generated Video',
        description: 'A video created from your presentation'
      }
    }
  }
}

export const aiService = new AIService()