// Enhanced domain types for VideoShiksha
// Enums
export var UserRole;
(function (UserRole) {
    UserRole["STUDENT"] = "STUDENT";
    UserRole["TEACHER"] = "TEACHER";
    UserRole["INSTITUTE_ADMIN"] = "INSTITUTE_ADMIN";
    UserRole["ADMIN"] = "ADMIN";
})(UserRole || (UserRole = {}));
export var Plan;
(function (Plan) {
    Plan["FREE"] = "FREE";
    Plan["STARTER"] = "STARTER";
    Plan["CREATOR"] = "CREATOR";
    Plan["INSTITUTE"] = "INSTITUTE";
    Plan["ENTERPRISE"] = "ENTERPRISE";
})(Plan || (Plan = {}));
// Legacy subscription plans for backward compatibility
export var LegacyPlan;
(function (LegacyPlan) {
    LegacyPlan["FREE"] = "FREE";
    LegacyPlan["BASIC"] = "BASIC";
    LegacyPlan["PRO"] = "PRO";
    LegacyPlan["ENTERPRISE"] = "ENTERPRISE";
})(LegacyPlan || (LegacyPlan = {}));
export var FileType;
(function (FileType) {
    FileType["PPT"] = "PPT";
    FileType["PPTX"] = "PPTX";
    FileType["PDF"] = "PDF";
    FileType["DOCX"] = "DOCX";
    FileType["TXT"] = "TXT";
    FileType["GOOGLE_SLIDES"] = "GOOGLE_SLIDES";
})(FileType || (FileType = {}));
export var ProjectStatus;
(function (ProjectStatus) {
    ProjectStatus["DRAFT"] = "DRAFT";
    ProjectStatus["PROCESSING"] = "PROCESSING";
    ProjectStatus["COMPLETED"] = "COMPLETED";
    ProjectStatus["FAILED"] = "FAILED";
    ProjectStatus["ARCHIVED"] = "ARCHIVED";
})(ProjectStatus || (ProjectStatus = {}));
export var AccessType;
(function (AccessType) {
    AccessType["PRIVATE"] = "PRIVATE";
    AccessType["PUBLIC"] = "PUBLIC";
    AccessType["UNLISTED"] = "UNLISTED";
})(AccessType || (AccessType = {}));
export var SlideLayout;
(function (SlideLayout) {
    SlideLayout["TITLE"] = "TITLE";
    SlideLayout["CONTENT"] = "CONTENT";
    SlideLayout["TWO_COLUMN"] = "TWO_COLUMN";
    SlideLayout["IMAGE_LEFT"] = "IMAGE_LEFT";
    SlideLayout["IMAGE_RIGHT"] = "IMAGE_RIGHT";
    SlideLayout["SECTION_HEADER"] = "SECTION_HEADER";
})(SlideLayout || (SlideLayout = {}));
export var ScriptTone;
(function (ScriptTone) {
    ScriptTone["TEACHER"] = "TEACHER";
    ScriptTone["CONVERSATIONAL"] = "CONVERSATIONAL";
    ScriptTone["CORPORATE"] = "CORPORATE";
    ScriptTone["EXAM_ORIENTED"] = "EXAM_ORIENTED";
    ScriptTone["CASUAL"] = "CASUAL";
})(ScriptTone || (ScriptTone = {}));
export var ContentLevel;
(function (ContentLevel) {
    ContentLevel["BEGINNER"] = "BEGINNER";
    ContentLevel["INTERMEDIATE"] = "INTERMEDIATE";
    ContentLevel["ADVANCED"] = "ADVANCED";
})(ContentLevel || (ContentLevel = {}));
export var CourseLevel;
(function (CourseLevel) {
    CourseLevel["BEGINNER"] = "BEGINNER";
    CourseLevel["INTERMEDIATE"] = "INTERMEDIATE";
    CourseLevel["ADVANCED"] = "ADVANCED";
    CourseLevel["ALL_LEVELS"] = "ALL_LEVELS";
})(CourseLevel || (CourseLevel = {}));
export var CourseStatus;
(function (CourseStatus) {
    CourseStatus["DRAFT"] = "DRAFT";
    CourseStatus["PUBLISHED"] = "PUBLISHED";
    CourseStatus["ARCHIVED"] = "ARCHIVED";
    CourseStatus["DELETED"] = "DELETED";
})(CourseStatus || (CourseStatus = {}));
export var VideoStatus;
(function (VideoStatus) {
    VideoStatus["PENDING"] = "PENDING";
    VideoStatus["PROCESSING"] = "PROCESSING";
    VideoStatus["COMPLETED"] = "COMPLETED";
    VideoStatus["FAILED"] = "FAILED";
    VideoStatus["ARCHIVED"] = "ARCHIVED";
})(VideoStatus || (VideoStatus = {}));
export var JobType;
(function (JobType) {
    JobType["PPT_PARSE"] = "PPT_PARSE";
    JobType["PDF_PARSE"] = "PDF_PARSE";
    JobType["DOCX_PARSE"] = "DOCX_PARSE";
    JobType["SCRIPT_GENERATE"] = "SCRIPT_GENERATE";
    JobType["SCRIPT_TRANSLATE"] = "SCRIPT_TRANSLATE";
    JobType["TTS_GENERATE"] = "TTS_GENERATE";
    JobType["VIDEO_RENDER"] = "VIDEO_RENDER";
    JobType["SUBTITLE_GENERATE"] = "SUBTITLE_GENERATE";
    JobType["THUMBNAIL_GENERATE"] = "THUMBNAIL_GENERATE";
    JobType["ANALYTICS_UPDATE"] = "ANALYTICS_UPDATE";
})(JobType || (JobType = {}));
export var JobStatus;
(function (JobStatus) {
    JobStatus["PENDING"] = "PENDING";
    JobStatus["RUNNING"] = "RUNNING";
    JobStatus["COMPLETED"] = "COMPLETED";
    JobStatus["FAILED"] = "FAILED";
    JobStatus["CANCELLED"] = "CANCELLED";
})(JobStatus || (JobStatus = {}));
export var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["COMPLETED"] = "COMPLETED";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
    PaymentStatus["CANCELLED"] = "CANCELLED";
})(PaymentStatus || (PaymentStatus = {}));
export var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["STRIPE"] = "STRIPE";
    PaymentMethod["RAZORPAY"] = "RAZORPAY";
    PaymentMethod["PAYPAL"] = "PAYPAL";
    PaymentMethod["BANK_TRANSFER"] = "BANK_TRANSFER";
})(PaymentMethod || (PaymentMethod = {}));
export var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "ACTIVE";
    SubscriptionStatus["CANCELLED"] = "CANCELLED";
    SubscriptionStatus["EXPIRED"] = "EXPIRED";
    SubscriptionStatus["SUSPENDED"] = "SUSPENDED";
})(SubscriptionStatus || (SubscriptionStatus = {}));
export var VideoResolution;
(function (VideoResolution) {
    VideoResolution["HD_720"] = "HD_720";
    VideoResolution["FULL_HD_1080"] = "FULL_HD_1080";
    VideoResolution["UHD_4K"] = "UHD_4K";
})(VideoResolution || (VideoResolution = {}));
export var VideoFormat;
(function (VideoFormat) {
    VideoFormat["MP4"] = "MP4";
    VideoFormat["WEBM"] = "WEBM";
    VideoFormat["MOV"] = "MOV";
    VideoFormat["AVI"] = "AVI";
})(VideoFormat || (VideoFormat = {}));
export var AspectRatio;
(function (AspectRatio) {
    AspectRatio["SIXTEEN_NINE"] = "SIXTEEN_NINE";
    AspectRatio["NINE_SIXTEEN"] = "NINE_SIXTEEN";
    AspectRatio["ONE_ONE"] = "ONE_ONE";
    AspectRatio["FOUR_THREE"] = "FOUR_THREE";
})(AspectRatio || (AspectRatio = {}));
export var VideoQuality;
(function (VideoQuality) {
    VideoQuality["LOW"] = "LOW";
    VideoQuality["MEDIUM"] = "MEDIUM";
    VideoQuality["HIGH"] = "HIGH";
    VideoQuality["PREMIUM"] = "PREMIUM";
})(VideoQuality || (VideoQuality = {}));
export var SubtitleFormat;
(function (SubtitleFormat) {
    SubtitleFormat["SRT"] = "SRT";
    SubtitleFormat["VTT"] = "VTT";
    SubtitleFormat["ASS"] = "ASS";
})(SubtitleFormat || (SubtitleFormat = {}));
