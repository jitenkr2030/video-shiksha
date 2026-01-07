import { prisma } from '@/lib/db';
import { storage } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';
import { GeneratedScript } from './script-generation.service';
import { GeneratedAudio } from './voice-intelligence.service';
import { RenderedVideo } from './video-composition.service';
import { GeneratedSubtitles } from './subtitle.service';

export interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  thumbnailUrl?: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  tags: string[];
  price: number;
  currency: string;
  estimatedDuration: number;
  lessonCount: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  videoUrl: string;
  duration: number;
  thumbnailUrl?: string;
  resources: Array<{
    id: string;
    name: string;
    url: string;
    type: 'pdf' | 'document' | 'link' | 'image';
  }>;
  isPreview: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  userId: string;
  videos: Array<{
    id: string;
    title: string;
    duration: number;
    thumbnailUrl: string;
    order: number;
  }>;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandingSettings {
  id: string;
  userId: string;
  logoUrl?: string;
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  introVideo?: {
    url: string;
    duration: number;
  };
  outroVideo?: {
    url: string;
    duration: number;
  };
  watermark: {
    enabled: boolean;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    opacity: number;
    scale: number;
  };
  customTemplates: Array<{
    id: string;
    name: string;
    thumbnailUrl: string;
    settings: any;
  }>;
}

export class EducatorToolsService {
  async createCourse(
    instructorId: string,
    courseData: Omit<Course, 'id' | 'instructorId' | 'lessonCount' | 'createdAt' | 'updatedAt'>
  ): Promise<Course> {
    const course = await prisma.course.create({
      data: {
        ...courseData,
        instructorId,
        lessonCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return course;
  }

  async addLessonToCourse(
    courseId: string,
    lessonData: Omit<Lesson, 'id' | 'courseId' | 'order' | 'createdAt' | 'updatedAt'>
  ): Promise<Lesson> {
    // Get the current highest order number
    const lastLesson = await prisma.lesson.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' }
    });

    const order = (lastLesson?.order || 0) + 1;

    const lesson = await prisma.lesson.create({
      data: {
        ...lessonData,
        courseId,
        order,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Update course lesson count
    await prisma.course.update({
      where: { id: courseId },
      data: {
        lessonCount: {
          increment: 1
        },
        updatedAt: new Date()
      }
    });

    return lesson;
  }

  async createPlaylist(
    userId: string,
    playlistData: Omit<Playlist, 'id' | 'userId' | 'videos' | 'createdAt' | 'updatedAt'>
  ): Promise<Playlist> {
    const playlist = await prisma.playlist.create({
      data: {
        ...playlistData,
        userId,
        videos: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return playlist;
  }

  async addVideoToPlaylist(
    playlistId: string,
    videoData: {
      id: string;
      title: string;
      duration: number;
      thumbnailUrl: string;
    }
  ): Promise<Playlist> {
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId }
    });

    if (!playlist) {
      throw new Error('Playlist not found');
    }

    const videos = [...playlist.videos, { ...videoData, order: playlist.videos.length + 1 }];

    const updatedPlaylist = await prisma.playlist.update({
      where: { id: playlistId },
      data: {
        videos,
        updatedAt: new Date()
      }
    });

    return updatedPlaylist;
  }

  async reorderPlaylistVideos(
    playlistId: string,
    videoOrders: Array<{ id: string; order: number }>
  ): Promise<Playlist> {
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId }
    });

    if (!playlist) {
      throw new Error('Playlist not found');
    }

    const videos = playlist.videos.map(video => {
      const orderData = videoOrders.find(vo => vo.id === video.id);
      return orderData ? { ...video, order: orderData.order } : video;
    });

    const updatedPlaylist = await prisma.playlist.update({
      where: { id: playlistId },
      data: {
        videos: videos.sort((a, b) => a.order - b.order),
        updatedAt: new Date()
      }
    });

    return updatedPlaylist;
  }

  async saveBrandingSettings(
    userId: string,
    settings: Omit<BrandingSettings, 'id' | 'userId'>
  ): Promise<BrandingSettings> {
    const existingSettings = await prisma.brandingSettings.findUnique({
      where: { userId }
    });

    if (existingSettings) {
      const updatedSettings = await prisma.brandingSettings.update({
        where: { userId },
        data: settings
      });

      return updatedSettings;
    } else {
      const newSettings = await prisma.brandingSettings.create({
        data: {
          ...settings,
          userId
        }
      });

      return newSettings;
    }
  }

  async getBrandingSettings(userId: string): Promise<BrandingSettings | null> {
    return await prisma.brandingSettings.findUnique({
      where: { userId }
    });
  }

  async uploadBrandingAsset(
    userId: string,
    file: File,
    assetType: 'logo' | 'intro' | 'outro' | 'template'
  ): Promise<string> {
    const assetId = uuidv4();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${assetType}_${assetId}.${fileExtension}`;
    
    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || 'application/octet-stream';
    
    const url = await storage.uploadFile(
      buffer,
      `branding/${userId}/${fileName}`,
      mimeType
    );

    return url;
  }

  async applyBrandingToVideo(
    videoUrl: string,
    brandingSettings: BrandingSettings,
    userId: string
  ): Promise<string> {
    // This would integrate with the video composition service
    // to apply branding elements to the video
    // For now, return the original URL
    return videoUrl;
  }

  async generateCourseCertificate(
    courseId: string,
    studentId: string,
    completionDate: Date
  ): Promise<string> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: { name: true, email: true }
        }
      }
    });

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { name: true, email: true }
    });

    if (!course || !student) {
      throw new Error('Course or student not found');
    }

    // Generate certificate PDF
    const certificateData = {
      courseName: course.title,
      studentName: student.name,
      instructorName: course.instructor.name,
      completionDate: completionDate.toISOString().split('T')[0],
      duration: course.estimatedDuration,
      certificateId: uuidv4()
    };

    // This would use a PDF generation service
    // For now, return a placeholder URL
    return `certificates/${courseId}_${studentId}_${certificateData.certificateId}.pdf`;
  }

  async createCourseAssessment(
    courseId: string,
    assessmentData: {
      title: string;
      description: string;
      questions: Array<{
        id: string;
        type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
        question: string;
        options?: string[];
        correctAnswer: string | string[];
        points: number;
      }>;
      timeLimit?: number; // minutes
      passingScore: number; // percentage
      attemptsAllowed: number;
    }
  ): Promise<any> {
    const assessment = await prisma.assessment.create({
      data: {
        ...assessmentData,
        courseId,
        createdAt: new Date()
      }
    });

    return assessment;
  }

  async submitAssessment(
    assessmentId: string,
    studentId: string,
    answers: Array<{
      questionId: string;
      answer: string | string[];
    }>
  ): Promise<{
    score: number;
    passed: boolean;
    feedback: string;
    correctAnswers: number;
    totalQuestions: number;
  }> {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId }
    });

    if (!assessment) {
      throw new Error('Assessment not found');
    }

    let correctAnswers = 0;
    const totalQuestions = assessment.questions.length;

    for (const question of assessment.questions) {
      const studentAnswer = answers.find(a => a.questionId === question.id);
      if (!studentAnswer) continue;

      const isCorrect = this.checkAnswer(question, studentAnswer.answer);
      if (isCorrect) correctAnswers++;
    }

    const score = (correctAnswers / totalQuestions) * 100;
    const passed = score >= assessment.passingScore;

    // Save submission
    await prisma.assessmentSubmission.create({
      data: {
        assessmentId,
        studentId,
        answers,
        score,
        passed,
        submittedAt: new Date()
      }
    });

    return {
      score,
      passed,
      feedback: this.generateFeedback(score, assessment.passingScore),
      correctAnswers,
      totalQuestions
    };
  }

  private checkAnswer(question: any, studentAnswer: string | string[]): boolean {
    if (question.type === 'multiple-choice') {
      return studentAnswer === question.correctAnswer;
    } else if (question.type === 'true-false') {
      return studentAnswer === question.correctAnswer;
    } else if (question.type === 'short-answer') {
      // Simple string matching for short answers
      return studentAnswer.toString().toLowerCase().trim() === 
             question.correctAnswer.toString().toLowerCase().trim();
    }
    
    return false;
  }

  private generateFeedback(score: number, passingScore: number): string {
    if (score >= passingScore) {
      return `Congratulations! You passed with a score of ${score}%.`;
    } else {
      return `You scored ${score}%. You need ${passingScore}% to pass. Please review the material and try again.`;
    }
  }

  async getCourseAnalytics(courseId: string): Promise<{
    totalEnrollments: number;
    completionRate: number;
    averageScore: number;
    timeSpent: number;
    popularLessons: Array<{ lessonId: string; title: string; views: number }>;
    dropoffPoints: Array<{ lessonId: string; title: string; dropoffRate: number }>;
  }> {
    // This would aggregate data from various sources
    // For now, return placeholder data
    return {
      totalEnrollments: 0,
      completionRate: 0,
      averageScore: 0,
      timeSpent: 0,
      popularLessons: [],
      dropoffPoints: []
    };
  }

  async exportCourse(
    courseId: string,
    format: 'scorm' | 'xapi' | 'json' | 'csv'
  ): Promise<string> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: true,
        instructor: {
          select: { name: true, email: true }
        }
      }
    });

    if (!course) {
      throw new Error('Course not found');
    }

    // Generate export file based on format
    const exportData = {
      course,
      exportedAt: new Date().toISOString(),
      format
    };

    const fileName = `course_export_${courseId}_${Date.now()}.${format}`;
    const url = await storage.uploadFile(
      Buffer.from(JSON.stringify(exportData, null, 2)),
      `exports/${fileName}`,
      'application/json'
    );

    return url;
  }

  async duplicateCourse(
    originalCourseId: string,
    newInstructorId: string,
    newTitle?: string
  ): Promise<Course> {
    const originalCourse = await prisma.course.findUnique({
      where: { id: originalCourseId },
      include: {
        lessons: true
      }
    });

    if (!originalCourse) {
      throw new Error('Original course not found');
    }

    // Create new course
    const newCourse = await prisma.course.create({
      data: {
        title: newTitle || `${originalCourse.title} (Copy)`,
        description: originalCourse.description,
        instructorId: newInstructorId,
        category: originalCourse.category,
        level: originalCourse.level,
        language: originalCourse.language,
        tags: originalCourse.tags,
        price: originalCourse.price,
        currency: originalCourse.currency,
        estimatedDuration: originalCourse.estimatedDuration,
        lessonCount: originalCourse.lessonCount,
        isPublished: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Copy lessons
    for (const lesson of originalCourse.lessons) {
      await prisma.lesson.create({
        data: {
          courseId: newCourse.id,
          title: lesson.title,
          description: lesson.description,
          order: lesson.order,
          videoUrl: lesson.videoUrl,
          duration: lesson.duration,
          thumbnailUrl: lesson.thumbnailUrl,
          resources: lesson.resources,
          isPreview: lesson.isPreview,
          isPublished: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    return newCourse;
  }
}

export const educatorToolsService = new EducatorToolsService();