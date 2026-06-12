import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { generateSecret, generate, verify, generateURI } from 'otplib';
import { HashPasswordService } from '../hash-password/hash-password.service';
import { UsersService } from '../users/users.service';
import { Logger } from 'winston';

@Injectable()
export class TwoFactorAuthService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly usersService: UsersService,
    private readonly hashPasswordService: HashPasswordService,
  ) {}
  // ================= SETUP 2FA =================
  // Generates a secret and QR code for the user to scan
  async setup(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    // Prevent overwriting an existing active 2FA setup
    if (user.twoFactorAuth) {
      throw new ConflictException(
        'Two-factor authentication is already enabled',
      );
    }

    // Generate new secret and OTPAuth URI
    const secret = generateSecret();
    const uri = generateURI({
      issuer: 'Authentication System',
      label: user.email,
      secret,
    });

    // Generate QR code as base64 data URL for frontend display
    const qrCode = await QRCode.toDataURL(uri, {
      margin: 1,
      scale: 2,
      width: 400,
    });

    // Save secret — 2FA not active until user verifies with a code
    await this.usersService.update(user.id, {
      twoFactorAuthSecret: secret,
      updatedAt: new Date(),
    });

    this.logger.info(`2FA setup initiated for user ${user.email}`);

    return {
      message: 'Scan the QR code with your authenticator app, then verify',
      qrCode,
    };
  }

  // ================= VERIFY AND ENABLE 2FA =================
  // User submits first TOTP code to confirm they scanned the QR code
  async verifyAndEnable(userId: string, code: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    // Already enabled — nothing to do
    if (user.twoFactorAuth) {
      throw new ConflictException(
        'Two-factor authentication is already enabled',
      );
    }

    // No secret found — setup not initiated
    if (!user.twoFactorAuthSecret) {
      throw new BadRequestException(
        'Two-factor authentication setup not found. Please initiate setup first.',
      );
    }

    // Verify the TOTP code against the saved secret
    const result = await verify({
      secret: user.twoFactorAuthSecret,
      token: code,
    });

    if (!result.valid) {
      throw new BadRequestException('Invalid verification code');
    }

    // Generate backup codes for account recovery (one-time use)
    const backupCodes = this.generateBackupCodes();

    // Store hashed backup codes 
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => this.hashPasswordService.hashPassword(code)),
    );

    // Activate 2FA and save backup codes
    await this.usersService.update(user.id, {
      twoFactorAuth: true,
      twoFactorAuthSecret: user.twoFactorAuthSecret,
      twoFactorAuthBackupCodes: hashedBackupCodes,
      updatedAt: new Date(),
    });

    this.logger.info(`2FA enabled for user ${user.email}`);

    return {
      message: 'Two-factor authentication enabled successfully',
      backupCodes,
      warning:
        'Save these backup codes securely. They will not be shown again.',
    };
  }

  // ================= VERIFY TOTP DURING LOGIN =================
  // Called from AuthService.login when 2FA is enabled
  async verifyLoginCode(userId: string, code: string): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.twoFactorAuthSecret) {
      return false;
    }

    const result = await verify({
      secret: user.twoFactorAuthSecret,
      token: code,
    });

    return result.valid;
  }

  // ================= VERIFY BACKUP CODE =================
  // Used when user loses access to authenticator app
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.twoFactorAuthBackupCodes?.length) {
      return false;
    }

    // Find a matching backup code (hashed comparison)
    const codes = user.twoFactorAuthBackupCodes as string[];
    for (let i = 0; i < codes.length; i++) {
      const isMatch = await this.hashPasswordService.verifyPassword(
        code,
        codes[i],
      );
      if (isMatch) {
        // Remove used backup code to prevent reuse
        const remainingCodes = codes.filter((_, idx) => idx !== i);
        await this.usersService.update(user.id, {
          twoFactorAuthBackupCodes:
            remainingCodes.length > 0 ? remainingCodes : null,
          updatedAt: new Date(),
        });
        this.logger.info(`Backup code used for user ${user.email}`);
        return true;
      }
    }

    return false;
  }

  // ================= DISABLE 2FA =================
  // Requires password verification for security
  async disable(userId: string, password: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }

    if (!user.twoFactorAuth) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    // Verify password before allowing disable — prevents attacker from disabling 2FA
    const isPasswordCorrect = await this.hashPasswordService.verifyPassword(
      password,
      user.password,
    );
    if (!isPasswordCorrect) {
      throw new BadRequestException('Invalid password');
    }

    // Clear all 2FA data
    await this.usersService.update(user.id, {
      twoFactorAuth: false,
      twoFactorAuthSecret: null,
      twoFactorAuthBackupCodes: null,
      updatedAt: new Date(),
    });

    this.logger.info(`2FA disabled for user ${user.email}`);

    return {
      message: 'Two-factor authentication disabled successfully',
    };
  }

  // ================= GENERATE BACKUP CODES =================
  // Private helper — generates 10 random 8-character codes
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      // 8 characters, alphanumeric, uppercase for readability
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }
}
