import { ConfigService } from '@nestjs/config';
import { UsersService } from "../users/users.service";
import { Logger } from 'winston';
import { RegisterDto } from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';
import { HashPasswordService } from "../hash-password/hash-password.service";
import { EmailService } from "../email/email.service";
import { RefreshTokenService } from "../refresh-token/refresh-token.service";
import { LoginDto } from './dto/login.dto';
import { TwoFactorAuthService } from "../two-factor-auth/two-factor-auth.service";
export declare class AuthService {
    private readonly logger;
    private readonly usersService;
    private readonly configService;
    private readonly jwtService;
    private readonly hashPasswordService;
    private readonly emailService;
    private readonly refreshTokenService;
    private readonly twoFactorAuthService;
    constructor(logger: Logger, usersService: UsersService, configService: ConfigService, jwtService: JwtService, hashPasswordService: HashPasswordService, emailService: EmailService, refreshTokenService: RefreshTokenService, twoFactorAuthService: TwoFactorAuthService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        message: string;
        user: {
            id: string;
            email: string;
            name: string;
            isVerified: boolean;
            role: "admin" | "user";
        };
    }>;
    verifyEmail(token: string): Promise<{
        accessToken: string;
        refreshToken: string;
        message: string;
        user: {
            id: string;
            email: string;
            isEmailVerified: boolean;
            role: "admin" | "user";
        };
    }>;
    resendEmailVerification(email: string): Promise<{
        message: string;
    }>;
    login(dto: LoginDto): Promise<{
        message: string;
        TwoFactorAuthRequired: boolean;
    } | {
        accessToken: string;
        refreshToken: string;
        message: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            isEmailVerified: true;
            twoFactorAuth: boolean;
            role: "admin" | "user";
        };
        TwoFactorAuthRequired?: undefined;
    }>;
    refreshAccessToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        message: string;
    }>;
    logout(refreshToken: string): Promise<{
        message: string;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        accessToken: string;
        refreshToken: string;
        message: string;
    }>;
    updatePassword(userId: string, newPassword: string, oldPassword: string): Promise<{
        accessToken: string;
        refreshToken: string;
        message: string;
    }>;
    logoutAll(userId: string): Promise<{
        message: string;
    }>;
    googleAuth(googleUser: {
        googleId: string;
        email: string;
        name: string;
        emailVerified: boolean;
        refreshToken: string;
        accessToken: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
        message: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            isEmailVerified: boolean;
            role: "admin" | "user";
        };
    }>;
    private parseDurationToMs;
    private generateTokens;
    private generateAccessToken;
    private generateRefreshToken;
}
