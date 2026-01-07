import { z } from 'zod';
import { VideoResolution, VideoFormat, JobType, PaymentStatus } from '../types';
// User validation schemas
export const CreateUserSchema = z.object({
    email: z.string().email('Invalid email address'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters')
});
export const LoginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
});
// Project validation schemas
export const CreateProjectSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
    description: z.string().max(500, 'Description too long').optional(),
    settings: z.object({
        voice: z.object({
            provider: z.enum(['openai', 'elevenlabs']),
            voice: z.string().min(1, 'Voice selection required'),
            speed: z.number().min(0.5).max(2.0),
            pitch: z.number().min(0.5).max(2.0),
            language: z.string().min(2).max(5)
        }),
        video: z.object({
            resolution: z.nativeEnum(VideoResolution),
            format: z.nativeEnum(VideoFormat),
            quality: z.enum(['low', 'medium', 'high']),
            transitionDuration: z.number().min(0.5).max(5.0)
        }),
        subtitles: z.object({
            enabled: z.boolean(),
            language: z.string().min(2).max(5),
            position: z.enum(['bottom', 'top', 'center']),
            fontSize: z.number().min(10).max(48),
            color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
        })
    })
});
export const UpdateProjectSchema = CreateProjectSchema.partial();
// File upload validation schemas
export const UploadPPTSchema = z.object({
    projectId: z.string().uuid('Invalid project ID'),
    file: z.instanceof(File).refine((file) => file.size <= 100 * 1024 * 1024, // 100MB
    'File size must be less than 100MB').refine((file) => [
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ].includes(file.type), 'Only PowerPoint files are allowed')
});
export const UploadImageSchema = z.object({
    projectId: z.string().uuid('Invalid project ID'),
    slideId: z.string().uuid('Invalid slide ID').optional(),
    file: z.instanceof(File).refine((file) => file.size <= 10 * 1024 * 1024, // 10MB
    'File size must be less than 10MB').refine((file) => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type), 'Only image files are allowed')
});
// Job validation schemas
export const CreateJobSchema = z.object({
    projectId: z.string().uuid('Invalid project ID'),
    type: z.nativeEnum(JobType),
    data: z.record(z.any()).optional()
});
export const UpdateJobSchema = z.object({
    status: z.enum(['pending', 'running', 'completed', 'failed']).optional(),
    progress: z.number().min(0).max(100).optional(),
    result: z.any().optional(),
    error: z.string().optional()
});
// Video validation schemas
export const RenderVideoSchema = z.object({
    projectId: z.string().uuid('Invalid project ID'),
    settings: z.object({
        resolution: z.nativeEnum(VideoResolution).optional(),
        format: z.nativeEnum(VideoFormat).optional(),
        quality: z.enum(['low', 'medium', 'high']).optional(),
        transitionDuration: z.number().min(0.5).max(5.0).optional()
    }).optional()
});
// Payment validation schemas
export const CreatePaymentSchema = z.object({
    amount: z.number().min(1, 'Amount must be greater than 0'),
    currency: z.string().default('USD'),
    credits: z.number().min(1, 'Credits must be greater than 0')
});
export const UpdatePaymentSchema = z.object({
    status: z.nativeEnum(PaymentStatus).optional(),
    stripePaymentIntentId: z.string().optional()
});
// Script generation validation schemas
export const GenerateScriptSchema = z.object({
    slideId: z.string().uuid('Invalid slide ID'),
    customPrompt: z.string().max(1000, 'Custom prompt too long').optional()
});
// TTS validation schemas
export const GenerateTTSSchema = z.object({
    scriptId: z.string().uuid('Invalid script ID'),
    voiceSettings: z.object({
        provider: z.enum(['openai', 'elevenlabs']),
        voice: z.string().min(1, 'Voice selection required'),
        speed: z.number().min(0.5).max(2.0),
        pitch: z.number().min(0.5).max(2.0),
        language: z.string().min(2).max(5)
    })
});
// API response validation schemas
export const ApiResponseSchema = z.object({
    success: z.boolean(),
    data: z.any().optional(),
    error: z.string().optional(),
    message: z.string().optional()
});
export const PaginatedResponseSchema = z.object({
    data: z.array(z.any()),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number()
    })
});
// Utility validation functions
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
export const validatePassword = (password) => {
    return password.length >= 8;
};
export const validateUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};
export const validateFileExtension = (filename, allowedExtensions) => {
    const extension = filename.toLowerCase().split('.').pop();
    return extension ? allowedExtensions.includes(extension) : false;
};
export const sanitizeFileName = (filename) => {
    return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
};
export const validatePaginationParams = (page, limit) => {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    return {
        page: isNaN(pageNum) || pageNum < 1 ? 1 : pageNum,
        limit: isNaN(limitNum) || limitNum < 1 || limitNum > 100 ? 10 : limitNum
    };
};
