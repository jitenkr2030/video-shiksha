// Application constants
export const APP_CONFIG = {
    name: 'VideoShiksha',
    description: 'Transform your presentations into engaging videos',
    version: '1.0.0',
    url: 'https://videoshiksha.com'
};
export const API_ENDPOINTS = {
    auth: {
        login: '/api/auth/login',
        register: '/api/auth/register',
        logout: '/api/auth/logout',
        me: '/api/auth/me'
    },
    projects: {
        list: '/api/projects',
        create: '/api/projects',
        get: (id) => `/api/projects/${id}`,
        update: (id) => `/api/projects/${id}`,
        delete: (id) => `/api/projects/${id}`
    },
    upload: {
        ppt: '/api/upload/ppt',
        image: '/api/upload/image'
    },
    jobs: {
        list: '/api/jobs',
        get: (id) => `/api/jobs/${id}`,
        create: '/api/jobs'
    },
    videos: {
        list: '/api/videos',
        get: (id) => `/api/videos/${id}`,
        render: '/api/videos/render'
    },
    payments: {
        checkout: '/api/payments/checkout',
        webhook: '/api/payments/webhook',
        history: '/api/payments/history'
    }
};
export const FILE_LIMITS = {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedPPTTypes: [
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ],
    allowedImageTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
    ]
};
export const JOB_TIMEOUTS = {
    [JobType.PPT_PARSE]: 60000, // 1 minute
    [JobType.SCRIPT_GENERATE]: 120000, // 2 minutes
    [JobType.TTS_GENERATE]: 300000, // 5 minutes
    [JobType.VIDEO_RENDER]: 600000, // 10 minutes
    [JobType.SUBTITLE_GENERATE]: 60000 // 1 minute
};
export const CREDIT_COSTS = {
    [JobType.PPT_PARSE]: 0,
    [JobType.PDF_PARSE]: 1,
    [JobType.DOCX_PARSE]: 1,
    [JobType.SCRIPT_GENERATE]: 1,
    [JobType.SCRIPT_TRANSLATE]: 2,
    [JobType.TTS_GENERATE]: 2,
    [JobType.VIDEO_RENDER]: 5,
    [JobType.SUBTITLE_GENERATE]: 1,
    [JobType.THUMBNAIL_GENERATE]: 1,
    [JobType.ANALYTICS_UPDATE]: 0
};
export const SUBSCRIPTION_PLANS = {
    [Plan.FREE]: {
        name: 'Free',
        price: 0,
        credits: 10,
        features: [
            'Up to 3 projects',
            'Basic video quality (720p)',
            'Standard voices',
            'No watermark'
        ]
    },
    [Plan.STARTER]: {
        name: 'Starter',
        price: 9.99,
        credits: 100,
        features: [
            'Unlimited projects',
            'HD video quality (1080p)',
            'Premium voices',
            'No watermark',
            'Priority support'
        ]
    },
    [Plan.CREATOR]: {
        name: 'Creator',
        price: 29.99,
        credits: 500,
        features: [
            'Everything in Starter',
            '4K video quality',
            'Custom voice cloning',
            'Batch processing',
            'API access',
            'Priority support'
        ]
    },
    [Plan.INSTITUTE]: {
        name: 'Institute',
        price: 49.99,
        credits: 1000,
        features: [
            'Everything in Creator',
            'Multi-user support',
            'Team management',
            'Custom branding',
            'Analytics dashboard'
        ]
    },
    [Plan.ENTERPRISE]: {
        name: 'Enterprise',
        price: 99.99,
        credits: 2000,
        features: [
            'Everything in Institute',
            'Unlimited credits',
            'White-label options',
            'Custom integrations',
            'Dedicated support',
            'SLA guarantee'
        ]
    }
};
export const DEFAULT_VOICE_SETTINGS = {
    provider: 'openai',
    voice: 'alloy',
    speed: 1.0,
    pitch: 1.0,
    language: 'en'
};
export const DEFAULT_VIDEO_SETTINGS = {
    resolution: VideoResolution.FULL_HD_1080,
    format: VideoFormat.MP4,
    aspectRatio: AspectRatio.SIXTEEN_NINE,
    quality: VideoQuality.MEDIUM,
    transitionDuration: 1.0,
    effects: {
        kenBurns: false,
        zoomPan: false,
        highlights: false,
        animations: true,
        transitions: ['fade']
    }
};
export const DEFAULT_SUBTITLE_SETTINGS = {
    enabled: true,
    languages: ['en'],
    position: 'bottom',
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Arial',
    outline: false,
    karaokeMode: false
};
export const WORKER_CONFIG = {
    concurrency: 2,
    maxRetries: 3,
    retryDelay: 5000,
    healthCheckInterval: 30000
};
export const STORAGE_CONFIG = {
    buckets: {
        uploads: 'videoshiksha-uploads',
        videos: 'videoshiksha-videos',
        images: 'videoshiksha-images'
    },
    regions: ['us-east-1', 'eu-west-1', 'ap-south-1']
};
// Import enums from types
import { JobType, Plan, VideoResolution, VideoFormat, VideoQuality, AspectRatio } from '../types';
