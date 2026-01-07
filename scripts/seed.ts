#!/usr/bin/env bun

import { PrismaClient } from '@prisma/client';
import { SubscriptionPlan } from '@videoshiksha/shared';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@videoshiksha.com' },
    update: {},
    create: {
      email: 'demo@videoshiksha.com',
      name: 'Demo User',
      credits: 100,
      plan: SubscriptionPlan.PRO,
    },
  });

  console.log('✅ Created demo user:', demoUser.email);

  // Create a demo project
  const demoProject = await prisma.project.create({
    data: {
      userId: demoUser.id,
      title: 'Demo Presentation',
      description: 'A sample project to demonstrate VideoShiksha capabilities',
      status: 'DRAFT',
      settings: {
        voice: {
          provider: 'openai',
          voice: 'alloy',
          speed: 1.0,
          pitch: 1.0,
          language: 'en',
        },
        video: {
          resolution: 'FULL_HD_1080',
          format: 'MP4',
          quality: 'medium',
          transitionDuration: 1.0,
        },
        subtitles: {
          enabled: true,
          language: 'en',
          position: 'bottom',
          fontSize: 16,
          color: '#FFFFFF',
        },
      },
    },
  });

  console.log('✅ Created demo project:', demoProject.title);

  // Create demo slides
  const slides = [
    {
      order: 1,
      title: 'Welcome to VideoShiksha',
      content: 'Transform your presentations into engaging videos with AI-powered narration.',
    },
    {
      order: 2,
      title: 'Key Features',
      content: 'AI script generation, natural voice synthesis, and professional video rendering.',
    },
    {
      order: 3,
      title: 'Get Started',
      content: 'Upload your PowerPoint presentation and let our AI do the magic!',
    },
  ];

  for (const slideData of slides) {
    const slide = await prisma.slide.create({
      data: {
        projectId: demoProject.id,
        ...slideData,
      },
    });

    // Create script for each slide
    await prisma.script.create({
      data: {
        slideId: slide.id,
        content: slideData.content,
        voiceSettings: {
          provider: 'openai',
          voice: 'alloy',
          speed: 1.0,
          pitch: 1.0,
          language: 'en',
        },
      },
    });
  }

  console.log('✅ Created demo slides with scripts');

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });