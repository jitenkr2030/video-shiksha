export interface User {
    id: string;
    name: string | null;
    email: string;
    phone?: string | null;
    image?: string | null;
    role: UserRole;
    plan: Plan;
    credits: number;
    storageUsed: bigint;
    language: string;
    timezone: string;
    preferences?: UserPreferences;
    instituteId?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface UserPreferences {
    theme: 'light' | 'dark' | 'system';
    language: string;
    autoSave: boolean;
    notifications: NotificationSettings;
    defaultVideoSettings: VideoSettings;
    defaultVoiceSettings: VoiceSettings;
}
export interface NotificationSettings {
    email: boolean;
    push: boolean;
    processingComplete: boolean;
    creditsLow: boolean;
    newFeatures: boolean;
}
export interface Institute {
    id: string;
    name: string;
    domain?: string | null;
    logo?: string | null;
    address?: string | null;
    phone?: string | null;
    email: string;
    settings?: InstituteSettings;
    createdAt: Date;
    updatedAt: Date;
}
export interface InstituteSettings {
    allowPublicCourses: boolean;
    defaultCredits: number;
    customBranding: boolean;
    apiAccess: boolean;
    storageLimit: bigint;
}
export interface Course {
    id: string;
    title: string;
    description?: string | null;
    instructorId: string;
    instituteId?: string | null;
    isPublic: boolean;
    thumbnail?: string | null;
    price?: number | null;
    currency: string;
    tags: string[];
    category?: string | null;
    level: CourseLevel;
    language: string;
    status: CourseStatus;
    settings?: CourseSettings;
    createdAt: Date;
    updatedAt: Date;
}
export interface CourseSettings {
    allowDownload: boolean;
    allowComments: boolean;
    certificateEnabled: boolean;
    autoSubtitle: boolean;
    watermark: boolean;
}
export interface Enrollment {
    id: string;
    userId: string;
    courseId: string;
    enrolledAt: Date;
    progress: number;
    completedAt?: Date | null;
}
export interface Project {
    id: string;
    userId: string;
    courseId?: string | null;
    title: string;
    description?: string | null;
    originalFileUrl?: string | null;
    originalFileName?: string | null;
    fileType: FileType;
    fileSize?: bigint | null;
    language: string;
    status: ProjectStatus;
    settings: ProjectSettings;
    branding?: BrandingSettings;
    watermark: boolean;
    accessType: AccessType;
    shareToken?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface ProjectSettings {
    voice: VoiceSettings;
    video: VideoSettings;
    subtitles: SubtitleSettings;
    script: ScriptSettings;
    avatar?: AvatarSettings;
    background?: BackgroundSettings;
}
export interface BrandingSettings {
    logo?: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
    };
    fonts: {
        heading: string;
        body: string;
    };
    intro?: {
        enabled: boolean;
        duration: number;
        content: string;
    };
    outro?: {
        enabled: boolean;
        duration: number;
        content: string;
    };
}
export interface AvatarSettings {
    enabled: boolean;
    avatarId: string;
    position: 'fullscreen' | 'corner' | 'side';
    size: 'small' | 'medium' | 'large';
    backgroundRemoval: boolean;
    expressions: boolean;
}
export interface BackgroundSettings {
    type: 'color' | 'gradient' | 'image' | 'video';
    value: string;
    blur?: number;
    opacity?: number;
}
export interface Slide {
    id: string;
    projectId: string;
    order: number;
    title: string;
    content: string;
    speakerNotes?: string | null;
    imageUrl?: string | null;
    audioUrl?: string | null;
    duration: number;
    transition?: string | null;
    background?: string | null;
    layout: SlideLayout;
    language: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface SlideExtraction {
    title: string;
    content: string;
    speakerNotes?: string;
    images: SlideImage[];
    charts: SlideChart[];
    layout: SlideLayout;
    elements: SlideElement[];
}
export interface SlideImage {
    url: string;
    alt: string;
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
export interface SlideChart {
    type: 'bar' | 'pie' | 'line' | 'area';
    data: any;
    title?: string;
}
export interface SlideElement {
    type: 'text' | 'image' | 'chart' | 'shape';
    content: any;
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    style: any;
}
export interface Script {
    id: string;
    slideId: string;
    content: string;
    originalContent?: string | null;
    tone: ScriptTone;
    level: ContentLevel;
    voiceSettings: VoiceSettings;
    generatedAt: Date;
    isCustom: boolean;
    language: string;
}
export interface ScriptSettings {
    autoGenerate: boolean;
    tone: ScriptTone;
    level: ContentLevel;
    maxLength: number;
    includeSpeakerNotes: boolean;
    customPrompt?: string;
    translation: {
        enabled: boolean;
        targetLanguages: string[];
    };
}
export interface ScriptTranslation {
    language: string;
    content: string;
    voiceSettings: VoiceSettings;
}
export interface Video {
    id: string;
    projectId: string;
    title?: string | null;
    url: string;
    thumbnailUrl?: string | null;
    duration: number;
    resolution: VideoResolution;
    format: VideoFormat;
    aspectRatio: AspectRatio;
    quality: VideoQuality;
    status: VideoStatus;
    metadata?: VideoMetadata;
    subtitlesUrl?: string | null;
    watermark: boolean;
    downloadCount: number;
    viewCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface VideoMetadata {
    fileSize: bigint;
    bitrate: number;
    frameRate: number;
    codec: string;
    audioCodec: string;
    chapters: VideoChapter[];
    scenes: VideoScene[];
    analytics: VideoAnalytics;
}
export interface VideoChapter {
    id: string;
    title: string;
    startTime: number;
    endTime: number;
    thumbnail?: string;
}
export interface VideoScene {
    slideId: string;
    startTime: number;
    endTime: number;
    transition: string;
    effects: string[];
}
export interface VideoAnalytics {
    engagementScore: number;
    averageWatchTime: number;
    completionRate: number;
    dropOffPoints: number[];
    popularScenes: string[];
}
export interface Subtitle {
    id: string;
    slideId: string;
    language: string;
    content: string;
    startTime: number;
    endTime: number;
    format: SubtitleFormat;
    isBurnedIn: boolean;
    createdAt: Date;
}
export interface SubtitleSettings {
    enabled: boolean;
    languages: string[];
    position: 'top' | 'center' | 'bottom';
    fontSize: number;
    color: string;
    backgroundColor?: string;
    fontFamily: string;
    outline: boolean;
    karaokeMode: boolean;
}
export interface VoiceSettings {
    provider: 'openai' | 'elevenlabs' | 'azure' | 'google';
    voice: string;
    speed: number;
    pitch: number;
    language: string;
    accent?: string;
    emotion?: string;
    stability?: number;
}
export interface Voice {
    id: string;
    name: string;
    provider: string;
    language: string;
    accent?: string;
    gender: 'male' | 'female' | 'neutral';
    age: 'young' | 'adult' | 'mature';
    style: string[];
    previewUrl?: string;
    isPremium: boolean;
}
export interface VideoSettings {
    resolution: VideoResolution;
    format: VideoFormat;
    aspectRatio: AspectRatio;
    quality: VideoQuality;
    transitionDuration: number;
    backgroundMusic?: BackgroundMusicSettings;
    effects: VideoEffects;
}
export interface BackgroundMusicSettings {
    enabled: boolean;
    track: string;
    volume: number;
    fadeIn: boolean;
    fadeOut: boolean;
}
export interface VideoEffects {
    kenBurns: boolean;
    zoomPan: boolean;
    highlights: boolean;
    animations: boolean;
    transitions: string[];
}
export interface Job {
    id: string;
    projectId: string;
    type: JobType;
    status: JobStatus;
    progress: number;
    result?: JobResult;
    error?: string;
    priority: number;
    startedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface JobResult {
    data: any;
    metadata?: Record<string, any>;
    performance: {
        processingTime: number;
        memoryUsed: bigint;
        creditsUsed: number;
    };
}
export interface Payment {
    id: string;
    userId: string;
    subscriptionId?: string | null;
    amount: number;
    currency: string;
    status: PaymentStatus;
    method: PaymentMethod;
    stripePaymentIntentId?: string | null;
    invoiceId?: string | null;
    credits: number;
    description?: string | null;
    metadata?: PaymentMetadata;
    createdAt: Date;
    updatedAt: Date;
}
export interface PaymentMetadata {
    plan?: Plan;
    duration?: string;
    features?: string[];
    promoCode?: string;
    referralId?: string;
}
export interface Subscription {
    id: string;
    userId: string;
    plan: Plan;
    status: SubscriptionStatus;
    startDate: Date;
    endDate: Date;
    credits: number;
    recurring: boolean;
    stripeSubId?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface UserAnalytics {
    id: string;
    userId: string;
    date: Date;
    videosCreated: number;
    creditsUsed: number;
    storageUsed: bigint;
    renderTime: number;
    language?: string | null;
    metadata?: any;
}
export interface ProjectAnalytics {
    id: string;
    projectId: string;
    date: Date;
    views: number;
    downloads: number;
    shares: number;
    renderTime: number;
    successRate: number;
    metadata?: any;
}
export interface SystemAnalytics {
    totalUsers: number;
    activeUsers: number;
    totalVideos: number;
    processingJobs: number;
    revenue: number;
    popularLanguages: LanguageStats[];
    popularFeatures: FeatureStats[];
}
export interface LanguageStats {
    language: string;
    count: number;
    percentage: number;
}
export interface FeatureStats {
    feature: string;
    usage: number;
    adoption: number;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    meta?: {
        pagination?: PaginationMeta;
        timestamp: string;
        version: string;
    };
}
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: PaginationMeta;
}
export interface UploadResponse {
    id: string;
    url: string;
    name: string;
    size: number;
    type: string;
    metadata: FileMetadata;
}
export interface FileMetadata {
    slides: number;
    duration?: number;
    language: string;
    hasImages: boolean;
    hasCharts: boolean;
    hasSpeakerNotes: boolean;
    processingTime: number;
}
export interface ExportOptions {
    format: VideoFormat;
    resolution: VideoResolution;
    quality: VideoQuality;
    aspectRatio: AspectRatio;
    subtitles: boolean;
    watermark: boolean;
    chapters: boolean;
}
export interface ExportRequest {
    projectId: string;
    options: ExportOptions;
    destinations: string[];
}
export interface CreateProjectRequest {
    title: string;
    description?: string;
    fileType: FileType;
    language: string;
    settings: ProjectSettings;
    branding?: BrandingSettings;
}
export interface UpdateProjectRequest {
    title?: string;
    description?: string;
    settings?: Partial<ProjectSettings>;
    branding?: Partial<BrandingSettings>;
}
export interface UploadFileRequest {
    file: File;
    projectId: string;
    fileType: FileType;
}
export interface GenerateScriptRequest {
    slideId: string;
    settings: Partial<ScriptSettings>;
    customPrompt?: string;
}
export interface RenderVideoRequest {
    projectId: string;
    settings?: Partial<VideoSettings>;
    destinations?: string[];
}
export interface CreateCourseRequest {
    title: string;
    description?: string;
    category?: string;
    level: CourseLevel;
    language: string;
    isPublic: boolean;
    price?: number;
    settings?: CourseSettings;
}
export declare enum UserRole {
    STUDENT = "STUDENT",
    TEACHER = "TEACHER",
    INSTITUTE_ADMIN = "INSTITUTE_ADMIN",
    ADMIN = "ADMIN"
}
export declare enum Plan {
    FREE = "FREE",
    STARTER = "STARTER",
    CREATOR = "CREATOR",
    INSTITUTE = "INSTITUTE",
    ENTERPRISE = "ENTERPRISE"
}
export declare enum FileType {
    PPT = "PPT",
    PPTX = "PPTX",
    PDF = "PDF",
    DOCX = "DOCX",
    TXT = "TXT",
    GOOGLE_SLIDES = "GOOGLE_SLIDES"
}
export declare enum ProjectStatus {
    DRAFT = "DRAFT",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    ARCHIVED = "ARCHIVED"
}
export declare enum AccessType {
    PRIVATE = "PRIVATE",
    PUBLIC = "PUBLIC",
    UNLISTED = "UNLISTED"
}
export declare enum SlideLayout {
    TITLE = "TITLE",
    CONTENT = "CONTENT",
    TWO_COLUMN = "TWO_COLUMN",
    IMAGE_LEFT = "IMAGE_LEFT",
    IMAGE_RIGHT = "IMAGE_RIGHT",
    SECTION_HEADER = "SECTION_HEADER"
}
export declare enum ScriptTone {
    TEACHER = "TEACHER",
    CONVERSATIONAL = "CONVERSATIONAL",
    CORPORATE = "CORPORATE",
    EXAM_ORIENTED = "EXAM_ORIENTED",
    CASUAL = "CASUAL"
}
export declare enum ContentLevel {
    BEGINNER = "BEGINNER",
    INTERMEDIATE = "INTERMEDIATE",
    ADVANCED = "ADVANCED"
}
export declare enum CourseLevel {
    BEGINNER = "BEGINNER",
    INTERMEDIATE = "INTERMEDIATE",
    ADVANCED = "ADVANCED",
    ALL_LEVELS = "ALL_LEVELS"
}
export declare enum CourseStatus {
    DRAFT = "DRAFT",
    PUBLISHED = "PUBLISHED",
    ARCHIVED = "ARCHIVED",
    DELETED = "DELETED"
}
export declare enum VideoStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    ARCHIVED = "ARCHIVED"
}
export declare enum JobType {
    PPT_PARSE = "PPT_PARSE",
    PDF_PARSE = "PDF_PARSE",
    DOCX_PARSE = "DOCX_PARSE",
    SCRIPT_GENERATE = "SCRIPT_GENERATE",
    SCRIPT_TRANSLATE = "SCRIPT_TRANSLATE",
    TTS_GENERATE = "TTS_GENERATE",
    VIDEO_RENDER = "VIDEO_RENDER",
    SUBTITLE_GENERATE = "SUBTITLE_GENERATE",
    THUMBNAIL_GENERATE = "THUMBNAIL_GENERATE",
    ANALYTICS_UPDATE = "ANALYTICS_UPDATE"
}
export declare enum JobStatus {
    PENDING = "PENDING",
    RUNNING = "RUNNING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED"
}
export declare enum PaymentStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED",
    CANCELLED = "CANCELLED"
}
export declare enum PaymentMethod {
    STRIPE = "STRIPE",
    RAZORPAY = "RAZORPAY",
    PAYPAL = "PAYPAL",
    BANK_TRANSFER = "BANK_TRANSFER"
}
export declare enum SubscriptionStatus {
    ACTIVE = "ACTIVE",
    CANCELLED = "CANCELLED",
    EXPIRED = "EXPIRED",
    SUSPENDED = "SUSPENDED"
}
export declare enum VideoResolution {
    HD_720 = "HD_720",
    FULL_HD_1080 = "FULL_HD_1080",
    UHD_4K = "UHD_4K"
}
export declare enum VideoFormat {
    MP4 = "MP4",
    WEBM = "WEBM",
    MOV = "MOV",
    AVI = "AVI"
}
export declare enum AspectRatio {
    SIXTEEN_NINE = "SIXTEEN_NINE",
    NINE_SIXTEEN = "NINE_SIXTEEN",
    ONE_ONE = "ONE_ONE",
    FOUR_THREE = "FOUR_THREE"
}
export declare enum VideoQuality {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    PREMIUM = "PREMIUM"
}
export declare enum SubtitleFormat {
    SRT = "SRT",
    VTT = "VTT",
    ASS = "ASS"
}
//# sourceMappingURL=index.d.ts.map