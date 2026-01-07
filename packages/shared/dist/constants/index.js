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
    [JobType.SCRIPT_GENERATE]: 1,
    [JobType.TTS_GENERATE]: 2,
    [JobType.VIDEO_RENDER]: 5,
    [JobType.SUBTITLE_GENERATE]: 1
};
export const SUBSCRIPTION_PLANS = {
    [SubscriptionPlan.FREE]: {
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
    [SubscriptionPlan.BASIC]: {
        name: 'Basic',
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
    [SubscriptionPlan.PRO]: {
        name: 'Pro',
        price: 29.99,
        credits: 500,
        features: [
            'Everything in Basic',
            '4K video quality',
            'Custom voice cloning',
            'Batch processing',
            'API access',
            'Priority support'
        ]
    },
    [SubscriptionPlan.ENTERPRISE]: {
        name: 'Enterprise',
        price: 99.99,
        credits: 2000,
        features: [
            'Everything in Pro',
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
    quality: 'medium',
    transitionDuration: 1.0
};
export const DEFAULT_SUBTITLE_SETTINGS = {
    enabled: true,
    language: 'en',
    position: 'bottom',
    fontSize: 16,
    color: '#FFFFFF'
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
import { JobType, SubscriptionPlan, VideoResolution, VideoFormat } from '../types';
