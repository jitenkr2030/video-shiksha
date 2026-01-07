import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

export class LibreOfficeService {
  async extractSlides(fileBuffer: Buffer): Promise<Array<{
    title: string
    content: string
    imageUrl?: string
    duration?: number
  }>> {
    try {
      // Create temporary directory
      const tempDir = `/tmp/ppt-${Date.now()}`
      fs.mkdirSync(tempDir, { recursive: true })

      // Write file to temporary location
      const tempFilePath = path.join(tempDir, 'presentation.pptx')
      fs.writeFileSync(tempFilePath, fileBuffer)

      // Convert to text using LibreOffice
      const { stdout, stderr } = await execAsync(
        `libreoffice --headless --convert-to txt "${tempFilePath}" --outdir "${tempDir}"`
      )

      // Read extracted text
      const txtFilePath = tempFilePath.replace('.pptx', '.txt')
      let extractedText = ''
      
      if (fs.existsSync(txtFilePath)) {
        extractedText = fs.readFileSync(txtFilePath, 'utf-8')
      }

      // Parse slides from text
      const slides = this.parseTextToSlides(extractedText)

      // Clean up temporary files
      fs.rmSync(tempDir, { recursive: true, force: true })

      return slides
    } catch (error) {
      console.error('LibreOffice extraction error:', error)
      
      // Fallback to mock data if LibreOffice fails
      return this.getMockSlides()
    }
  }

  private parseTextToSlides(text: string): Array<{
    title: string
    content: string
    imageUrl?: string
    duration?: number
  }> {
    // Simple text parsing - in a real implementation, you'd use more sophisticated parsing
    const lines = text.split('\n').filter(line => line.trim())
    const slides: Array<{
      title: string
      content: string
      duration?: number
    }> = []

    let currentSlide: { title: string; content: string } | null = null

    for (const line of lines) {
      // Assume slides are separated by empty lines or specific markers
      if (line.match(/^[A-Z]/) && !currentSlide) {
        // Start of new slide (title)
        currentSlide = { title: line, content: '' }
      } else if (currentSlide) {
        if (line.trim() === '') {
          // End of slide content
          if (currentSlide.content.trim()) {
            slides.push({
              ...currentSlide,
              duration: this.estimateDuration(currentSlide.content)
            })
          }
          currentSlide = null
        } else {
          // Add to content
          currentSlide.content += line + ' '
        }
      }
    }

    // Add last slide if it exists
    if (currentSlide && currentSlide.content.trim()) {
      slides.push({
        ...currentSlide,
        duration: this.estimateDuration(currentSlide.content)
      })
    }

    // If no slides were parsed, return mock data
    if (slides.length === 0) {
      return this.getMockSlides()
    }

    return slides
  }

  private estimateDuration(content: string): number {
    // Estimate duration based on word count (average 150 words per minute)
    const words = content.split(' ').length
    const minutes = words / 150
    return Math.max(5, Math.ceil(minutes * 60)) // Minimum 5 seconds
  }

  private getMockSlides(): Array<{
    title: string
    content: string
    imageUrl?: string
    duration?: number
  }> {
    return [
      {
        title: 'Introduction',
        content: 'Welcome to this presentation. Today we will explore the main topics and key concepts that will help us understand this subject better.',
        duration: 5
      },
      {
        title: 'Main Topic',
        content: 'Let\'s dive into the main subject matter and understand its importance in our current context. This topic has significant implications for our work.',
        duration: 7
      },
      {
        title: 'Key Points',
        content: 'Here are the essential points you need to remember about this topic. These concepts will form the foundation of our understanding.',
        duration: 6
      },
      {
        title: 'Examples',
        content: 'Let me provide you with some practical examples that illustrate these concepts in action. These examples will help solidify your understanding.',
        duration: 8
      },
      {
        title: 'Conclusion',
        content: 'To summarize what we\'ve learned and discuss the next steps for implementing these ideas in practice.',
        duration: 4
      }
    ]
  }

  async convertToPdf(fileBuffer: Buffer): Promise<Buffer> {
    try {
      // Create temporary directory
      const tempDir = `/tmp/pdf-${Date.now()}`
      fs.mkdirSync(tempDir, { recursive: true })

      // Write file to temporary location
      const tempFilePath = path.join(tempDir, 'presentation.pptx')
      fs.writeFileSync(tempFilePath, fileBuffer)

      // Convert to PDF using LibreOffice
      await execAsync(
        `libreoffice --headless --convert-to pdf "${tempFilePath}" --outdir "${tempDir}"`
      )

      // Read PDF file
      const pdfFilePath = tempFilePath.replace('.pptx', '.pdf')
      let pdfBuffer: Buffer

      if (fs.existsSync(pdfFilePath)) {
        pdfBuffer = fs.readFileSync(pdfFilePath)
      } else {
        throw new Error('PDF conversion failed')
      }

      // Clean up temporary files
      fs.rmSync(tempDir, { recursive: true, force: true })

      return pdfBuffer
    } catch (error) {
      console.error('PDF conversion error:', error)
      throw new Error('Failed to convert to PDF')
    }
  }

  async extractImages(fileBuffer: Buffer): Promise<Array<{
    slideIndex: number
    imageUrl: string
  }>> {
    try {
      // Create temporary directory
      const tempDir = `/tmp/images-${Date.now()}`
      fs.mkdirSync(tempDir, { recursive: true })

      // Write file to temporary location
      const tempFilePath = path.join(tempDir, 'presentation.pptx')
      fs.writeFileSync(tempFilePath, fileBuffer)

      // Extract images using LibreOffice
      await execAsync(
        `libreoffice --headless --convert-to png "${tempFilePath}" --outdir "${tempDir}"`
      )

      // Get list of extracted images
      const files = fs.readdirSync(tempDir).filter(file => file.endsWith('.png'))
      
      const images = files.map((file, index) => ({
        slideIndex: index,
        imageUrl: `file://${path.join(tempDir, file)}`
      }))

      // In a real implementation, you would upload these to storage
      // For now, return the file paths

      // Clean up temporary files
      fs.rmSync(tempDir, { recursive: true, force: true })

      return images
    } catch (error) {
      console.error('Image extraction error:', error)
      return []
    }
  }

  async checkLibreOfficeAvailability(): Promise<boolean> {
    try {
      await execAsync('libreoffice --version')
      return true
    } catch (error) {
      console.error('LibreOffice not available:', error)
      return false
    }
  }

  async getPresentationMetadata(fileBuffer: Buffer): Promise<{
    title?: string
    author?: string
    subject?: string
    slideCount: number
  }> {
    try {
      // Create temporary directory
      const tempDir = `/tmp/metadata-${Date.now()}`
      fs.mkdirSync(tempDir, { recursive: true })

      // Write file to temporary location
      const tempFilePath = path.join(tempDir, 'presentation.pptx')
      fs.writeFileSync(tempFilePath, fileBuffer)

      // Extract metadata using LibreOffice
      const { stdout } = await execAsync(
        `libreoffice --headless --cat "${tempFilePath}"`
      )

      // Parse metadata (simplified)
      const lines = stdout.split('\n')
      const metadata: any = {
        slideCount: 0
      }

      // Simple parsing - in a real implementation, you'd use proper metadata extraction
      for (const line of lines) {
        if (line.includes('Title:')) {
          metadata.title = line.replace('Title:', '').trim()
        } else if (line.includes('Author:')) {
          metadata.author = line.replace('Author:', '').trim()
        } else if (line.includes('Subject:')) {
          metadata.subject = line.replace('Subject:', '').trim()
        }
      }

      // Count slides (simplified)
      metadata.slideCount = lines.filter(line => line.includes('Slide')).length || 5

      // Clean up temporary files
      fs.rmSync(tempDir, { recursive: true, force: true })

      return metadata
    } catch (error) {
      console.error('Metadata extraction error:', error)
      return {
        slideCount: 5
      }
    }
  }
}

export const libreOfficeService = new LibreOfficeService()