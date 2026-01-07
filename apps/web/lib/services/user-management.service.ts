import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { storage } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'student' | 'teacher' | 'admin';
  plan: 'free' | 'starter' | 'creator' | 'enterprise';
  credits: number;
  emailVerified: boolean;
  phone?: string;
  bio?: string;
  website?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    youtube?: string;
    instagram?: string;
  };
  preferences: {
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
      marketing: boolean;
    };
    privacy: {
      profileVisibility: 'public' | 'private' | 'unlisted';
      showEmail: boolean;
      showPhone: boolean;
    };
  };
  subscription?: {
    id: string;
    planId: string;
    status: 'active' | 'cancelled' | 'expired' | 'pending';
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
  };
  usage: {
    videosCreated: number;
    storageUsed: number;
    bandwidthUsed: number;
    apiCalls: number;
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role?: 'student' | 'teacher' | 'admin';
  phone?: string;
  referralCode?: string;
}

export interface UpdateUserRequest {
  name?: string;
  avatar?: File;
  bio?: string;
  website?: string;
  phone?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    youtube?: string;
    instagram?: string;
  };
  preferences?: {
    language?: string;
    timezone?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
      marketing?: boolean;
    };
    privacy?: {
      profileVisibility?: 'public' | 'private' | 'unlisted';
      showEmail?: boolean;
      showPhone?: boolean;
    };
  };
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export class UserManagementService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret';
  private readonly JWT_EXPIRES_IN = '1h';
  private readonly REFRESH_TOKEN_EXPIRES_IN = '7d';

  async createUser(userData: CreateUserRequest): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Generate referral code
    const userReferralCode = this.generateReferralCode();

    // Process referral if provided
    let credits = 10; // Default credits for new users
    if (userData.referralCode) {
      const referrer = await prisma.user.findFirst({
        where: { referralCode: userData.referralCode }
      });

      if (referrer) {
        credits = 20; // Bonus credits for using referral
        await prisma.user.update({
          where: { id: referrer.id },
          data: { credits: { increment: 5 } }
        });
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role || 'student',
        plan: 'free',
        credits,
        referralCode: userReferralCode,
        emailVerified: false,
        preferences: {
          language: 'en',
          timezone: 'UTC',
          notifications: {
            email: true,
            push: true,
            marketing: false
          },
          privacy: {
            profileVisibility: 'public',
            showEmail: false,
            showPhone: false
          }
        },
        usage: {
          videosCreated: 0,
          storageUsed: 0,
          bandwidthUsed: 0,
          apiCalls: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Generate tokens
    const token = this.generateToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    // Save refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    // Send verification email
    await this.sendVerificationEmail(user.email, user.id);

    // Return user data without password
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
      refreshToken,
      expiresIn: 3600 // 1 hour
    };
  }

  async loginUser(loginData: LoginRequest): Promise<AuthResponse> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: loginData.email }
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate tokens
    const token = this.generateToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    // Save refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    // Return user data without password
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
      refreshToken,
      expiresIn: 3600 // 1 hour
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    // Find refresh token
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token');
    }

    // Generate new tokens
    const token = this.generateToken(tokenRecord.userId);
    const newRefreshToken = this.generateRefreshToken(tokenRecord.userId);

    // Update refresh token
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: {
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    // Return user data without password
    const { password, ...userWithoutPassword } = tokenRecord.user;

    return {
      user: userWithoutPassword,
      token,
      refreshToken: newRefreshToken,
      expiresIn: 3600 // 1 hour
    };
  }

  async logoutUser(refreshToken: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken }
    });
  }

  async getUserById(userId: string): Promise<Omit<User, 'password'> | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) return null;

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUser(userId: string, updateData: UpdateUserRequest): Promise<Omit<User, 'password'>> {
    // Handle avatar upload
    let avatarUrl;
    if (updateData.avatar) {
      const buffer = Buffer.from(await updateData.avatar.arrayBuffer());
      avatarUrl = await storage.uploadFile(
        buffer,
        `avatars/${userId}/${uuidv4()}.${updateData.avatar.name.split('.').pop()}`,
        updateData.avatar.type
      );
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(updateData.name && { name: updateData.name }),
        ...(avatarUrl && { avatar: avatarUrl }),
        ...(updateData.bio && { bio: updateData.bio }),
        ...(updateData.website && { website: updateData.website }),
        ...(updateData.phone && { phone: updateData.phone }),
        ...(updateData.socialLinks && { socialLinks: updateData.socialLinks }),
        ...(updateData.preferences && { 
          preferences: {
            ...updateData.preferences
          }
        }),
        updatedAt: new Date()
      }
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedNewPassword,
        updatedAt: new Date()
      }
    });

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { userId }
    });
  }

  async deleteUser(userId: string): Promise<void> {
    // Delete user's refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { userId }
    });

    // Delete user
    await prisma.user.delete({
      where: { id: userId }
    });
  }

  async verifyEmail(token: string): Promise<void> {
    // Find verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token }
    });

    if (!verificationToken || verificationToken.expiresAt < new Date()) {
      throw new Error('Invalid or expired verification token');
    }

    // Update user email verification
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true }
    });

    // Delete verification token
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id }
    });
  }

  async sendVerificationEmail(email: string, userId: string): Promise<void> {
    const token = uuidv4();
    
    await prisma.verificationToken.create({
      data: {
        token,
        userId,
        type: 'email_verification',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    });

    // Send email (this would integrate with an email service)
    console.log(`Verification email sent to ${email} with token: ${token}`);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal that user doesn't exist
      return;
    }

    const token = uuidv4();
    
    await prisma.verificationToken.create({
      data: {
        token,
        userId: user.id,
        type: 'password_reset',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      }
    });

    // Send password reset email
    console.log(`Password reset email sent to ${email} with token: ${token}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetToken = await prisma.verificationToken.findUnique({
      where: { token }
    });

    if (!resetToken || resetToken.expiresAt < new Date() || resetToken.type !== 'password_reset') {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { 
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    // Delete reset token
    await prisma.verificationToken.delete({
      where: { id: resetToken.id }
    });

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { userId: resetToken.userId }
    });
  }

  async getUsersByRole(role: 'student' | 'teacher' | 'admin'): Promise<Omit<User, 'password'>[]> {
    const users = await prisma.user.findMany({
      where: { role },
      orderBy: { createdAt: 'desc' }
    });

    return users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  async updateUserRole(userId: string, role: 'student' | 'teacher' | 'admin'): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { 
        role,
        updatedAt: new Date()
      }
    });
  }

  async updateUserPlan(userId: string, plan: 'free' | 'starter' | 'creator' | 'enterprise'): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { 
        plan,
        updatedAt: new Date()
      }
    });
  }

  async addCredits(userId: string, amount: number, reason?: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { 
        credits: { increment: amount },
        updatedAt: new Date()
      }
    });

    // Log credit transaction
    await prisma.creditTransaction.create({
      data: {
        userId,
        amount,
        type: amount > 0 ? 'credit' : 'debit',
        reason: reason || (amount > 0 ? 'Credit added' : 'Credit used'),
        createdAt: new Date()
      }
    });
  }

  async getUserUsageStats(userId: string): Promise<{
    videosCreated: number;
    storageUsed: number;
    bandwidthUsed: number;
    apiCalls: number;
    creditsUsed: number;
    creditsRemaining: number;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        creditTransactions: {
          where: { type: 'debit' },
          select: { amount: true }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const creditsUsed = user.creditTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

    return {
      videosCreated: user.usage.videosCreated,
      storageUsed: user.usage.storageUsed,
      bandwidthUsed: user.usage.bandwidthUsed,
      apiCalls: user.usage.apiCalls,
      creditsUsed,
      creditsRemaining: user.credits
    };
  }

  private generateToken(userId: string): string {
    return jwt.sign({ userId }, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN });
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, this.REFRESH_TOKEN_SECRET, { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN });
  }

  private generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async validateToken(token: string): Promise<{ userId: string } | null> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: string };
      return decoded;
    } catch (error) {
      return null;
    }
  }

  async searchUsers(query: string, role?: string): Promise<Omit<User, 'password'>[]> {
    const where: any = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } }
      ]
    };

    if (role) {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { name: 'asc' },
      take: 20
    });

    return users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }
}

export const userManagementService = new UserManagementService();