import { prisma } from '@/lib/db';
import { userManagementService } from './user-management.service';
import { storage } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  rules: {
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireLowercase: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireSpecialChars: boolean;
    sessionTimeout: number; // minutes
    maxLoginAttempts: number;
    lockoutDuration: number; // minutes
    twoFactorRequired: boolean;
    allowedIpRanges: string[];
    blockedCountries: string[];
  };
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityAuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

export interface SecurityIncident {
  id: string;
  type: 'unauthorized_access' | 'data_breach' | 'malware' | 'phishing' | 'ddos' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedUsers: string[];
  affectedResources: string[];
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  assignedTo?: string;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplianceReport {
  id: string;
  type: 'gdpr' | 'ccpa' | 'hipaa' | 'sox' | 'custom';
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  results: {
    compliant: boolean;
    score: number;
    violations: Array<{
      rule: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      recommendation: string;
    }>;
    recommendations: string[];
  };
  generatedAt: Date;
  expiresAt: Date;
}

export interface DataRetentionPolicy {
  id: string;
  dataType: string;
  retentionPeriod: number; // days
  autoDelete: boolean;
  notificationBeforeDelete: number; // days
  exceptions: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class SecurityService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 30; // minutes
  private readonly SESSION_TIMEOUT = 60; // minutes

  async validatePassword(password: string, userId?: string): Promise<{
    valid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
  }> {
    const errors: string[] = [];
    let strength: 'weak' | 'medium' | 'strong' = 'weak';

    // Get security policy
    const policy = await this.getActiveSecurityPolicy();
    const rules = policy?.rules || {
      passwordMinLength: 8,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumbers: true,
      passwordRequireSpecialChars: true
    };

    // Length validation
    if (password.length < rules.passwordMinLength) {
      errors.push(`Password must be at least ${rules.passwordMinLength} characters long`);
    }

    // Uppercase validation
    if (rules.passwordRequireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Lowercase validation
    if (rules.passwordRequireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Numbers validation
    if (rules.passwordRequireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Special characters validation
    if (rules.passwordRequireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Common passwords check
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common');
    }

    // Calculate strength
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    if (password.length >= 16) score++;

    if (score >= 6) strength = 'strong';
    else if (score >= 4) strength = 'medium';

    return {
      valid: errors.length === 0,
      errors,
      strength
    };
  }

  async recordLoginAttempt(
    email: string,
    success: boolean,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await prisma.securityAuditLog.create({
      data: {
        action: 'login_attempt',
        resource: 'authentication',
        details: { email },
        ipAddress,
        userAgent,
        success,
        riskLevel: success ? 'low' : 'medium',
        timestamp: new Date()
      }
    });

    if (!success) {
      await this.handleFailedLogin(email, ipAddress);
    }
  }

  private async handleFailedLogin(email: string, ipAddress: string): Promise<void> {
    const recentAttempts = await prisma.securityAuditLog.findMany({
      where: {
        action: 'login_attempt',
        success: false,
        details: { email },
        timestamp: {
          gte: new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
        }
      }
    });

    if (recentAttempts.length >= this.MAX_LOGIN_ATTEMPTS) {
      await this.lockoutUser(email, ipAddress);
      await this.recordSecurityIncident({
        type: 'unauthorized_access',
        severity: 'medium',
        title: 'Multiple failed login attempts',
        description: `Multiple failed login attempts detected for email: ${email}`,
        affectedUsers: [email],
        affectedResources: ['authentication'],
        ipAddress
      });
    }
  }

  private async lockoutUser(email: string, ipAddress: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lockedUntil: new Date(Date.now() + this.LOCKOUT_DURATION * 60 * 1000)
        }
      });
    }

    // Record lockout
    await prisma.securityAuditLog.create({
      data: {
        userId: user?.id,
        action: 'account_locked',
        resource: 'authentication',
        details: { email, reason: 'multiple_failed_attempts' },
        ipAddress,
        userAgent: 'system',
        success: true,
        riskLevel: 'high',
        timestamp: new Date()
      }
    });
  }

  async isUserLockedOut(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.lockedUntil) {
      return false;
    }

    return user.lockedUntil > new Date();
  }

  async validateSession(token: string, ipAddress: string, userAgent: string): Promise<{
    valid: boolean;
    userId?: string;
    reason?: string;
  }> {
    try {
      const decoded = await userManagementService.validateToken(token);
      if (!decoded) {
        return { valid: false, reason: 'invalid_token' };
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        return { valid: false, reason: 'user_not_found' };
      }

      if (user.lockedUntil && user.lockedUntil > new Date()) {
        return { valid: false, reason: 'account_locked' };
      }

      // Check session timeout
      const lastActivity = user.lastLoginAt;
      if (lastActivity) {
        const timeSinceLastActivity = Date.now() - lastActivity.getTime();
        if (timeSinceLastActivity > this.SESSION_TIMEOUT * 60 * 1000) {
          return { valid: false, reason: 'session_expired' };
        }
      }

      // Update last activity
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Record successful session validation
      await prisma.securityAuditLog.create({
        data: {
          userId: user.id,
          action: 'session_validated',
          resource: 'authentication',
          details: { token: token.substring(0, 10) + '...' },
          ipAddress,
          userAgent,
          success: true,
          riskLevel: 'low',
          timestamp: new Date()
        }
      });

      return { valid: true, userId: user.id };
    } catch (error) {
      return { valid: false, reason: 'validation_error' };
    }
  }

  async sanitizeFileName(fileName: string): Promise<string> {
    // Remove dangerous characters
    const sanitized = fileName
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\.\./g, '_')
      .replace(/^\./, '_')
      .toLowerCase();

    // Limit length
    return sanitized.substring(0, 255);
  }

  async validateFileUpload(file: File, userId: string): Promise<{
    valid: boolean;
    errors: string[];
    riskLevel: 'low' | 'medium' | 'high';
  }> {
    const errors: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // File type validation
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/gif'
    ];

    if (!allowedTypes.includes(file.type)) {
      errors.push('File type not allowed');
      riskLevel = 'high';
    }

    // File size validation
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      errors.push('File size exceeds limit');
      riskLevel = 'medium';
    }

    // File name validation
    const sanitizedName = await this.sanitizeFileName(file.name);
    if (sanitizedName !== file.name.toLowerCase()) {
      errors.push('File name contains invalid characters');
      riskLevel = 'medium';
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\.(exe|bat|cmd|scr|pif|com)$/i,
      /(virus|malware|trojan|backdoor|exploit)/i,
      /(admin|root|password|secret)/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(file.name)) {
        errors.push('Suspicious file name detected');
        riskLevel = 'high';
        break;
      }
    }

    // Record file upload attempt
    await prisma.securityAuditLog.create({
      data: {
        userId,
        action: 'file_upload',
        resource: 'storage',
        details: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        },
        ipAddress: 'unknown', // Would be passed from request
        userAgent: 'unknown', // Would be passed from request
        success: errors.length === 0,
        riskLevel,
        timestamp: new Date()
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      riskLevel
    };
  }

  async encryptSensitiveData(data: string): Promise<string> {
    const algorithm = 'aes-256-gcm';
    const secretKey = process.env.ENCRYPTION_KEY || 'default-secret-key-change-in-production';
    const key = crypto.scryptSync(secretKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  async decryptSensitiveData(encryptedData: string): Promise<string> {
    const algorithm = 'aes-256-gcm';
    const secretKey = process.env.ENCRYPTION_KEY || 'default-secret-key-change-in-production';
    const key = crypto.scryptSync(secretKey, 'salt', 32);
    
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipher(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  async generateDataExportRequest(userId: string, format: 'json' | 'csv' | 'pdf'): Promise<string> {
    const requestId = uuidv4();
    
    await prisma.dataExportRequest.create({
      data: {
        id: requestId,
        userId,
        format,
        status: 'pending',
        createdAt: new Date()
      }
    });

    // Record data export request
    await prisma.securityAuditLog.create({
      data: {
        userId,
        action: 'data_export_request',
        resource: 'user_data',
        details: { format, requestId },
        ipAddress: 'unknown',
        userAgent: 'unknown',
        success: true,
        riskLevel: 'low',
        timestamp: new Date()
      }
    });

    return requestId;
  }

  async processUserDataDeletion(userId: string, reason: string): Promise<void> {
    // Record deletion request
    await prisma.securityAuditLog.create({
      data: {
        userId,
        action: 'data_deletion_request',
        resource: 'user_data',
        details: { reason },
        ipAddress: 'unknown',
        userAgent: 'unknown',
        success: true,
        riskLevel: 'high',
        timestamp: new Date()
      }
    });

    // Anonymize user data instead of hard deletion for compliance
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted_${userId}@deleted.com`,
        name: 'Deleted User',
        avatar: null,
        phone: null,
        bio: null,
        website: null,
        socialLinks: null,
        deletedAt: new Date()
      }
    });

    // Delete sensitive data
    await prisma.refreshToken.deleteMany({
      where: { userId }
    });

    await prisma.verificationToken.deleteMany({
      where: { userId }
    });
  }

  async recordSecurityIncident(incidentData: Omit<SecurityIncident, 'id' | 'createdAt' | 'updatedAt'>): Promise<SecurityIncident> {
    const incident = await prisma.securityIncident.create({
      data: {
        ...incidentData,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Log the incident
    await prisma.securityAuditLog.create({
      data: {
        action: 'security_incident',
        resource: 'system',
        details: {
          incidentId: incident.id,
          type: incident.type,
          severity: incident.severity
        },
        ipAddress: 'system',
        userAgent: 'system',
        success: false,
        riskLevel: incident.severity,
        timestamp: new Date()
      }
    });

    return incident;
  }

  async getSecurityAuditLogs(filters: {
    userId?: string;
    action?: string;
    riskLevel?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<SecurityAuditLog[]> {
    const where: any = {};
    
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.riskLevel) where.riskLevel = filters.riskLevel;
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    return await prisma.securityAuditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 1000
    });
  }

  async getActiveSecurityPolicy(): Promise<SecurityPolicy | null> {
    return await prisma.securityPolicy.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateSecurityPolicy(policyData: Omit<SecurityPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<SecurityPolicy> {
    // Deactivate existing policies
    await prisma.securityPolicy.updateMany({
      where: { active: true },
      data: { active: false, updatedAt: new Date() }
    });

    // Create new policy
    return await prisma.securityPolicy.create({
      data: {
        ...policyData,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  async generateComplianceReport(type: ComplianceReport['type']): Promise<ComplianceReport> {
    const reportId = uuidv4();
    
    // Perform compliance checks based on type
    const violations = await this.performComplianceChecks(type);
    const score = Math.max(0, 100 - violations.length * 10);
    
    const report = await prisma.complianceReport.create({
      data: {
        id: reportId,
        type,
        title: `${type.toUpperCase()} Compliance Report`,
        description: `Compliance assessment for ${type.toUpperCase()} regulations`,
        status: 'completed',
        results: {
          compliant: violations.length === 0,
          score,
          violations,
          recommendations: this.generateRecommendations(violations)
        },
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });

    return report;
  }

  private async performComplianceChecks(type: ComplianceReport['type']): Promise<ComplianceReport['results']['violations']> {
    const violations: ComplianceReport['results']['violations'] = [];

    // GDPR checks
    if (type === 'gdpr') {
      // Check if data retention policies are in place
      const retentionPolicies = await prisma.dataRetentionPolicy.findMany({
        where: { active: true }
      });

      if (retentionPolicies.length === 0) {
        violations.push({
          rule: 'Data Retention',
          description: 'No data retention policies found',
          severity: 'high',
          recommendation: 'Implement data retention policies for all user data types'
        });
      }

      // Check if consent mechanisms are in place
      const usersWithoutConsent = await prisma.user.count({
        where: {
          privacyConsent: null
        }
      });

      if (usersWithoutConsent > 0) {
        violations.push({
          rule: 'User Consent',
          description: 'Users found without privacy consent',
          severity: 'medium',
          recommendation: 'Implement privacy consent collection for all users'
        });
      }
    }

    // Add more compliance checks for other regulations

    return violations;
  }

  private generateRecommendations(violations: ComplianceReport['results']['violations']): string[] {
    return violations.map(violation => violation.recommendation);
  }

  async detectAnomalousActivity(userId: string): Promise<{
    anomalous: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    reasons: string[];
  }> {
    const recentActivity = await prisma.securityAuditLog.findMany({
      where: {
        userId,
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    const reasons: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Check for unusual login patterns
    const loginAttempts = recentActivity.filter(log => log.action === 'login_attempt');
    const failedLogins = loginAttempts.filter(log => !log.success);
    
    if (failedLogins.length > 3) {
      reasons.push('Multiple failed login attempts');
      riskLevel = 'medium';
    }

    // Check for unusual file upload activity
    const fileUploads = recentActivity.filter(log => log.action === 'file_upload');
    if (fileUploads.length > 10) {
      reasons.push('Unusual file upload activity');
      riskLevel = 'medium';
    }

    // Check for access from unusual locations
    const uniqueIPs = new Set(recentActivity.map(log => log.ipAddress));
    if (uniqueIPs.size > 3) {
      reasons.push('Access from multiple IP addresses');
      riskLevel = 'low';
    }

    // Check for data export requests
    const exportRequests = recentActivity.filter(log => log.action === 'data_export_request');
    if (exportRequests.length > 0) {
      reasons.push('Data export request detected');
      riskLevel = 'medium';
    }

    return {
      anomalous: reasons.length > 0,
      riskLevel,
      reasons
    };
  }

  async scanFileForMalware(fileBuffer: Buffer, fileName: string): Promise<{
    clean: boolean;
    threats: string[];
    riskLevel: 'low' | 'medium' | 'high';
  }> {
    // This would integrate with a malware scanning service
    // For now, implement basic checks
    
    const threats: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Check for executable file signatures
    const executableSignatures = [
      Buffer.from([0x4D, 0x5A]), // PE executable
      Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF executable
      Buffer.from([0xFE, 0xED, 0xFA, 0xCE]), // Mach-O executable
    ];

    for (const signature of executableSignatures) {
      if (fileBuffer.subarray(0, signature.length).equals(signature)) {
        threats.push('Executable file detected');
        riskLevel = 'high';
        break;
      }
    }

    // Check for suspicious content
    const content = fileBuffer.toString('utf8', 0, Math.min(1024, fileBuffer.length));
    const suspiciousPatterns = [
      /eval\s*\(/gi,
      /document\.write/gi,
      /javascript:/gi,
      /<script/gi
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        threats.push('Suspicious script content detected');
        riskLevel = 'medium';
        break;
      }
    }

    return {
      clean: threats.length === 0,
      threats,
      riskLevel
    };
  }
}

export const securityService = new SecurityService();