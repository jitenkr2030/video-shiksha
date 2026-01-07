#!/usr/bin/env bun

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 Cleaning up workspace...');

  // Clean up database
  console.log('🗄️  Cleaning database...');
  await prisma.payment.deleteMany();
  await prisma.job.deleteMany();
  await prisma.video.deleteMany();
  await prisma.script.deleteMany();
  await prisma.slide.deleteMany();
  await prisma.project.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.verificationToken.deleteMany();

  // Clean up upload directories
  const uploadDirs = ['uploads', 'temp', 'dist'];
  
  for (const dir of uploadDirs) {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      console.log(`📁 Removing directory: ${dir}`);
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  }

  // Clean up build artifacts
  const buildDirs = [
    'apps/web/.next',
    'apps/web/dist',
    'apps/worker/dist',
    'packages/*/dist'
  ];

  for (const pattern of buildDirs) {
    const dirs = pattern.includes('*') 
      ? fs.readdirSync(path.dirname(pattern)).map(f => path.join(path.dirname(pattern), f, path.basename(pattern)))
      : [pattern];

    for (const dir of dirs) {
      if (fs.existsSync(dir)) {
        console.log(`🏗️  Removing build directory: ${dir}`);
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
  }

  // Clean up logs
  const logFiles = ['*.log', 'logs/*.log'];
  for (const pattern of logFiles) {
    // Simple glob implementation for cleanup
    try {
      const files = fs.readdirSync(path.dirname(pattern) || '.');
      for (const file of files) {
        if (file.endsWith('.log')) {
          fs.unlinkSync(file);
          console.log(`📋 Removing log file: ${file}`);
        }
      }
    } catch (error) {
      // Ignore errors for non-existent directories
    }
  }

  console.log('✨ Workspace cleanup completed!');
}

cleanup()
  .catch((e) => {
    console.error('❌ Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });