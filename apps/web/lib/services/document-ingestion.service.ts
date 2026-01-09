// Document ingestion service - Mock implementation for landing page deployment
// Database functionality is disabled for landing page deployment

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

// Mock document ingestion service for landing page
export class DocumentIngestionService {
  async validateFile(file: File): Promise<{ valid: boolean; error?: string }> {
    // Mock file validation
    const allowedTypes = ['application/pdf', 'application/vnd.ms-powerpoint', 
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!file.type && !file.name.match(/\.(pdf|ppt|pptx)$/i)) {
      return { valid: false, error: 'Invalid file type. Please upload a PDF or PowerPoint file.' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 50MB limit.' };
    }

    return { valid: true };
  }

  async processDocument(file: File, userId: string): Promise<SlideExtractionResult> {
    return {
      slides: [],
      metadata: {
        title: file.name || 'Document',
        author: 'Unknown',
        language: 'en',
        slideCount: 0,
        estimatedDuration: 0
      }
    };
  }
}

export const documentIngestionService = new DocumentIngestionService();
