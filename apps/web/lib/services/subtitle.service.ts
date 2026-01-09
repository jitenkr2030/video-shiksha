import { GeneratedScript } from './script-generation.service';
import { GeneratedAudio } from './voice-intelligence.service';
import { storage } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

export interface SubtitleOptions {
  format: 'srt' | 'vtt' | 'ass';
  language: string;
  style: {
    fontFamily: string;
    fontSize: number;
    fontColor: string;
    backgroundColor?: string;
    position: 'top' | 'center' | 'bottom';
    alignment: 'left' | 'center' | 'right';
    outline?: boolean;
    outlineColor?: string;
    outlineWidth?: number;
  };
  timing: {
    maxCharsPerLine: number;
    maxLinesPerSubtitle: number;
    minDuration: number; // seconds
    maxDuration: number; // seconds
    gapBetweenSubtitles: number; // seconds
  };
}

export interface SubtitleEntry {
  id: string;
  startTime: number; // seconds
  endTime: number; // seconds
  text: string;
  confidence?: number; // 0-1
  speaker?: string;
}

export interface GeneratedSubtitles {
  id: string;
  format: string;
  language: string;
  entries: SubtitleEntry[];
  fileUrl: string;
  metadata: {
    totalDuration: number;
    wordCount: number;
    averageReadingSpeed: number; // words per minute
  };
}

export class SubtitleService {
  private defaultStyles = {
    srt: {
      fontFamily: 'Arial',
      fontSize: 24,
      fontColor: '#FFFFFF',
      backgroundColor: '#000000',
      position: 'bottom' as const,
      alignment: 'center' as const,
      outline: false
    },
    vtt: {
      fontFamily: 'Arial',
      fontSize: 16,
      fontColor: '#FFFFFF',
      position: 'bottom' as const,
      alignment: 'center' as const,
      outline: true,
      outlineColor: '#000000',
      outlineWidth: 2
    },
    ass: {
      fontFamily: 'Arial',
      fontSize: 20,
      fontColor: '#FFFFFF',
      position: 'bottom' as const,
      alignment: 'center' as const,
      outline: true,
      outlineColor: '#000000',
      outlineWidth: 1
    }
  };

  async generateSubtitles(
    scripts: GeneratedScript[],
    audioFiles: GeneratedAudio[],
    options: SubtitleOptions
  ): Promise<GeneratedSubtitles> {
    const subtitleId = uuidv4();
    const entries: SubtitleEntry[] = [];
    
    let currentTime = 0;
    
    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i];
      const audio = audioFiles[i];
      
      if (!audio) continue;
      
      // Generate subtitle entries for this slide
      const slideEntries = await this.generateSlideSubtitles(
        script,
        audio,
        currentTime,
        options
      );
      
      entries.push(...slideEntries);
      currentTime = audio.duration;
    }
    
    // Generate subtitle file
    const fileContent = this.generateSubtitleFile(entries, options.format, options.style);
    
    // Upload to storage
    const fileUrl = await storage.uploadBuffer(
      Buffer.from(fileContent, 'utf-8'),
      `subtitles/${subtitleId}.${options.format}`,
      `text/${options.format}`
    );
    
    // Calculate metadata
    const totalDuration = Math.max(...entries.map(e => e.endTime));
    const wordCount = entries.reduce((sum, entry) => sum + entry.text.split(/\s+/).length, 0);
    const averageReadingSpeed = (wordCount / totalDuration) * 60;
    
    return {
      id: subtitleId,
      format: options.format,
      language: options.language,
      entries,
      fileUrl,
      metadata: {
        totalDuration,
        wordCount,
        averageReadingSpeed
      }
    };
  }

  private async generateSlideSubtitles(
    script: GeneratedScript,
    audio: GeneratedAudio,
    startTime: number,
    options: SubtitleOptions
  ): Promise<SubtitleEntry[]> {
    const entries: SubtitleEntry[] = [];
    const words = script.script.split(/\s+/);
    const wordsPerSecond = words.length / audio.duration;
    
    // Split script into subtitle chunks
    const chunks = this.splitTextIntoChunks(script.script, options.timing);
    
    let currentTime = startTime;
    
    for (const chunk of chunks) {
      const chunkWords = chunk.split(/\s+/).length;
      const chunkDuration = Math.max(
        options.timing.minDuration,
        Math.min(
          options.timing.maxDuration,
          chunkWords / wordsPerSecond
        )
      );
      
      entries.push({
        id: uuidv4(),
        startTime: currentTime,
        endTime: currentTime + chunkDuration,
        text: chunk.trim(),
        confidence: 0.9 // High confidence for script-based subtitles
      });
      
      currentTime += chunkDuration + options.timing.gapBetweenSubtitles;
    }
    
    return entries;
  }

  private splitTextIntoChunks(
    text: string,
    timing: SubtitleOptions['timing']
  ): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const chunks: string[] = [];
    
    for (const sentence of sentences) {
      const words = sentence.trim().split(/\s+/);
      
      if (words.length <= timing.maxCharsPerLine / 5) {
        chunks.push(sentence.trim());
      } else {
        // Split long sentences into smaller chunks
        let currentChunk = '';
        let currentWords = 0;
        
        for (const word of words) {
          if (currentWords >= timing.maxCharsPerLine / 5) {
            chunks.push(currentChunk.trim());
            currentChunk = word;
            currentWords = 1;
          } else {
            currentChunk += (currentChunk ? ' ' : '') + word;
            currentWords++;
          }
        }
        
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
        }
      }
    }
    
    return chunks;
  }

  private generateSubtitleFile(
    entries: SubtitleEntry[],
    format: string,
    style: SubtitleOptions['style']
  ): string {
    switch (format) {
      case 'srt':
        return this.generateSRTFile(entries, style);
      case 'vtt':
        return this.generateVTTFile(entries, style);
      case 'ass':
        return this.generateASSFile(entries, style);
      default:
        throw new Error(`Unsupported subtitle format: ${format}`);
    }
  }

  private generateSRTFile(entries: SubtitleEntry[], style: SubtitleOptions['style']): string {
    let content = '';
    
    entries.forEach((entry, index) => {
      const startTime = this.formatSRTTime(entry.startTime);
      const endTime = this.formatSRTTime(entry.endTime);
      
      content += `${index + 1}\n`;
      content += `${startTime} --> ${endTime}\n`;
      content += `${entry.text}\n\n`;
    });
    
    return content;
  }

  private generateVTTFile(entries: SubtitleEntry[], style: SubtitleOptions['style']): string {
    let content = 'WEBVTT\n\n';
    
    // Add style header
    content += 'STYLE\n';
    content += `::cue {\n`;
    content += `  font-family: ${style.fontFamily};\n`;
    content += `  font-size: ${style.fontSize}px;\n`;
    content += `  color: ${style.fontColor};\n`;
    if (style.backgroundColor) {
      content += `  background-color: ${style.backgroundColor};\n`;
    }
    content += `}\n\n`;
    
    entries.forEach(entry => {
      const startTime = this.formatVTTTime(entry.startTime);
      const endTime = this.formatVTTTime(entry.endTime);
      
      content += `${startTime} --> ${endTime}\n`;
      content += `${entry.text}\n\n`;
    });
    
    return content;
  }

  private generateASSFile(entries: SubtitleEntry[], style: SubtitleOptions['style']): string {
    let content = `[Script Info]\n`;
    content += `Title: Generated Subtitles\n`;
    content += `ScriptType: v4.00+\n`;
    content += `WrapStyle: 0\n`;
    content += `ScaledBorderAndShadow: yes\n`;
    content += `YCbCr Matrix: None\n\n`;
    
    content += `[V4+ Styles]\n`;
    content += `Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n`;
    content += `Style: Default,${style.fontFamily},${style.fontSize},${this.colorToASS(style.fontColor)},&H000000FF,${this.colorToASS(style.outlineColor || '#000000')},${this.colorToASS(style.backgroundColor || '#000000')},0,0,0,0,100,100,0,0,1,${style.outlineWidth || 0},0,${this.getAlignment(style.position, style.alignment)},0,0,0,1\n\n`;
    
    content += `[Events]\n`;
    content += `Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
    
    entries.forEach(entry => {
      const startTime = this.formatASSTime(entry.startTime);
      const endTime = this.formatASSTime(entry.endTime);
      
      content += `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${entry.text}\n`;
    });
    
    return content;
  }

  private formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }

  private formatVTTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  private formatASSTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const cs = Math.floor((seconds % 1) * 100);
    
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
  }

  private colorToASS(color: string): string {
    // Convert hex color to ASS format (BGR)
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    return `&H00${b.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${r.toString(16).padStart(2, '0')}`;
  }

  private getAlignment(position: string, alignment: string): number {
    // ASS alignment codes
    const alignments: Record<string, number> = {
      'bottom-center': 2,
      'bottom-left': 1,
      'bottom-right': 3,
      'center-center': 5,
      'center-left': 4,
      'center-right': 6,
      'top-center': 8,
      'top-left': 7,
      'top-right': 9
    };
    
    const key = `${position}-${alignment}` as string;
    return alignments[key] || 2;
  }

  async translateSubtitles(
    subtitles: GeneratedSubtitles,
    targetLanguage: string
  ): Promise<GeneratedSubtitles> {
    // This would integrate with a translation service
    // For now, return the original subtitles
    return {
      ...subtitles,
      id: uuidv4(),
      language: targetLanguage,
      fileUrl: subtitles.fileUrl // In reality, this would be a new file
    };
  }

  async burnSubtitlesToVideo(
    videoUrl: string,
    subtitles: GeneratedSubtitles,
    outputOptions: {
      resolution: string;
      position: string;
      style: SubtitleOptions['style'];
    }
  ): Promise<string> {
    // This would use FFmpeg to burn subtitles into the video
    // For now, return the original video URL
    return videoUrl;
  }

  async generateAccessibilityFeatures(
    subtitles: GeneratedSubtitles,
    scripts: GeneratedScript[]
  ): Promise<{
    audioDescription: string;
    transcript: string;
    chapters: Array<{ title: string; startTime: number; endTime: number }>;
  }> {
    // Generate audio description script
    const audioDescription = scripts.map(script => 
      `${script.title}: ${script.script.substring(0, 100)}...`
    ).join('\n\n');

    // Generate full transcript
    const transcript = subtitles.entries.map(entry => 
      `[${this.formatSRTTime(entry.startTime)}] ${entry.text}`
    ).join('\n');

    // Generate chapters
    const chapters = scripts.map((script, index) => {
      const entry = subtitles.entries.find(e => e.text.includes(script.title.substring(0, 20)));
      return {
        title: script.title,
        startTime: entry?.startTime || index * 60,
        endTime: entry?.endTime || (index + 1) * 60
      };
    });

    return {
      audioDescription,
      transcript,
      chapters
    };
  }

  async optimizeSubtitlesForPlatform(
    subtitles: GeneratedSubtitles,
    platform: 'youtube' | 'instagram' | 'tiktok' | 'linkedin'
  ): Promise<GeneratedSubtitles> {
    let optimizedOptions = { ...subtitles };

    switch (platform) {
      case 'youtube':
        // YouTube prefers SRT or VTT with standard formatting
        break;
      case 'instagram':
        // Instagram Reels need larger text and shorter duration
        optimizedOptions = await this.adjustForReels(subtitles);
        break;
      case 'tiktok':
        // TikTok needs very short, punchy subtitles
        optimizedOptions = await this.adjustForTikTok(subtitles);
        break;
      case 'linkedin':
        // LinkedIn prefers professional formatting
        break;
    }

    return optimizedOptions;
  }

  private async adjustForReels(subtitles: GeneratedSubtitles): Promise<GeneratedSubtitles> {
    // Adjust for Instagram Reels: larger text, shorter duration
    const adjustedEntries = subtitles.entries.map(entry => ({
      ...entry,
      endTime: Math.min(entry.endTime, entry.startTime + 3) // Max 3 seconds per subtitle
    }));

    return {
      ...subtitles,
      entries: adjustedEntries
    };
  }

  private async adjustForTikTok(subtitles: GeneratedSubtitles): Promise<GeneratedSubtitles> {
    // Adjust for TikTok: very short, punchy text
    const adjustedEntries = subtitles.entries.map(entry => {
      const words = entry.text.split(/\s+/);
      const shortText = words.slice(0, 8).join(' '); // Max 8 words
      
      return {
        ...entry,
        text: shortText,
        endTime: Math.min(entry.endTime, entry.startTime + 2) // Max 2 seconds per subtitle
      };
    });

    return {
      ...subtitles,
      entries: adjustedEntries
    };
  }
}

export const subtitleService = new SubtitleService();