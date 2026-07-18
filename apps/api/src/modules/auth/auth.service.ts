import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import { PrismaService } from '@contract-ai/database';
import {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  UserInfoDto,
  MfaSetupDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCK_DURATION_MINUTES = 30;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  /**
   * Register a new user
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Verify organization exists, create if not
    let organization = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
    });

    if (!organization) {
      // Create default organization
      organization = await this.prisma.organization.create({
        data: {
          id: dto.organizationId,
          name: 'My Organization',
          description: 'Default organization',
        },
      });
      this.logger.log(`Created default organization: ${organization.name}`);
    }

    // Hash password
    const hashedPassword = await this.hashPassword(dto.password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        hashedPassword,
        organizationId: dto.organizationId,
        role: dto.role || 'LAWYER',
        teamId: dto.teamId,
        emailVerified: null, // Should be verified via email
      },
      include: {
        organization: true,
      },
    });

    this.logger.log(`New user registered: ${user.email}`);

    // Generate tokens
    return this.generateAuthResponse(user);
  }

  /**
   * Login user with email and password
   */
  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponseDto> {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { organization: true },
    });

    if (!user || !user.hashedPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      throw new UnauthorizedException(
        `Account is locked. Try again after ${user.accountLockedUntil.toISOString()}`
      );
    }

    // Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.hashedPassword);

    if (!isPasswordValid) {
      await this.handleFailedLogin(user.id);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check MFA
    if (user.mfaEnabled && !dto.mfaCode) {
      throw new UnauthorizedException('MFA code required');
    }

    if (user.mfaEnabled && dto.mfaCode) {
      if (!user.mfaSecret) {
        throw new UnauthorizedException('MFA not properly set up');
      }
      const isMfaValid = authenticator.verify({
        token: dto.mfaCode,
        secret: user.mfaSecret,
      });

      if (!isMfaValid) {
        throw new UnauthorizedException('Invalid MFA code');
      }
    }

    // Reset failed login attempts
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        accountLockedUntil: null,
        lastLogin: new Date(),
      },
    });

    this.logger.log(`User logged in: ${user.email}`);

    // Generate tokens
    return this.generateAuthResponse(user, ipAddress, userAgent, dto.rememberMe);
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string, ipAddress?: string): Promise<AuthResponseDto> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      // Check if refresh token exists and is not revoked
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: { include: { organization: true } } },
      });

      if (!storedToken || storedToken.isRevoked) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token expired');
      }

      // Generate new tokens
      const authResponse = await this.generateAuthResponse(storedToken.user, ipAddress);

      // Revoke old refresh token
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { isRevoked: true },
      });

      return authResponse;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout user and revoke tokens
   */
  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, token: refreshToken },
        data: { isRevoked: true },
      });
    } else {
      // Revoke all refresh tokens
      await this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
      });
    }

    this.logger.log(`User logged out: ${userId}`);
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.hashedPassword) {
      throw new BadRequestException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.hashedPassword);

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(dto.newPassword);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        hashedPassword,
        passwordChangedAt: new Date(),
      },
    });

    // Revoke all refresh tokens (force re-login)
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });

    this.logger.log(`Password changed for user: ${userId}`);
  }

  /**
   * Request password reset
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      // Don't reveal if user exists
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save hashed token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: new Date(Date.now() + 3600000), // 1 hour
      },
    });

    // TODO: Send email with reset link
    // await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    this.logger.log(`Password reset requested for: ${user.email}`);
  }

  /**
   * Reset password with token
   */
  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(dto.token).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { gte: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(dto.newPassword);

    // Update password and clear reset token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        passwordChangedAt: new Date(),
      },
    });

    // Revoke all refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { isRevoked: true },
    });

    this.logger.log(`Password reset completed for: ${user.email}`);
  }

  /**
   * Setup MFA for user
   */
  async setupMfa(userId: string): Promise<MfaSetupDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Generate secret
    const secret = authenticator.generateSecret();

    // Generate QR code
    const otpauth = authenticator.keyuri(user.email, 'Contract AI', secret);
    const qrCode = await qrcode.toDataURL(otpauth);

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Store encrypted backup codes (temporary until user verifies)
    const hashedBackupCodes = await Promise.all(backupCodes.map((code) => this.hashPassword(code)));

    // Temporarily store secret (will be confirmed after verification)
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaSecret: secret,
        backupCodes: hashedBackupCodes,
      },
    });

    return {
      secret,
      qrCode,
      backupCodes,
    };
  }

  /**
   * Enable MFA after verification
   */
  async enableMfa(userId: string, verificationCode: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.mfaSecret) {
      throw new BadRequestException('MFA setup not initiated');
    }

    // Verify code
    const isValid = authenticator.verify({
      token: verificationCode,
      secret: user.mfaSecret,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    // Enable MFA
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    this.logger.log(`MFA enabled for user: ${userId}`);
  }

  /**
   * Disable MFA
   */
  async disableMfa(userId: string, verificationCode: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      throw new BadRequestException('MFA is not enabled');
    }

    // Verify code
    const isValid = authenticator.verify({
      token: verificationCode,
      secret: user.mfaSecret,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    // Disable MFA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        backupCodes: [],
      },
    });

    this.logger.log(`MFA disabled for user: ${userId}`);
  }

  /**
   * Get user permissions based on role
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return [];
    }

    // Fetch role permissions from database
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { role: user.role },
      include: { permission: true },
    });

    return rolePermissions.map((rp) => `${rp.permission.resource}:${rp.permission.action}`);
  }

  /**
   * Generate auth response with tokens
   */
  private async generateAuthResponse(
    user: any,
    ipAddress?: string,
    userAgent?: string,
    rememberMe = false
  ): Promise<AuthResponseDto> {
    const permissions = await this.getUserPermissions(user.id);

    // Generate access token
    const accessTokenExpiry = this.configService.get('jwt.expiresIn', '15m');
    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        permissions,
      },
      {
        secret: this.configService.get('jwt.secret'),
        expiresIn: accessTokenExpiry,
      }
    );

    // Generate refresh token
    const refreshTokenExpiry = rememberMe
      ? '30d'
      : this.configService.get('jwt.refreshExpiresIn', '7d');
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: refreshTokenExpiry,
      }
    );

    // Store refresh token
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        deviceInfo: userAgent,
        ipAddress,
        expiresAt: new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000),
      },
    });

    const userInfo: UserInfoDto = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      organizationId: user.organizationId,
      teamId: user.teamId,
      mfaEnabled: user.mfaEnabled,
      permissions,
    };

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      tokenType: 'Bearer',
      user: userInfo,
    };
  }

  /**
   * Hash password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  /**
   * Handle failed login attempt
   */
  private async handleFailedLogin(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return;

    const attempts = user.failedLoginAttempts + 1;

    if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
      // Lock account
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: attempts,
          accountLockedUntil: new Date(Date.now() + this.LOCK_DURATION_MINUTES * 60 * 1000),
        },
      });

      this.logger.warn(`Account locked due to failed attempts: ${user.email}`);
    } else {
      await this.prisma.user.update({
        where: { id: userId },
        data: { failedLoginAttempts: attempts },
      });
    }
  }
}
