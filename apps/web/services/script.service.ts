// Script service - Mock implementation for landing page deployment
// Database functionality is disabled for landing page deployment

export interface Script {
  id: string;
  slideId: string;
  content: string;
  voiceSettings: {
    provider: string;
    voice: string;
    speed: number;
    pitch: number;
    language: string;
  };
  generatedAt: Date;
}

export class ScriptService {
  async generateScript(slideId: string, customPrompt?: string) {
    const scriptContent = `This is a generated script for slide ${slideId}. ${customPrompt ? `Custom prompt: ${customPrompt}` : ''}`
    
    const script: Script = {
      id: crypto.randomUUID(),
      slideId,
      content: scriptContent,
      voiceSettings: {
        provider: 'openai',
        voice: 'alloy',
        speed: 1.0,
        pitch: 1.0,
        language: 'en'
      },
      generatedAt: new Date()
    }

    return script
  }

  async regenerateScript(slideId: string, customPrompt?: string) {
    return await this.generateScript(slideId, customPrompt)
  }

  async updateScript(scriptId: string, updates: {
    content?: string
    voiceSettings?: any
  }) {
    return {
      id: scriptId,
      slideId: '',
      content: updates.content || '',
      voiceSettings: updates.voiceSettings || {
        provider: 'openai',
        voice: 'alloy',
        speed: 1.0,
        pitch: 1.0,
        language: 'en'
      },
      generatedAt: new Date()
    }
  }

  async getSlideScripts(slideId: string) {
    return []
  }

  async getProjectScripts(projectId: string) {
    return []
  }
}

export const scriptService = new ScriptService()
