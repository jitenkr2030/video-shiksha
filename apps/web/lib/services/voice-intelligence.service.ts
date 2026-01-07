import { ElevenLabs } from 'elevenlabs';
import { GeneratedScript } from './script-generation.service';
import { storage } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

export interface VoiceSettings {
  voiceId: string;
  language: string;
  accent?: string;
  gender: 'male' | 'female' | 'neutral';
  speed: number; // 0.5 to 2.0
  pitch: number; // -20 to 20
  stability: number; // 0 to 1
  similarity_boost: number; // 0 to 1
}

export interface VoiceProvider {
  name: string;
  id: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  accent?: string;
  description: string;
  sampleUrl?: string;
}

export interface GeneratedAudio {
  slideId: string;
  audioUrl: string;
  duration: number;
  fileSize: number;
  voiceSettings: VoiceSettings;
}

export class VoiceIntelligenceService {
  private elevenLabs: ElevenLabs;
  
  // Available voices for different languages and accents
  private availableVoices: VoiceProvider[] = [
    // English Voices
    { name: 'Rachel', id: '21m00Tcm4TlvDq8ikWAM', language: 'en', gender: 'female', description: 'Natural, warm, and professional voice' },
    { name: 'Adam', id: 'pNInz6obpgDQGcFmaJgB', language: 'en', gender: 'male', description: 'Clear, confident, and authoritative voice' },
    { name: 'Sam', id: 'yoZ06aMxZJJ28mfd3POQ', language: 'en', gender: 'male', description: 'Friendly and conversational voice' },
    { name: 'Jessie', id: 'LcfcDJNUP1GQjkzn1xUU', language: 'en', gender: 'female', description: 'Energetic and engaging voice' },
    
    // Indian English Accents
    { name: 'Priya', id: 'XB0fDUnXU5powFXDhCwa', language: 'en', gender: 'female', accent: 'indian', description: 'Natural Indian English accent' },
    { name: 'Ravi', id: 'TxGEqnHWrfWFTfGW9XjX', language: 'en', gender: 'male', accent: 'indian', description: 'Clear Indian English accent' },
    
    // Hindi Voices (using multilingual models)
    { name: 'Anjali', id: 'EXAVITGu4C4rY3xleLJB', language: 'hi', gender: 'female', description: 'Natural Hindi voice' },
    { name: 'Rahul', id: 'bIHbv24MWmeRgasZH58w', language: 'hi', gender: 'male', description: 'Clear Hindi voice' },
  ];

  constructor() {
    this.elevenLabs = new ElevenLabs({
      apiKey: process.env.ELEVENLABS_API_KEY || '',
    });
  }

  getAvailableVoices(language?: string, gender?: string): VoiceProvider[] {
    let voices = this.availableVoices;
    
    if (language) {
      voices = voices.filter(v => v.language === language);
    }
    
    if (gender) {
      voices = voices.filter(v => v.gender === gender);
    }
    
    return voices;
  }

  async generateAudioForScript(
    script: GeneratedScript,
    voiceSettings: VoiceSettings
  ): Promise<GeneratedAudio> {
    try {
      // Clean the script for TTS
      const cleanedScript = this.cleanScriptForTTS(script.script);
      
      // Generate audio using ElevenLabs
      const audio = await this.elevenLabs.generate({
        voice: voiceSettings.voiceId,
        text: cleanedScript,
        model_id: 'eleven_multilingual_v2', // Supports multiple languages
        voice_settings: {
          stability: voiceSettings.stability,
          similarity_boost: voiceSettings.similarity_boost,
          style: 0.0,
          use_speaker_boost: true,
        },
      });

      // Save audio to temporary file
      const tempDir = '/tmp/audio_generation';
      await fs.mkdir(tempDir, { recursive: true });
      
      const audioFileName = `${script.slideId}_${uuidv4()}.mp3`;
      const audioPath = path.join(tempDir, audioFileName);
      
      // Convert audio stream to buffer
      const audioBuffer = await this.audioStreamToBuffer(audio);
      await fs.writeFile(audioPath, audioBuffer);

      // Upload to storage
      const audioUrl = await storage.uploadFile(
        audioBuffer,
        `audio/${voiceSettings.language}/${audioFileName}`,
        'audio/mpeg'
      );

      // Get audio duration
      const duration = await this.getAudioDuration(audioBuffer);

      // Clean up temp file
      await fs.unlink(audioPath);

      return {
        slideId: script.slideId,
        audioUrl,
        duration,
        fileSize: audioBuffer.length,
        voiceSettings
      };

    } catch (error) {
      console.error('Audio generation failed:', error);
      throw new Error(`Failed to generate audio for slide ${script.slideId}: ${error}`);
    }
  }

  async generateAudioForScripts(
    scripts: GeneratedScript[],
    voiceSettings: VoiceSettings
  ): Promise<GeneratedAudio[]> {
    const audioFiles: GeneratedAudio[] = [];
    
    for (const script of scripts) {
      try {
        const audio = await this.generateAudioForScript(script, voiceSettings);
        audioFiles.push(audio);
      } catch (error) {
        console.error(`Failed to generate audio for slide ${script.slideId}:`, error);
        // Continue with other slides even if one fails
      }
    }
    
    return audioFiles;
  }

  private cleanScriptForTTS(script: string): string {
    // Remove or replace characters that might cause issues with TTS
    return script
      .replace(/\[.*?\]/g, '') // Remove bracketed text
      .replace(/\(.*?\)/g, '') // Remove parenthetical text
      .replace(/[""'']/g, '"') // Normalize quotes
      .replace(/[…]/g, '...') // Normalize ellipsis
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private async audioStreamToBuffer(stream: any): Promise<Buffer> {
    const chunks: Buffer[] = [];
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      
      stream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      
      stream.on('error', reject);
    });
  }

  private async getAudioDuration(audioBuffer: Buffer): Promise<number> {
    // This is a simplified estimation. In production, you'd use a library like 'music-metadata'
    // For now, estimate based on file size (assuming ~128kbps MP3)
    const estimatedBitrate = 128000; // bits per second
    const fileSizeInBits = audioBuffer.length * 8;
    return Math.round(fileSizeInBits / estimatedBitrate);
  }

  async previewVoice(
    text: string,
    voiceId: string,
    language: string
  ): Promise<string> {
    try {
      const previewText = text.length > 100 ? text.substring(0, 100) + '...' : text;
      
      const audio = await this.elevenLabs.generate({
        voice: voiceId,
        text: previewText,
        model_id: 'eleven_multilingual_v2',
      });

      const audioBuffer = await this.audioStreamToBuffer(audio);
      
      const previewUrl = await storage.uploadFile(
        audioBuffer,
        `previews/${uuidv4()}.mp3`,
        'audio/mpeg'
      );

      return previewUrl;
    } catch (error) {
      console.error('Voice preview failed:', error);
      throw new Error('Failed to generate voice preview');
    }
  }

  async detectLanguage(text: string): Promise<string> {
    // Simple language detection for TTS optimization
    const hindiPattern = /[\u0900-\u097F]/;
    const tamilPattern = /[\u0B80-\u0BFF]/;
    const teluguPattern = /[\u0C00-\u0C7F]/;
    const bengaliPattern = /[\u0980-\u09FF]/;
    const marathiPattern = /[\u0900-\u097F]/;
    
    if (hindiPattern.test(text) || marathiPattern.test(text)) return 'hi';
    if (tamilPattern.test(text)) return 'ta';
    if (teluguPattern.test(text)) return 'te';
    if (bengaliPattern.test(text)) return 'bn';
    
    return 'en';
  }

  async getRecommendedVoice(
    language: string,
    gender?: 'male' | 'female' | 'neutral',
    accent?: string
  ): Promise<VoiceProvider> {
    const voices = this.getAvailableVoices(language, gender);
    
    if (voices.length === 0) {
      // Fallback to English voices if no language-specific voices available
      const englishVoices = this.getAvailableVoices('en', gender);
      return englishVoices[0] || this.availableVoices[0];
    }
    
    // Prefer accent-specific voices if requested
    if (accent) {
      const accentVoices = voices.filter(v => v.accent === accent);
      if (accentVoices.length > 0) {
        return accentVoices[0];
      }
    }
    
    return voices[0];
  }

  async createVoiceProfile(
    userId: string,
    name: string,
    voiceSettings: VoiceSettings
  ): Promise<void> {
    // Save user's preferred voice settings to database
    // This would be implemented with your database service
    console.log(`Creating voice profile for user ${userId}:`, { name, voiceSettings });
  }

  async getUserVoiceProfiles(userId: string): Promise<Array<{ id: string; name: string; voiceSettings: VoiceSettings }>> {
    // Retrieve user's saved voice profiles from database
    // This would be implemented with your database service
    return [];
  }

  async optimizeVoiceForContent(
    script: string,
    voiceSettings: VoiceSettings,
    contentType: 'educational' | 'corporate' | 'casual' = 'educational'
  ): Promise<VoiceSettings> {
    // Adjust voice settings based on content type
    const optimizedSettings = { ...voiceSettings };
    
    switch (contentType) {
      case 'educational':
        optimizedSettings.speed = Math.min(voiceSettings.speed, 1.0); // Slower for learning
        optimizedSettings.stability = Math.max(voiceSettings.stability, 0.7); // More stable
        break;
      case 'corporate':
        optimizedSettings.speed = Math.min(voiceSettings.speed, 1.1); // Professional pace
        optimizedSettings.pitch = 0; // Neutral pitch
        break;
      case 'casual':
        optimizedSettings.speed = Math.min(voiceSettings.speed, 1.2); // More conversational
        optimizedSettings.similarity_boost = Math.max(voiceSettings.similarity_boost, 0.8);
        break;
    }
    
    return optimizedSettings;
  }
}

export const voiceIntelligenceService = new VoiceIntelligenceService();