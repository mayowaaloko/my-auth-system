import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { UsersService } from 'src/users/users.service';
import { Logger } from 'winston';
import { RegisterDto } from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';
import { HashPasswordService } from 'src/hash-password/hash-password.service';
import * as crypto from 'crypto';
import { EmailService } from 'src/email/email.service';
import { RefreshTokenService } from 'src/refresh-token/refresh-token.service';
import { LoginDto } from './dto/login.dto';
import { generateSecret, generate, verify, generateURI } from 'otplib';
type JwtPayloadUser = {
  id: string;
  email: string;
  role: string;
};
@Injectable()
export class AuthService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly hashPasswordService: HashPasswordService,
    private readonly emailService: EmailService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}
  // ================= REGISTER =================
  async register(dto: RegisterDto) {
    //check if the user already exits
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      this.logger.error(`User with email ${dto.email} already exists`);
      throw new ConflictException(
        'An email has been sent if your account exists',
      );
    }

    // hash the password
    const hashPassword = await this.hashPasswordService.hashPassword(
      dto.password,
    );

    //create verification tokens
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const hashedEmailToken = crypto
      .createHash('sha256')
      .update(emailVerificationToken)
      .digest('hex');
    const emailVerificationTokenExpiresAt = new Date(
      Date.now() + 15 * 60 * 1000,
    );

    // create a new user
    const user = await this.usersService.create({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      password: hashPassword,
      emailVerificationToken: hashedEmailToken,
      emailVerificationTokenExpiresAt,
    });
    this.logger.info(`User with email ${dto.email} has been created`);
    // send verification email
    await this.emailService.sendVerificationEmail(
      dto.email,
      emailVerificationToken,
    );
    this.logger.info(`Verification email sent to user with email ${dto.email}`);

    //generate tokens
    const tokens = await this.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    return {
      message:
        'Registration successful. Please check your email for verification instructions.',
      user: {
        id: user.id,
        email: user.email,
        name: user.firstName + ' ' + user.lastName,
        isVerified: user.isEmailVerified,
        role: user.role,
      },
      ...tokens,
    };
  }

  async verifyEmail(token: string) {
    //check if the token is valid
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    //check if the user exists
    const user =
      await this.usersService.findByEmailVerificationToken(hashedToken);
    if (!user || !user.emailVerificationTokenExpiresAt) {
      this.logger.error('Invalid or expired verification token');
      throw new BadRequestException(
        'Please initiate the registration process again',
      );
    }
    if (new Date(user.emailVerificationTokenExpiresAt) < new Date()) {
      throw new BadRequestException('Please request a new verification email.');
    }
    await this.usersService.update(user.id, {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpiresAt: null,
      updatedAt: new Date(),
    });

    const tokens = await this.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    return {
      message: 'Email verification successful',
      user: {
        id: user.id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        role: user.role,
      },
      ...tokens,
    };
  }
  async resendEmailVerification(email: string) {
    //check if the user exists
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    //check if the user is verified
    if (user.isEmailVerified) {
      throw new BadRequestException(
        'Your account is already verified. Please log in.',
      );
    }
    //generate and send new verification email
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const hashedEmailToken = crypto
      .createHash('sha256')
      .update(emailVerificationToken)
      .digest('hex');
    const emailVerificationTokenExpiresAt = new Date(
      Date.now() + 15 * 60 * 1000,
    );

    await this.usersService.update(user.id, {
      emailVerificationToken: hashedEmailToken,
      emailVerificationTokenExpiresAt,
      updatedAt: new Date(),
    });
    await this.emailService.sendVerificationEmail(
      email,
      emailVerificationToken,
    );
    return { message: 'Verification email sent successfully.' };
  }

  async login(dto: LoginDto) {
    //check if user exists
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }
    //check if account is locked
    if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
      const minutesLeft = Math.ceil(
        (user.lockUntil.getTime() - Date.now()) / 1000 / 60,
      );
      throw new BadRequestException(
        `Account locked. Try again in ${minutesLeft} minutes.`,
      );
    }

    //check if password is correct
    const isPasswordCorrect = await this.hashPasswordService.verifyPassword(
      dto.password,
      user.password,
    );
    if (!isPasswordCorrect) {
      //increment failed attempts
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 60 * 1000);
        user.failedLoginAttempts = 0;
      }
      await this.usersService.update(user.id, {
        failedLoginAttempts: user.failedLoginAttempts,
        lockUntil: user.lockUntil,
        updatedAt: new Date(),
      });
      this.logger.error(`Invalid credentials for user ${dto.email}`);
      throw new BadRequestException('Invalid credentials');
    }
    //check if the user is verified
    if (!user.isEmailVerified) {
      this.logger.error(`User with email ${dto.email} is not verified`);
      throw new BadRequestException(
        'Your account is not verified. Please verify your email.',
      );
    }

    // //2FA check
    // if (user.twoFactorAuth) {
    //   if (!user.twoFactorAuthSecret || !dto.twoFactorAuthCode) {
    //     throw new BadRequestException(
    //       'Two-factor authentication is enabled but not configured. Please contact support.',
    //     );
    //   }
    //   const result = await verify({
    //     secret: user.twoFactorAuthSecret,
    //     token: dto.twoFactorAuthCode,
    //   });
    //   if (!result.valid) {
    //     this.logger.error(
    //       `Invalid two-factor authentication code for user ${dto.email}`,
    //     );
    //     throw new BadRequestException('Invalid two-factor authentication code');
    //   }
    // }

    //reset failed attempts on successful login
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await this.usersService.update(user.id, {
      id: user.id,
      failedLoginAttempts: user.failedLoginAttempts,
      lockUntil: user.lockUntil,
      updatedAt: new Date(),
    });
    const tokens = await this.generateTokens(user);
    this.logger.info(`User with email ${dto.email} has logged in`);
    return {
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isEmailVerified: user.isEmailVerified,
        twoFactorAuth: user.twoFactorAuth,
        role: user.role,
      },
      ...tokens,
    };
  }
  async refreshAccessToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const { sub: userId, jti, family } = payload;

    //find the token in the db using jti
    const storedToken = await this.refreshTokenService.findByJti(jti);
    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    //check if the token is used
    if (storedToken.used || storedToken.revokedAt) {
      //revoke all tokens of the family
      await this.refreshTokenService.revokeFamily(storedToken.family);
      this.logger.warn(
        `Refresh token reuse detected for user ${userId}. Revoking famiy.`,
      );
      throw new UnauthorizedException(
        'Refresh token reuse detected. Please login again.',
      );
    }

    //check if the db record is expired
    if (storedToken.expiresAt < new Date()) {
      await this.refreshTokenService.revokeToken(storedToken.id);
      throw new UnauthorizedException(
        'Refresh token has expired.Please login again',
      );
    }

    //verify hash match
    const isValid = await this.hashPasswordService.verifyPassword(
      refreshToken,
      storedToken.tokenHash,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token signature');
    }

    //find user
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    //mark the current token as used
    await this.refreshTokenService.markAsUsed(storedToken.id);

    //issue new token
    const tokens = await this.generateTokens(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      storedToken.family,
    );
    this.logger.info(`Access token refreshed successfully for user ${userId}`);

    return {
      message: 'Access token refreshed successfully',
      ...tokens,
    };
  }
  async logout(refreshToken: string) {
    if (!refreshToken) {
      return { message: 'Logged out successfully' };
    }

    try {
      const payload: any = this.jwtService.decode(refreshToken);
      if (payload && payload.family) {
        await this.refreshTokenService.revokeFamily(payload.family);
        this.logger.info(
          `Session family ${payload.family} revoked for user ${payload.sub}`,
        );
      }
    } catch (error) {
      this.logger.error(`Error during logout: ${error.message}`);
    }
    return { message: 'Logged out successfuly' };
  }
  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return {
        message:
          'If an account with this email exists, you will receive a password reset email',
      };
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    const resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.usersService.update(user.id, {
      resetToken: hashedResetToken,
      resetTokenExpiresAt,
      updatedAt: new Date(),
    });
    this.logger.info(`Password reset token generated for user ${email}`);
    await this.emailService.sendPasswordResetEmail(email, resetToken);
    this.logger.info(`Password reset email sent to user ${email}`);
    return {
      message:
        'If an account with this email exists, you will receive a password reset email',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.usersService.findByResetToken(hashedToken);
    if (
      !user ||
      !user.resetTokenExpiresAt ||
      new Date(user.resetTokenExpiresAt) < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword =
      await this.hashPasswordService.hashPassword(newPassword);
    await this.refreshTokenService.revokeAllForUser(user.id);
    await this.usersService.update(user.id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiresAt: null,
      updatedAt: new Date(),
      passwordChangedAt: new Date(),
    });
    this.logger.info(`Password reset for user ${user.email}`);


    // Auto-login after reset
    const tokens = await this.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      message: 'Password reset successful',
      ...tokens,
    };
  }

  async updatePassword(
    userId: string,
    newPassword: string,
    oldPassword: string,
  ) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException(
        'You are not authorized to perform this action',
      );
    }
    const isPasswordCorrect = await this.hashPasswordService.verifyPassword(
      oldPassword,
      user.password,
    );
    if (!isPasswordCorrect) {
      throw new BadRequestException('Incorrect old password');
    }

    const hashedPassword =
      await this.hashPasswordService.hashPassword(newPassword);
    await this.usersService.update(user.id, {
      password: hashedPassword,
      updatedAt: new Date(),
      passwordChangedAt: new Date(),
    });
this.logger.info(`Password updated for user ${user.email}`);
    await this.refreshTokenService.revokeAllForUser(user.id);

    const tokens = await this.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    return {
      message: 'Password updated successfully',
      ...tokens,
    };
  }
  async logoutAll(userId: string) {
    await this.refreshTokenService.revokeAllForUser(userId);
    return { message: 'All sessions logged out successfully' };
  }

async googleAuth(){}

  // ====================== Private Methods ======================

  private parseDurationToMs(value: string | number | undefined): number {
    if (value === undefined) return 7 * 24 * 60 * 60 * 1000;
    if (typeof value === 'number') return value;
    if (/^\d+$/.test(value)) return parseInt(value, 10);

    const match = value.match(/^(\d+(?:\.\d+)?)\s*([smhdw])?$/i);
    if (!match) return 7 * 24 * 60 * 60 * 1000;

    const num = parseFloat(match[1]);
    const unit = (match[2] || 's').toLowerCase();
    const multipliers = {
      s: 1000,
      m: 60000,
      h: 3600000,
      d: 86400000,
      w: 604800000,
    };
    return num * multipliers[unit];
  }
  // ================= TOKEN GENERATION =================
  private async generateTokens(user: JwtPayloadUser, existingFamily?: string) {
    const jti = crypto.randomUUID();
    const family = existingFamily || crypto.randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user, jti, family),
    ]);
    const tokenHash = await this.hashPasswordService.hashPassword(refreshToken);
    const refreshExpiresMs = this.parseDurationToMs(
      this.configService.get('JWT_REFRESH_EXPIRES_IN'),
    );

    await this.refreshTokenService.create({
      userId: user.id,
      tokenHash,
      jti,
      family,
      expiresAt: new Date(Date.now() + refreshExpiresMs),
    });
    return {
      accessToken,
      refreshToken,
    };
  }

  // ================= ACCESS TOKEN =================
  private generateAccessToken(user: JwtPayloadUser): string {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
    });
  }

  private generateRefreshToken(
    user: JwtPayloadUser,
    jti: string,
    family: string,
  ): string {
    const payload = { sub: user.id, jti, family };
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN')!,
    });
  }
}
