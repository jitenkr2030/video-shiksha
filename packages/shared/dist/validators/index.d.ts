import { z } from 'zod';
import { VideoResolution, VideoFormat, JobType, PaymentStatus } from '../types';
export declare const CreateUserSchema: z.ZodObject<{
    email: z.ZodString;
    name: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    password: string;
}, {
    email: string;
    name: string;
    password: string;
}>;
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const CreateProjectSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    settings: z.ZodObject<{
        voice: z.ZodObject<{
            provider: z.ZodEnum<["openai", "elevenlabs"]>;
            voice: z.ZodString;
            speed: z.ZodNumber;
            pitch: z.ZodNumber;
            language: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            voice: string;
            provider: "openai" | "elevenlabs";
            speed: number;
            pitch: number;
            language: string;
        }, {
            voice: string;
            provider: "openai" | "elevenlabs";
            speed: number;
            pitch: number;
            language: string;
        }>;
        video: z.ZodObject<{
            resolution: z.ZodNativeEnum<typeof VideoResolution>;
            format: z.ZodNativeEnum<typeof VideoFormat>;
            quality: z.ZodEnum<["low", "medium", "high"]>;
            transitionDuration: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            resolution: VideoResolution;
            format: VideoFormat;
            quality: "medium" | "low" | "high";
            transitionDuration: number;
        }, {
            resolution: VideoResolution;
            format: VideoFormat;
            quality: "medium" | "low" | "high";
            transitionDuration: number;
        }>;
        subtitles: z.ZodObject<{
            enabled: z.ZodBoolean;
            language: z.ZodString;
            position: z.ZodEnum<["bottom", "top", "center"]>;
            fontSize: z.ZodNumber;
            color: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            color: string;
            language: string;
            enabled: boolean;
            position: "top" | "center" | "bottom";
            fontSize: number;
        }, {
            color: string;
            language: string;
            enabled: boolean;
            position: "top" | "center" | "bottom";
            fontSize: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        video: {
            resolution: VideoResolution;
            format: VideoFormat;
            quality: "medium" | "low" | "high";
            transitionDuration: number;
        };
        voice: {
            voice: string;
            provider: "openai" | "elevenlabs";
            speed: number;
            pitch: number;
            language: string;
        };
        subtitles: {
            color: string;
            language: string;
            enabled: boolean;
            position: "top" | "center" | "bottom";
            fontSize: number;
        };
    }, {
        video: {
            resolution: VideoResolution;
            format: VideoFormat;
            quality: "medium" | "low" | "high";
            transitionDuration: number;
        };
        voice: {
            voice: string;
            provider: "openai" | "elevenlabs";
            speed: number;
            pitch: number;
            language: string;
        };
        subtitles: {
            color: string;
            language: string;
            enabled: boolean;
            position: "top" | "center" | "bottom";
            fontSize: number;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    title: string;
    settings: {
        video: {
            resolution: VideoResolution;
            format: VideoFormat;
            quality: "medium" | "low" | "high";
            transitionDuration: number;
        };
        voice: {
            voice: string;
            provider: "openai" | "elevenlabs";
            speed: number;
            pitch: number;
            language: string;
        };
        subtitles: {
            color: string;
            language: string;
            enabled: boolean;
            position: "top" | "center" | "bottom";
            fontSize: number;
        };
    };
    description?: string | undefined;
}, {
    title: string;
    settings: {
        video: {
            resolution: VideoResolution;
            format: VideoFormat;
            quality: "medium" | "low" | "high";
            transitionDuration: number;
        };
        voice: {
            voice: string;
            provider: "openai" | "elevenlabs";
            speed: number;
            pitch: number;
            language: string;
        };
        subtitles: {
            color: string;
            language: string;
            enabled: boolean;
            position: "top" | "center" | "bottom";
            fontSize: number;
        };
    };
    description?: string | undefined;
}>;
export declare const UpdateProjectSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    settings: z.ZodOptional<z.ZodObject<{
        voice: z.ZodObject<{
            provider: z.ZodEnum<["openai", "elevenlabs"]>;
            voice: z.ZodString;
            speed: z.ZodNumber;
            pitch: z.ZodNumber;
            language: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            voice: string;
            provider: "openai" | "elevenlabs";
            speed: number;
            pitch: number;
            language: string;
        }, {
            voice: string;
            provider: "openai" | "elevenlabs";
            speed: number;
            pitch: number;
            language: string;
        }>;
        video: z.ZodObject<{
            resolution: z.ZodNativeEnum<typeof VideoResolution>;
            format: z.ZodNativeEnum<typeof VideoFormat>;
            quality: z.ZodEnum<["low", "medium", "high"]>;
            transitionDuration: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            resolution: VideoResolution;
            format: VideoFormat;
            quality: "medium" | "low" | "high";
            transitionDuration: number;
        }, {
            resolution: VideoResolution;
            format: VideoFormat;
            quality: "medium" | "low" | "high";
            transitionDuration: number;
        }>;
        subtitles: z.ZodObject<{
            enabled: z.ZodBoolean;
            language: z.ZodString;
            position: z.ZodEnum<["bottom", "top", "center"]>;
            fontSize: z.ZodNumber;
            color: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            color: string;
            language: string;
            enabled: boolean;
            position: "top" | "center" | "bottom";
            fontSize: number;
        }, {
            color: string;
            language: string;
            enabled: boolean;
            position: "top" | "center" | "bottom";
            fontSize: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        video: {
            resolution: VideoResolution;
            format: VideoFormat;
            quality: "medium" | "low" | "high";
            transitionDuration: number;
        };
        voice: {
            voice: string;
            provider: "openai" | "elevenlabs";
            speed: number;
            pitch: number;
            language: string;
        };
        subtitles: {
            color: string;
            language: string;
            enabled: boolean;
            position: "top" | "center" | "bottom";
            fontSize: number;
        };
    }, {
        video: {
            resolution: VideoResolution;
            format: VideoFormat;
            quality: "medium" | "low" | "high";
            transitionDuration: number;
        };
        voice: {
            voice: string;
            provider: "openai" | "elevenlabs";
            speed: number;
            pitch: number;
            language: string;
        };
        subtitles: {
            color: string;
            language: string;
            enabled: boolean;
            position: "top" | "center" | "bottom";
            fontSize: number;
        };
    }>>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    description?: string | undefined;
    settings?: {
        video: {
            resolution: VideoResolution;
            format: VideoFormat;
            quality: "medium" | "low" | "high";
            transitionDuration: number;
        };
        voice: {
            voice: string;
            provider: "openai" | "elevenlabs";
            speed: number;
            pitch: number;
            language: string;
        };
        subtitles: {
            color: string;
            language: string;
            enabled: boolean;
            position: "top" | "center" | "bottom";
            fontSize: number;
        };
    } | undefined;
}, {
    title?: string | undefined;
    description?: string | undefined;
    settings?: {
        video: {
            resolution: VideoResolution;
            format: VideoFormat;
            quality: "medium" | "low" | "high";
            transitionDuration: number;
        };
        voice: {
            voice: string;
            provider: "openai" | "elevenlabs";
            speed: number;
            pitch: number;
            language: string;
        };
        subtitles: {
            color: string;
            language: string;
            enabled: boolean;
            position: "top" | "center" | "bottom";
            fontSize: number;
        };
    } | undefined;
}>;
export declare const UploadPPTSchema: z.ZodObject<{
    projectId: z.ZodString;
    file: z.ZodEffects<z.ZodEffects<z.ZodType<import("buffer").File, z.ZodTypeDef, import("buffer").File>, import("buffer").File, import("buffer").File>, import("buffer").File, import("buffer").File>;
}, "strip", z.ZodTypeAny, {
    projectId: string;
    file: import("buffer").File;
}, {
    projectId: string;
    file: import("buffer").File;
}>;
export declare const UploadImageSchema: z.ZodObject<{
    projectId: z.ZodString;
    slideId: z.ZodOptional<z.ZodString>;
    file: z.ZodEffects<z.ZodEffects<z.ZodType<import("buffer").File, z.ZodTypeDef, import("buffer").File>, import("buffer").File, import("buffer").File>, import("buffer").File, import("buffer").File>;
}, "strip", z.ZodTypeAny, {
    projectId: string;
    file: import("buffer").File;
    slideId?: string | undefined;
}, {
    projectId: string;
    file: import("buffer").File;
    slideId?: string | undefined;
}>;
export declare const CreateJobSchema: z.ZodObject<{
    projectId: z.ZodString;
    type: z.ZodNativeEnum<typeof JobType>;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    type: JobType;
    projectId: string;
    data?: Record<string, any> | undefined;
}, {
    type: JobType;
    projectId: string;
    data?: Record<string, any> | undefined;
}>;
export declare const UpdateJobSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["pending", "running", "completed", "failed"]>>;
    progress: z.ZodOptional<z.ZodNumber>;
    result: z.ZodOptional<z.ZodAny>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "running" | "completed" | "failed" | undefined;
    progress?: number | undefined;
    result?: any;
    error?: string | undefined;
}, {
    status?: "pending" | "running" | "completed" | "failed" | undefined;
    progress?: number | undefined;
    result?: any;
    error?: string | undefined;
}>;
export declare const RenderVideoSchema: z.ZodObject<{
    projectId: z.ZodString;
    settings: z.ZodOptional<z.ZodObject<{
        resolution: z.ZodOptional<z.ZodNativeEnum<typeof VideoResolution>>;
        format: z.ZodOptional<z.ZodNativeEnum<typeof VideoFormat>>;
        quality: z.ZodOptional<z.ZodEnum<["low", "medium", "high"]>>;
        transitionDuration: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        resolution?: VideoResolution | undefined;
        format?: VideoFormat | undefined;
        quality?: "medium" | "low" | "high" | undefined;
        transitionDuration?: number | undefined;
    }, {
        resolution?: VideoResolution | undefined;
        format?: VideoFormat | undefined;
        quality?: "medium" | "low" | "high" | undefined;
        transitionDuration?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    projectId: string;
    settings?: {
        resolution?: VideoResolution | undefined;
        format?: VideoFormat | undefined;
        quality?: "medium" | "low" | "high" | undefined;
        transitionDuration?: number | undefined;
    } | undefined;
}, {
    projectId: string;
    settings?: {
        resolution?: VideoResolution | undefined;
        format?: VideoFormat | undefined;
        quality?: "medium" | "low" | "high" | undefined;
        transitionDuration?: number | undefined;
    } | undefined;
}>;
export declare const CreatePaymentSchema: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    credits: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    amount: number;
    currency: string;
    credits: number;
}, {
    amount: number;
    credits: number;
    currency?: string | undefined;
}>;
export declare const UpdatePaymentSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodNativeEnum<typeof PaymentStatus>>;
    stripePaymentIntentId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: PaymentStatus | undefined;
    stripePaymentIntentId?: string | undefined;
}, {
    status?: PaymentStatus | undefined;
    stripePaymentIntentId?: string | undefined;
}>;
export declare const GenerateScriptSchema: z.ZodObject<{
    slideId: z.ZodString;
    customPrompt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    slideId: string;
    customPrompt?: string | undefined;
}, {
    slideId: string;
    customPrompt?: string | undefined;
}>;
export declare const GenerateTTSSchema: z.ZodObject<{
    scriptId: z.ZodString;
    voiceSettings: z.ZodObject<{
        provider: z.ZodEnum<["openai", "elevenlabs"]>;
        voice: z.ZodString;
        speed: z.ZodNumber;
        pitch: z.ZodNumber;
        language: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        voice: string;
        provider: "openai" | "elevenlabs";
        speed: number;
        pitch: number;
        language: string;
    }, {
        voice: string;
        provider: "openai" | "elevenlabs";
        speed: number;
        pitch: number;
        language: string;
    }>;
}, "strip", z.ZodTypeAny, {
    scriptId: string;
    voiceSettings: {
        voice: string;
        provider: "openai" | "elevenlabs";
        speed: number;
        pitch: number;
        language: string;
    };
}, {
    scriptId: string;
    voiceSettings: {
        voice: string;
        provider: "openai" | "elevenlabs";
        speed: number;
        pitch: number;
        language: string;
    };
}>;
export declare const ApiResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodAny>;
    error: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    message?: string | undefined;
    data?: any;
    error?: string | undefined;
}, {
    success: boolean;
    message?: string | undefined;
    data?: any;
    error?: string | undefined;
}>;
export declare const PaginatedResponseSchema: z.ZodObject<{
    data: z.ZodArray<z.ZodAny, "many">;
    pagination: z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
        total: z.ZodNumber;
        totalPages: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }, {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: any[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}, {
    data: any[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}>;
export declare const validateEmail: (email: string) => boolean;
export declare const validatePassword: (password: string) => boolean;
export declare const validateUUID: (uuid: string) => boolean;
export declare const validateFileExtension: (filename: string, allowedExtensions: string[]) => boolean;
export declare const sanitizeFileName: (filename: string) => string;
export declare const validatePaginationParams: (page: any, limit: any) => {
    page: number;
    limit: number;
};
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type UploadPPTInput = z.infer<typeof UploadPPTSchema>;
export type UploadImageInput = z.infer<typeof UploadImageSchema>;
export type CreateJobInput = z.infer<typeof CreateJobSchema>;
export type UpdateJobInput = z.infer<typeof UpdateJobSchema>;
export type RenderVideoInput = z.infer<typeof RenderVideoSchema>;
export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof UpdatePaymentSchema>;
export type GenerateScriptInput = z.infer<typeof GenerateScriptSchema>;
export type GenerateTTSInput = z.infer<typeof GenerateTTSSchema>;
//# sourceMappingURL=index.d.ts.map