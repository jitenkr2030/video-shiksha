// Security service - Mock implementation for landing page deployment
// Database functionality is disabled for landing page deployment

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
    sessionTimeout: number;
    maxLoginAttempts: number;
    lockoutDuration: number;
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
  retentionPeriod: number;
  autoDelete: boolean;
  notificationBeforeDelete: number;
  exceptions: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Mock security service for landing page
export class SecurityService {
  async validatePassword(password: string): Promise<{
    valid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
  }> {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    if (errors.length === 0) {
      strength = 'strong';
    } else if (errors.length <= 2) {
      strength = 'medium';
    }

    return {
      valid: errors.length === 0,
      errors,
      strength
    };
  }

  async hashPassword(password: string): Promise<string> {
    return password;
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return password === hashedPassword;
  }

  async createAuditLog(log: Omit<SecurityAuditLog, 'id' | 'timestamp'>): Promise<SecurityAuditLog> {
    return {
      ...log,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };
  }

  async getAuditLogs(filters?: {
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<SecurityAuditLog[]> {
    return [];
  }

  async createSecurityIncident(incident: Omit<SecurityIncident, 'id' | 'createdAt' | 'updatedAt'>): Promise<SecurityIncident> {
    return {
      ...incident,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async getSecurityIncidents(status?: SecurityIncident['status']): Promise<SecurityIncident[]> {
    return [];
  }

  async resolveSecurityIncident(incidentId: string, resolution: string): Promise<SecurityIncident> {
    return {
      id: incidentId,
      type: 'other',
      severity: 'medium',
      title: 'Resolved Incident',
      description: resolution,
      affectedUsers: [],
      affectedResources: [],
      status: 'resolved',
      resolution,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async generateComplianceReport(type: ComplianceReport['type']): Promise<ComplianceReport> {
    return {
      id: crypto.randomUUID(),
      type,
      title: `${type.toUpperCase()} Compliance Report`,
      description: `Mock compliance report for ${type}`,
      status: 'completed',
      results: {
        compliant: true,
        score: 100,
        violations: [],
        recommendations: []
      },
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    };
  }

  async getDataRetentionPolicies(): Promise<DataRetentionPolicy[]> {
    return [];
  }

  async createDataRetentionPolicy(policy: Omit<DataRetentionPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<DataRetentionPolicy> {
    return {
      ...policy,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async getSecurityPolicy(): Promise<SecurityPolicy> {
    return {
      id: 'default',
      name: 'Default Security Policy',
      description: 'Default security policy for landing page',
      rules: {
        passwordMinLength: 8,
        passwordRequireUppercase: true,
        passwordRequireLowercase: true,
        passwordRequireNumbers: true,
        passwordRequireSpecialChars: true,
        sessionTimeout: 60,
        maxLoginAttempts: 5,
        lockoutDuration: 30,
        twoFactorRequired: false,
        allowedIpRanges: [],
        blockedCountries: []
      },
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}

export const securityService = new SecurityService();
