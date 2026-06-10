import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
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

    //generate tokens
    const tokens = await this.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    return {
      message:
        'Registration successful. Please check your email for verification instructions.',
      user,
      ...tokens,
    };
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.findByEmailVerificationToken(token);
    if (!user || user.emailVerificationTokenExpiresAt) {
      throw new BadRequestException(
        this.logger.error('Invalid or expired verification token'),
        'Please initiate the registration process again',
      );
    }
    if (
      user.emailVerificationTokenExpiresAt &&
      new Date(user.emailVerificationTokenExpiresAt) < new Date()
    ) {
      throw new BadRequestException('Please request a new verification email.');
    }
    await this.usersService.update(user.id, {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpiresAt: null,
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

    //2FA check
    if (user.twoFactorAuth) {
      if (!user.twoFactorAuthSecret || !dto.twoFactorAuthCode) {
        throw new BadRequestException(
          'Two-factor authentication is enabled but not configured. Please contact support.',
        );
      }
    }
  }
  // ====================== Private Methods ======================

  // ================= TOKEN GENERATION =================
  private async generateTokens(user: JwtPayloadUser) {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user),
    ]);
    const tokenHash = await this.hashPasswordService.hashPassword(refreshToken);
    await this.refreshTokenService.create({
      userId: user.id,
      tokenHash,
      jti: crypto.randomUUID(),
      family: crypto.randomUUID(),
      expiresAt: new Date(
        Date.now() + this.configService.get('JWT_REFRESH_EXPIRES_IN') ??
          7 * 24 * 60 * 60 * 1000,
      ),
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
      secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
    });
  }

  private generateRefreshToken(user: JwtPayloadUser): string {
    const payload = { sub: user.id };
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
    });
  }
}
