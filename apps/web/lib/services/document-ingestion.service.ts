import { prisma } from '@/lib/db';
import { storage } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface SlideExtractionResult {
  slides: Array<{
    id: string;
    pageNumber: number;
    title: string;
    content: string;
    notes: string;
    images: Array<{
      url: string;
      alt: string;
      position: { x: number; y: number; width: number; height: number };
    }>;
    charts: Array<{
      type: string;
      data: any;
      position: { x: number; y: number; width: number; height: number };
    }>;
  }>;
  metadata: {
    title: string;
    author: string;
    language: string;
    slideCount: number;
    estimatedDuration: number;
  };
}

export class DocumentIngestionService {
  async processDocument(file: File, userId: string): Promise<SlideExtractionResult> {
    const fileExtension = path.extname(file.name).toLowerCase();
    const tempDir = `/tmp/processing/${uuidv4()}`;
    
    try {
      // Create temp directory
      await fs.mkdir(tempDir, { recursive: true });
      
      // Save uploaded file
      const filePath = path.join(tempDir, file.name);
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);
      
      // Process based on file type
      let result: SlideExtractionResult;
      
      switch (fileExtension) {
        case '.pptx':
        case '.ppt':
          result = await this.processPowerPoint(filePath);
          break;
        case '.pdf':
          result = await this.processPDF(filePath);
          break;
        case '.docx':
        case '.doc':
          result = await this.processWordDocument(filePath);
          break;
        case '.txt':
          result = await this.processTextFile(filePath);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileExtension}`);
      }
      
      // Upload extracted images to storage
      for (const slide of result.slides) {
        for (const image of slide.images) {
          if (image.url.startsWith('/tmp/')) {
            const imageBuffer = await fs.readFile(image.url);
            const storageUrl = await storage.uploadFile(
              imageBuffer,
              `slides/${userId}/${uuidv4()}.png`,
              'image/png'
            );
            image.url = storageUrl;
          }
        }
      }
      
      // Clean up temp directory
      await fs.rm(tempDir, { recursive: true, force: true });
      
      return result;
      
    } catch (error) {
      // Clean up on error
      await fs.rm(tempDir, { recursive: true, force: true });
      throw error;
    }
  }
  
  private async processPowerPoint(filePath: string): Promise<SlideExtractionResult> {
    // Use LibreOffice to convert PPT to images and extract text
    const outputDir = path.join(path.dirname(filePath), 'slides');
    await fs.mkdir(outputDir, { recursive: true });
    
    // Convert to images
    await execAsync(`libreoffice --headless --convert-to png --outdir "${outputDir}" "${filePath}"`);
    
    // Extract text using python-pptx (if available) or OCR
    const { stdout } = await execAsync(`python3 -c "
import sys
import json
from pptx import Presentation
from pptx.enum.shapes import MSO_SHAPE_TYPE

prs = Presentation('${filePath}')
slides_data = []

for i, slide in enumerate(prs.slides):
    slide_data = {
        'id': f'slide_{i+1}',
        'pageNumber': i + 1,
        'title': '',
        'content': '',
        'notes': '',
        'images': [],
        'charts': []
    }
    
    # Extract text from shapes
    for shape in slide.shapes:
        if hasattr(shape, 'text'):
            text = shape.text.strip()
            if text and not slide_data['title']:
                slide_data['title'] = text[:100]
            elif text:
                slide_data['content'] += text + '\\n'
        elif shape.shape_type == MSO_SHAPE_TYPE.PICTURE:
            slide_data['images'].append({
                'url': f'{outputDir}/slide_{i+1}.png',
                'alt': 'Slide image',
                'position': {'x': 0, 'y': 0, 'width': 1920, 'height': 1080}
            })
    
    # Extract notes
    if slide.has_notes_slide and slide.notes_slide.notes_text_frame:
        slide_data['notes'] = slide.notes_slide.notes_text_frame.text
    
    slides_data.append(slide_data)

print(json.dumps({
    'slides': slides_data,
    'metadata': {
        'title': prs.core_properties.title or 'Untitled Presentation',
        'author': prs.core_properties.author or 'Unknown',
        'language': 'en',
        'slideCount': len(prs.slides),
        'estimatedDuration': len(prs.slides) * 60
    }
}))
"`);
    
    return JSON.parse(stdout);
  }
  
  private async processPDF(filePath: string): Promise<SlideExtractionResult> {
    // Use pdf-poppler or similar to extract pages and text
    const outputDir = path.join(path.dirname(filePath), 'pdf_pages');
    await fs.mkdir(outputDir, { recursive: true });
    
    // Convert PDF to images
    await execAsync(`pdftoppm -png "${filePath}" "${outputDir}/page"`);
    
    // Extract text
    const { stdout } = await execAsync(`python3 -c "
import sys
import json
import PyPDF2

with open('${filePath}', 'rb') as file:
    reader = PyPDF2.PdfReader(file)
    slides_data = []
    
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        lines = text.split('\\n')
        
        slide_data = {
            'id': f'slide_{i+1}',
            'pageNumber': i + 1,
            'title': lines[0] if lines else 'Untitled Slide',
            'content': '\\n'.join(lines[1:]) if len(lines) > 1 else '',
            'notes': '',
            'images': [{
                'url': f'{outputDir}/page-{i+1}.png',
                'alt': 'PDF page',
                'position': {'x': 0, 'y': 0, 'width': 1920, 'height': 1080}
            }],
            'charts': []
        }
        
        slides_data.append(slide_data)
    
    print(json.dumps({
        'slides': slides_data,
        'metadata': {
            'title': reader.metadata.title if reader.metadata else 'Untitled PDF',
            'author': reader.metadata.author if reader.metadata else 'Unknown',
            'language': 'en',
            'slideCount': len(reader.pages),
            'estimatedDuration': len(reader.pages) * 60
        }
    }))
"`);
    
    return JSON.parse(stdout);
  }
  
  private async processWordDocument(filePath: string): Promise<SlideExtractionResult> {
    const { stdout } = await execAsync(`python3 -c "
import sys
import json
from docx import Document

doc = Document('${filePath}')
paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]

# Split content into logical slides
slides_data = []
current_slide = {
    'id': 'slide_1',
    'pageNumber': 1,
    'title': '',
    'content': '',
    'notes': '',
    'images': [],
    'charts': []
}

for i, para in enumerate(paragraphs):
    if not current_slide['title']:
        current_slide['title'] = para[:100]
    elif len(current_slide['content']) < 500:
        current_slide['content'] += para + '\\n'
    else:
        slides_data.append(current_slide)
        current_slide = {
            'id': f'slide_{len(slides_data) + 2}',
            'pageNumber': len(slides_data) + 2,
            'title': para[:100],
            'content': '',
            'notes': '',
            'images': [],
            'charts': []
        }

if current_slide['title']:
    slides_data.append(current_slide)

print(json.dumps({
    'slides': slides_data,
    'metadata': {
        'title': doc.core_properties.title or 'Untitled Document',
        'author': doc.core_properties.author or 'Unknown',
        'language': 'en',
        'slideCount': len(slides_data),
        'estimatedDuration': len(slides_data) * 60
    }
}))
"`);
    
    return JSON.parse(stdout);
  }
  
  private async processTextFile(filePath: string): Promise<SlideExtractionResult> {
    const content = await fs.readFile(filePath, 'utf-8');
    const paragraphs = content.split('\n\n').filter(p => p.trim());
    
    const slides_data = [];
    let currentSlide = {
      id: 'slide_1',
      pageNumber: 1,
      title: '',
      content: '',
      notes: '',
      images: [],
      charts: []
    };
    
    for (const para of paragraphs) {
      if (!currentSlide.title) {
        currentSlide.title = para.substring(0, 100);
      } else if (currentSlide.content.length < 500) {
        currentSlide.content += para + '\n\n';
      } else {
        slides_data.push(currentSlide);
        currentSlide = {
          id: `slide_${slides_data.length + 2}`,
          pageNumber: slides_data.length + 2,
          title: para.substring(0, 100),
          content: '',
          notes: '',
          images: [],
          charts: []
        };
      }
    }
    
    if (currentSlide.title) {
      slides_data.push(currentSlide);
    }
    
    return {
      slides: slides_data,
      metadata: {
        title: 'Text Document',
        author: 'Unknown',
        language: 'en',
        slideCount: slides_data.length,
        estimatedDuration: slides_data.length * 60
      }
    };
  }
  
  async detectLanguage(text: string): Promise<string> {
    // Simple language detection
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
  
  async validateFile(file: File): Promise<{ valid: boolean; error?: string }> {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];
    
    const maxSize = 100 * 1024 * 1024; // 100MB
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Unsupported file type' };
    }
    
    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 100MB limit' };
    }
    
    return { valid: true };
  }
}

export const documentIngestionService = new DocumentIngestionService();