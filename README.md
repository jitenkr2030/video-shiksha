# VideoShiksha

Transform your PowerPoint presentations into engaging videos with AI-powered narration.

## 🚀 Features

- **AI-Powered Script Generation**: Automatically generate narration scripts from your slides
- **Natural Voice Synthesis**: Convert scripts to natural-sounding audio using advanced TTS
- **Professional Video Rendering**: Create high-quality videos with smooth transitions
- **Multi-Language Support**: Support for multiple languages and voice options
- **Scalable Architecture**: Built with Next.js, TypeScript, and queue-based processing
- **SaaS Ready**: Complete billing, user management, and subscription system

## 🏗️ Architecture

VideoShiksha is built as a monorepo using TurboRepo with the following structure:

```
videoshiksha/
├── apps/
│   ├── web/          # Next.js frontend application
│   └── worker/       # Video processing workers
├── packages/
│   └── shared/       # Shared types and utilities
├── prisma/           # Database schema and migrations
├── infra/            # Infrastructure configuration
└── scripts/          # Utility scripts
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** + shadcn/ui for styling
- **React Query** for server state
- **Zustand** for client state
- **NextAuth.js** for authentication

### Backend
- **Next.js API Routes** for web APIs
- **Bun** runtime for workers
- **Prisma** ORM with SQLite
- **BullMQ** for job queuing
- **Redis** for queue management

### AI & Media Processing
- **OpenAI API** for script generation
- **ElevenLabs API** for voice synthesis
- **FFmpeg** for video processing
- **LibreOffice** for PPT parsing

### Infrastructure
- **Docker** for containerization
- **Nginx** for reverse proxy
- **Stripe** for payments
- **AWS S3** for file storage

## 🚦 Quick Start

### Prerequisites

- Node.js 18+
- Bun runtime
- Docker & Docker Compose

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd videoshiksha
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your API keys
```

4. Initialize the database:
```bash
bun run db:push
bun run db:generate
bun run scripts/seed.ts
```

5. Start the development servers:
```bash
bun run dev
```

This will start:
- Web application at http://localhost:3000
- Worker service at http://localhost:3001
- Redis at localhost:6379

### Docker Setup

For development with Docker:

```bash
docker-compose up -d
```

## 📁 Project Structure

### Apps

#### `apps/web`
Next.js full-stack application with:
- Authentication system
- Project management
- File upload interface
- Video preview and download
- Billing and subscription management

#### `apps/worker`
Background processing service with:
- PPT parsing jobs
- AI script generation
- Text-to-speech processing
- Video rendering pipeline
- Subtitle generation

### Packages

#### `packages/shared`
Shared utilities and types:
- Domain types and interfaces
- Validation schemas with Zod
- Pricing calculations
- API constants

### Database

#### `prisma/schema.prisma`
Core data models:
- Users and authentication
- Projects and slides
- Jobs and processing status
- Videos and metadata
- Payments and subscriptions

## 🔧 Development

### Scripts

- `bun run dev` - Start all services in development
- `bun run build` - Build all packages
- `bun run lint` - Lint all packages
- `bun run db:push` - Push database schema
- `bun run db:generate` - Generate Prisma client
- `bun run scripts/seed.ts` - Seed database with demo data
- `bun run scripts/cleanup.ts` - Clean up workspace

### Environment Variables

Key environment variables:

```env
# Database
DATABASE_URL="file:./dev.db"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# AI Services
OPENAI_API_KEY="your-openai-key"
ELEVENLABS_API_KEY="your-elevenlabs-key"

# Storage
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
S3_BUCKET_NAME="your-bucket"

# Payments
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

## 🔄 Processing Flow

1. **Upload**: User uploads PowerPoint presentation
2. **Parse**: Worker extracts slides and content
3. **Generate**: AI creates narration scripts for each slide
4. **Synthesize**: Text-to-speech converts scripts to audio
5. **Render**: FFmpeg creates final video with transitions
6. **Deliver**: Video is stored and user is notified

## 🧪 Testing

```bash
# Run tests
bun run test

# Run tests with coverage
bun run test:coverage

# Run E2E tests
bun run test:e2e
```

## 📈 Monitoring

The application includes:
- Job queue monitoring
- Processing progress tracking
- Error logging and retry mechanisms
- Performance metrics

## 🚀 Deployment

### Production Build

```bash
bun run build
docker-compose -f docker-compose.prod.yml up -d
```

### Environment-Specific Configs

- Development: SQLite + local Redis
- Staging: PostgreSQL + Redis Cloud
- Production: PostgreSQL + Redis Cluster

## 💰 Pricing

VideoShiksha operates on a credit-based system:

- **Free**: 10 credits/month, 720p videos
- **Basic**: $9.99/month, 100 credits, 1080p videos
- **Pro**: $29.99/month, 500 credits, 4K videos
- **Enterprise**: Custom pricing and features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact support@videoshiksha.com
- Check our documentation at docs.videoshiksha.com

---

Built with ❤️ for educators and content creators worldwide.