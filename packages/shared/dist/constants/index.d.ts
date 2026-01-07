export declare const APP_CONFIG: {
    readonly name: "VideoShiksha";
    readonly description: "Transform your presentations into engaging videos";
    readonly version: "1.0.0";
    readonly url: "https://videoshiksha.com";
};
export declare const API_ENDPOINTS: {
    readonly auth: {
        readonly login: "/api/auth/login";
        readonly register: "/api/auth/register";
        readonly logout: "/api/auth/logout";
        readonly me: "/api/auth/me";
    };
    readonly projects: {
        readonly list: "/api/projects";
        readonly create: "/api/projects";
        readonly get: (id: string) => string;
        readonly update: (id: string) => string;
        readonly delete: (id: string) => string;
    };
    readonly upload: {
        readonly ppt: "/api/upload/ppt";
        readonly image: "/api/upload/image";
    };
    readonly jobs: {
        readonly list: "/api/jobs";
        readonly get: (id: string) => string;
        readonly create: "/api/jobs";
    };
    readonly videos: {
        readonly list: "/api/videos";
        readonly get: (id: string) => string;
        readonly render: "/api/videos/render";
    };
    readonly payments: {
        readonly checkout: "/api/payments/checkout";
        readonly webhook: "/api/payments/webhook";
        readonly history: "/api/payments/history";
    };
};
export declare const FILE_LIMITS: {
    readonly maxFileSize: number;
    readonly allowedPPTTypes: readonly ["application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"];
    readonly allowedImageTypes: readonly ["image/jpeg", "image/png", "image/gif", "image/webp"];
};
export declare const JOB_TIMEOUTS: {
    readonly PPT_PARSE: 60000;
    readonly SCRIPT_GENERATE: 120000;
    readonly TTS_GENERATE: 300000;
    readonly VIDEO_RENDER: 600000;
    readonly SUBTITLE_GENERATE: 60000;
};
export declare const CREDIT_COSTS: {
    readonly PPT_PARSE: 0;
    readonly SCRIPT_GENERATE: 1;
    readonly TTS_GENERATE: 2;
    readonly VIDEO_RENDER: 5;
    readonly SUBTITLE_GENERATE: 1;
};
export declare const SUBSCRIPTION_PLANS: {
    readonly [SubscriptionPlan.FREE]: {
        readonly name: "Free";
        readonly price: 0;
        readonly credits: 10;
        readonly features: readonly ["Up to 3 projects", "Basic video quality (720p)", "Standard voices", "No watermark"];
    };
    readonly [SubscriptionPlan.BASIC]: {
        readonly name: "Basic";
        readonly price: 9.99;
        readonly credits: 100;
        readonly features: readonly ["Unlimited projects", "HD video quality (1080p)", "Premium voices", "No watermark", "Priority support"];
    };
    readonly [SubscriptionPlan.PRO]: {
        readonly name: "Pro";
        readonly price: 29.99;
        readonly credits: 500;
        readonly features: readonly ["Everything in Basic", "4K video quality", "Custom voice cloning", "Batch processing", "API access", "Priority support"];
    };
    readonly [SubscriptionPlan.ENTERPRISE]: {
        readonly name: "Enterprise";
        readonly price: 99.99;
        readonly credits: 2000;
        readonly features: readonly ["Everything in Pro", "Unlimited credits", "White-label options", "Custom integrations", "Dedicated support", "SLA guarantee"];
    };
};
export declare const DEFAULT_VOICE_SETTINGS: VoiceSettings;
export declare const DEFAULT_VIDEO_SETTINGS: VideoSettings;
export declare const DEFAULT_SUBTITLE_SETTINGS: SubtitleSettings;
export declare const WORKER_CONFIG: {
    readonly concurrency: 2;
    readonly maxRetries: 3;
    readonly retryDelay: 5000;
    readonly healthCheckInterval: 30000;
};
export declare const STORAGE_CONFIG: {
    readonly buckets: {
        readonly uploads: "videoshiksha-uploads";
        readonly videos: "videoshiksha-videos";
        readonly images: "videoshiksha-images";
    };
    readonly regions: readonly ["us-east-1", "eu-west-1", "ap-south-1"];
};
import { SubscriptionPlan, VoiceSettings, VideoSettings, SubtitleSettings } from '../types';
//# sourceMappingURL=index.d.ts.map