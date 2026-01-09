import { GeneratedScript } from './script-generation.service';
import { GeneratedAudio } from './voice-intelligence.service';
import { SlideExtractionResult } from './document-ingestion.service';
import { storage } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface VideoRenderOptions {
  resolution: '720p' | '1080p' | '4k';
  aspectRatio: '16:9' | '9:16' | '1:1';
  frameRate: 24 | 30 | 60;
  quality: 'low' | 'medium' | 'high';
  backgroundMusic?: {
    url: string;
    volume: number; // 0.0 to 1.0
  };
  watermark?: {
    url: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    opacity: number; // 0.0 to 1.0
    scale: number; // 0.1 to 1.0
  };
  transitions: {
    type: 'fade' | 'slide' | 'zoom' | 'none';
    duration: number; // seconds
  };
}

export interface SceneConfig {
  slideId: string;
  slideData: SlideExtractionResult['slides'][0];
  script: GeneratedScript;
  audio: GeneratedAudio;
  duration: number;
  effects: {
    zoomEffect: boolean;
    panEffect: boolean;
    highlightBullets: boolean;
    animations: string[];
  };
}

export interface RenderedVideo {
  id: string;
  url: string;
  duration: number;
  fileSize: number;
  resolution: string;
  format: string;
  metadata: {
    title: string;
    description: string;
    tags: string[];
    language: string;
  };
  renderOptions: VideoRenderOptions;
}

export class VideoCompositionService {
  private resolutions = {
    '720p': { width: 1280, height: 720 },
    '1080p': { width: 1920, height: 1080 },
    '4k': { width: 3840, height: 2160 }
  };

  private aspectRatios = {
    '16:9': { width: 16, height: 9 },
    '9:16': { width: 9, height: 16 },
    '1:1': { width: 1, height: 1 }
  };

  async renderVideo(
    scenes: SceneConfig[],
    options: VideoRenderOptions,
    metadata: { title: string; description: string; language: string }
  ): Promise<RenderedVideo> {
    const renderId = uuidv4();
    const tempDir = `/tmp/video_render_${renderId}`;
    
    try {
      // Create temporary directory
      await fs.mkdir(tempDir, { recursive: true });
      
      // Process each scene
      const sceneVideos = [];
      for (let i = 0; i < scenes.length; i++) {
        const sceneVideo = await this.renderScene(scenes[i], options, tempDir, i);
        sceneVideos.push(sceneVideo);
      }
      
      // Combine scenes with transitions
      let finalVideo = await this.combineScenes(sceneVideos, options, tempDir);
      
      // Add background music if specified
      if (options.backgroundMusic) {
        const videoWithMusic = await this.addBackgroundMusic(finalVideo, options.backgroundMusic, tempDir);
        await fs.unlink(finalVideo);
        finalVideo = videoWithMusic;
      }
      
      // Add watermark if specified
      if (options.watermark) {
        const watermarkedVideo = await this.addWatermark(finalVideo, options.watermark, tempDir);
        await fs.unlink(finalVideo);
        finalVideo = watermarkedVideo;
      }
      
      // Upload final video
      const videoBuffer = await fs.readFile(finalVideo);
      const videoUrl = await storage.uploadBuffer(
        videoBuffer,
        `videos/${renderId}.mp4`,
        'video/mp4'
      );
      
      // Get video duration
      const duration = await this.getVideoDuration(finalVideo);
      
      // Clean up temporary directory
      await fs.rm(tempDir, { recursive: true, force: true });
      
      return {
        id: renderId,
        url: videoUrl,
        duration,
        fileSize: videoBuffer.length,
        resolution: options.resolution,
        format: 'mp4',
        metadata: {
          ...metadata,
          tags: this.generateTags(metadata, scenes)
        },
        renderOptions: options
      };
      
    } catch (error) {
      // Clean up on error
      await fs.rm(tempDir, { recursive: true, force: true });
      throw new Error(`Video rendering failed: ${error}`);
    }
  }

  private async renderScene(
    scene: SceneConfig,
    options: VideoRenderOptions,
    tempDir: string,
    sceneIndex: number
  ): Promise<string> {
    const { width, height } = this.resolutions[options.resolution];
    const sceneFile = path.join(tempDir, `scene_${sceneIndex}.mp4`);
    
    // Get slide image
    const slideImage = scene.slideData.images[0]?.url;
    if (!slideImage) {
      throw new Error(`No image found for slide ${scene.slideId}`);
    }
    
    // Download slide image to temp directory
    const slideImagePath = path.join(tempDir, `slide_${sceneIndex}.png`);
    const slideImageBuffer = await this.downloadImage(slideImage);
    await fs.writeFile(slideImagePath, slideImageBuffer);
    
    // Download audio
    const audioPath = path.join(tempDir, `audio_${sceneIndex}.mp3`);
    const audioBuffer = await this.downloadFile(scene.audio.audioUrl);
    await fs.writeFile(audioPath, audioBuffer);
    
    // Build FFmpeg command
    let ffmpegCommand = `ffmpeg -y -loop 1 -i "${slideImagePath}" -i "${audioPath}"`;
    
    // Add video filters for effects
    const filters = [];
    
    if (scene.effects.zoomEffect) {
      filters.push(`zoompan=z='if(lt(on,1),1,zoom+0.001)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${scene.duration * options.frameRate}`);
    }
    
    if (scene.effects.panEffect) {
      filters.push(`crop=${width}:${height}:'(${width}-iw)/2+sin(on/10)*10':'(${height}-ih)/2+sin(on/10)*10'`);
    }
    
    // Scale to target resolution
    filters.push(`scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`);
    
    // Combine filters
    if (filters.length > 0) {
      ffmpegCommand += ` -vf "${filters.join(',')}"`;
    }
    
    // Set duration based on audio
    ffmpegCommand += ` -t ${scene.duration} -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k -r ${options.frameRate} "${sceneFile}"`;
    
    await execAsync(ffmpegCommand);
    
    return sceneFile;
  }

  private async combineScenes(
    sceneVideos: string[],
    options: VideoRenderOptions,
    tempDir: string
  ): Promise<string> {
    const combinedFile = path.join(tempDir, 'combined.mp4');
    
    if (sceneVideos.length === 1) {
      return sceneVideos[0];
    }
    
    // Create file list for concatenation
    const fileList = path.join(tempDir, 'filelist.txt');
    const fileContent = sceneVideos.map(video => `file '${video}'`).join('\n');
    await fs.writeFile(fileList, fileContent);
    
    let ffmpegCommand = `ffmpeg -y -f concat -safe 0 -i "${fileList}"`;
    
    // Add transitions if specified
    if (options.transitions.type !== 'none' && sceneVideos.length > 1) {
      // For simplicity, we'll use crossfade for transitions
      ffmpegCommand += ` -filter_complex "[0:v][1:v]xfade=transition=fade:duration=${options.transitions.duration}:offset=0[vout]" -map "[vout]"`;
    }
    
    ffmpegCommand += ` -c:v libx264 -preset medium -crf 23 -c:a aac -b:a 128k "${combinedFile}"`;
    
    await execAsync(ffmpegCommand);
    
    // Clean up individual scene files
    for (const sceneVideo of sceneVideos) {
      await fs.unlink(sceneVideo);
    }
    
    return combinedFile;
  }

  private async addBackgroundMusic(
    videoFile: string,
    backgroundMusic: VideoRenderOptions['backgroundMusic'],
    tempDir: string
  ): Promise<string> {
    if (!backgroundMusic) return videoFile;
    
    const outputVideo = path.join(tempDir, 'video_with_music.mp4');
    
    // Download background music
    const musicPath = path.join(tempDir, 'background_music.mp3');
    const musicBuffer = await this.downloadFile(backgroundMusic.url);
    await fs.writeFile(musicPath, musicBuffer);
    
    // Mix audio with background music
    const ffmpegCommand = `ffmpeg -y -i "${videoFile}" -i "${musicPath}" -filter_complex "[0:a][1:a]amix=inputs=2:weights=1 ${backgroundMusic.volume}[aout]" -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 128k "${outputVideo}"`;
    
    await execAsync(ffmpegCommand);
    await fs.unlink(musicPath);
    
    return outputVideo;
  }

  private async addWatermark(
    videoFile: string,
    watermark: VideoRenderOptions['watermark'],
    tempDir: string
  ): Promise<string> {
    if (!watermark) return videoFile;
    
    const outputVideo = path.join(tempDir, 'watermarked_video.mp4');
    
    // Download watermark
    const watermarkPath = path.join(tempDir, 'watermark.png');
    const watermarkBuffer = await this.downloadImage(watermark.url);
    await fs.writeFile(watermarkPath, watermarkBuffer);
    
    // Calculate watermark position
    const position = this.getWatermarkPosition(watermark.position);
    const filter = `scale=iw*${watermark.scale}:ih*${watermark.scale},format=rgba,colorchannelmixer=aa=${watermark.opacity}[wm];[0:v][wm]overlay=${position}`;
    
    const ffmpegCommand = `ffmpeg -y -i "${videoFile}" -i "${watermarkPath}" -filter_complex "${filter}" -c:v libx264 -preset medium -crf 23 -c:a copy "${outputVideo}"`;
    
    await execAsync(ffmpegCommand);
    await fs.unlink(watermarkPath);
    
    return outputVideo;
  }

  private getWatermarkPosition(position: string): string {
    const positions: Record<string, string> = {
      'top-left': '10:10',
      'top-right': 'main_w-overlay_w-10:10',
      'bottom-left': '10:main_h-overlay_h-10',
      'bottom-right': 'main_w-overlay_w-10:main_h-overlay_h-10',
      'center': '(main_w-overlay_w)/2:(main_h-overlay_h)/2'
    };
    
    return positions[position] || positions['bottom-right'];
  }

  private async downloadImage(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  private async downloadFile(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  private async getVideoDuration(videoFile: string): Promise<number> {
    const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${videoFile}"`);
    return Math.round(parseFloat(stdout.trim()));
  }

  private generateTags(
    metadata: { title: string; description: string; language: string },
    scenes: SceneConfig[]
  ): string[] {
    const tags = new Set<string>();
    
    // Add language tag
    tags.add(metadata.language);
    
    // Add content-based tags from title and description
    const words = `${metadata.title} ${metadata.description}`.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (word.length > 3) {
        tags.add(word);
      }
    });
    
    // Add educational tags
    tags.add('educational');
    tags.add('video');
    tags.add('learning');
    
    // Add slide count tag
    tags.add(`${scenes.length} slides`);
    
    return Array.from(tags).slice(0, 10); // Limit to 10 tags
  }

  async createVideoPreview(
    scenes: SceneConfig[],
    options: VideoRenderOptions,
    previewDuration: number = 30
  ): Promise<string> {
    // Create a short preview with the first few scenes
    const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0);
    const scenesToInclude = Math.ceil((previewDuration / totalDuration) * scenes.length);
    const previewScenes = scenes.slice(0, Math.max(1, scenesToInclude));
    
    const tempDir = `/tmp/video_preview_${uuidv4()}`;
    await fs.mkdir(tempDir, { recursive: true });
    
    try {
      const previewVideo = await this.renderScene(
        previewScenes[0],
        { ...options, resolution: '720p' }, // Lower resolution for preview
        tempDir,
        0
      );
      
      // Trim to preview duration
      const trimmedPreview = path.join(tempDir, 'preview.mp4');
      await execAsync(`ffmpeg -y -i "${previewVideo}" -t ${previewDuration} -c copy "${trimmedPreview}"`);
      
      const previewBuffer = await fs.readFile(trimmedPreview);
      const previewUrl = await storage.uploadBuffer(
        previewBuffer,
        `previews/${uuidv4()}.mp4`,
        'video/mp4'
      );
      
      await fs.rm(tempDir, { recursive: true, force: true });
      
      return previewUrl;
    } catch (error) {
      await fs.rm(tempDir, { recursive: true, force: true });
      throw error;
    }
  }

  async estimateRenderTime(
    scenes: SceneConfig[],
    options: VideoRenderOptions
  ): Promise<number> {
    // Estimate render time based on scene count and resolution
    const baseTimePerScene = 30; // seconds
    const resolutionMultiplier = {
      '720p': 1,
      '1080p': 1.5,
      '4k': 3
    };
    
    const qualityMultiplier = {
      'low': 0.5,
      'medium': 1,
      'high': 2
    };
    
    return scenes.length * baseTimePerScene * 
           resolutionMultiplier[options.resolution] * 
           qualityMultiplier[options.quality];
  }
}

export const videoCompositionService = new VideoCompositionService();