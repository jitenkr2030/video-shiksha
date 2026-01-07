import ffmpeg from 'fluent-ffmpeg'
import { PassThrough } from 'stream'

export class FFmpegService {
  async renderVideo(
    slides: Array<{
      title: string
      content: string
      audioUrl: string
      imageUrl?: string
      duration: number
      transitionDuration: number
    }>,
    options: {
      resolution: string
      format: string
      quality: string
    }
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        // This is a simplified implementation
        // In a real app, you would create a complex video with slides, transitions, and audio
        
        const outputStream = new PassThrough()
        const chunks: Buffer[] = []

        outputStream.on('data', (chunk) => {
          chunks.push(chunk)
        })

        outputStream.on('end', () => {
          const videoBuffer = Buffer.concat(chunks)
          resolve(videoBuffer)
        })

        outputStream.on('error', reject)

        // Create a simple video for demonstration
        ffmpeg()
          .input('color=c=blue:size=1920x1080:duration=1')
          .inputFormat('lavfi')
          .outputOptions([
            '-c:v libx264',
            '-preset medium',
            '-crf 23',
            '-c:a aac',
            '-b:a 128k',
            '-shortest'
          ])
          .format('mp4')
          .pipe(outputStream, { end: true })

      } catch (error) {
        reject(error)
      }
    })
  }

  async generateThumbnail(videoBuffer: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const outputStream = new PassThrough()
        const chunks: Buffer[] = []

        outputStream.on('data', (chunk) => {
          chunks.push(chunk)
        })

        outputStream.on('end', () => {
          const thumbnailBuffer = Buffer.concat(chunks)
          resolve(thumbnailBuffer)
        })

        outputStream.on('error', reject)

        // Generate thumbnail from video
        ffmpeg()
          .input(videoBuffer)
          .seekInput('00:00:01')
          .frames(1)
          .format('image2')
          .pipe(outputStream, { end: true })

      } catch (error) {
        reject(error)
      }
    })
  }

  async generateSubtitles(
    subtitleData: Array<{
      index: number
      startTime: number
      endTime: number
      text: string
      slideId: string
    }>
  ): Promise<Buffer> {
    // Generate SRT format subtitles
    let srtContent = ''
    
    subtitleData.forEach(subtitle => {
      const startTime = this.formatTime(subtitle.startTime)
      const endTime = this.formatTime(subtitle.endTime)
      
      srtContent += `${subtitle.index}\n`
      srtContent += `${startTime} --> ${endTime}\n`
      srtContent += `${subtitle.text}\n\n`
    })

    return Buffer.from(srtContent, 'utf-8')
  }

  async getVideoDuration(videoBuffer: Buffer): Promise<number> {
    return new Promise((resolve, reject) => {
      try {
        ffmpeg.ffprobe(videoBuffer, (err, metadata) => {
          if (err) {
            reject(err)
          } else {
            const duration = metadata.format.duration || 0
            resolve(Math.round(duration))
          }
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  async mergeAudioVideo(
    videoBuffer: Buffer,
    audioBuffers: Buffer[],
    slideDurations: number[]
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const outputStream = new PassThrough()
        const chunks: Buffer[] = []

        outputStream.on('data', (chunk) => {
          chunks.push(chunk)
        })

        outputStream.on('end', () => {
          const mergedBuffer = Buffer.concat(chunks)
          resolve(mergedBuffer)
        })

        outputStream.on('error', reject)

        // Create ffmpeg command to merge video with multiple audio tracks
        const command = ffmpeg()
          .input(videoBuffer)

        // Add audio inputs
        audioBuffers.forEach((audioBuffer, index) => {
          command.input(audioBuffer)
        })

        // Map streams and create filter complex for timing
        const filterInputs = ['0:v'] // video stream
        const filterOutputs: string[] = []
        
        // Create audio filters for each slide
        audioBuffers.forEach((_, index) => {
          const startTime = slideDurations.slice(0, index).reduce((a, b) => a + b, 0)
          filterInputs.push(`${index + 1}:a`)
          filterOutputs.push(`[${index + 1}:a]adelay=${startTime * 1000}|${startTime * 1000}[a${index}]`)
        })

        // Concatenate all audio
        filterOutputs.push(`[a0][a1]concat=n=${audioBuffers.length}:v=0:a=1[outaudio]`)

        command
          .complexFilter(filterOutputs.join(';'))
          .outputOptions([
            '-map 0:v',
            '-map [outaudio]',
            '-c:v libx264',
            '-c:a aac',
            '-shortest'
          ])
          .format('mp4')
          .pipe(outputStream, { end: true })

      } catch (error) {
        reject(error)
      }
    })
  }

  async addTextOverlay(
    videoBuffer: Buffer,
    text: string,
    options: {
      fontSize?: number
      color?: string
      position?: 'top' | 'center' | 'bottom'
      duration?: number
    } = {}
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const outputStream = new PassThrough()
        const chunks: Buffer[] = []

        outputStream.on('data', (chunk) => {
          chunks.push(chunk)
        })

        outputStream.on('end', () => {
          const resultBuffer = Buffer.concat(chunks)
          resolve(resultBuffer)
        })

        outputStream.on('error', reject)

        const {
          fontSize = 48,
          color = 'white',
          position = 'bottom',
          duration = 5
        } = options

        const positionMap = {
          top: 'h-30',
          center: 'h/2',
          bottom: 'h-30'
        }

        const textFilter = `drawtext=text='${text}':fontsize=${fontSize}:fontcolor=${color}:x=(w-text_w)/2:y=${positionMap[position]}:enable='between(t,0,${duration})'`

        ffmpeg()
          .input(videoBuffer)
          .videoFilters(textFilter)
          .format('mp4')
          .pipe(outputStream, { end: true })

      } catch (error) {
        reject(error)
      }
    })
  }

  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`
  }

  async createTransition(
    fromBuffer: Buffer,
    toBuffer: Buffer,
    duration: number = 1.0,
    type: 'fade' | 'slide' | 'dissolve' = 'fade'
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const outputStream = new PassThrough()
        const chunks: Buffer[] = []

        outputStream.on('data', (chunk) => {
          chunks.push(chunk)
        })

        outputStream.on('end', () => {
          const transitionBuffer = Buffer.concat(chunks)
          resolve(transitionBuffer)
        })

        outputStream.on('error', reject)

        let filter = ''
        
        switch (type) {
          case 'fade':
            filter = `[0:v][1:v]xfade=transition=fade:duration=${duration}:offset=0[v]`
            break
          case 'slide':
            filter = `[0:v][1:v]xfade=transition=slideleft:duration=${duration}:offset=0[v]`
            break
          case 'dissolve':
            filter = `[0:v][1:v]xfade=transition=dissolve:duration=${duration}:offset=0[v]`
            break
        }

        ffmpeg()
          .input(fromBuffer)
          .input(toBuffer)
          .complexFilter(filter)
          .outputOptions(['-map [v]', '-c:v libx264'])
          .format('mp4')
          .pipe(outputStream, { end: true })

      } catch (error) {
        reject(error)
      }
    })
  }
}

export const ffmpegService = new FFmpegService()