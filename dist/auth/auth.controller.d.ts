import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import type { Request, Response } from 'express';
import { LoginDto } from './dto/login.dto';
import type { User } from "../db/schema";
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { updatePasswordDto } from './dto/update-password.dto';
import { GoogleService } from "../google/google.service";
import { TwoFactorAuthService } from "../two-factor-auth/two-factor-auth.service";
export declare class AuthController {
    private readonly authService;
    private readonly configService;
    private readonly jwtService;
    private readonly googleService;
    private readonly twoFactorAuthService;
    constructor(authService: AuthService, configService: ConfigService, jwtService: JwtService, googleService: GoogleService, twoFactorAuthService: TwoFactorAuthService);
    register(registerData: RegisterDto, res: Response): Promise<{
        accessToken: string;
        message: string;
        user: {
            id: string;
            email: string;
            name: string;
            isVerified: boolean;
            role: "admin" | "user";
        };
    }>;
    verifyEmail(token: string, res: Response): Promise<{
        accessToken: string;
        message: string;
        user: {
            id: string;
            email: string;
            isEmailVerified: boolean;
            role: "admin" | "user";
        };
    }>;
    login(loginData: LoginDto, res: Response): Promise<{
        message: string;
        TwoFactorAuthRequired: boolean;
    } | {
        accessToken: string;
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
    refreshTokens(req: Request, res: Response): Promise<{
        accessToken: string;
        message: string;
    }>;
    logout(res: Response, req: Request): Promise<{
        message: string;
    }>;
    forgotPassword(forgotPasswordData: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(token: string, ResetPasswordData: ResetPasswordDto, res: Response): Promise<{
        accessToken: string;
        message: string;
    }>;
    updatePassword(user: User, updatePasswordData: updatePasswordDto, res: Response): Promise<{
        accessToken: string;
        message: string;
    }>;
    logoutAll(user: User, res: Response): Promise<{
        message: string;
    }>;
    googleAuth(res: Response): Promise<void>;
    googleAuthCallback(code: string, res: Response): Promise<{
        accessToken: string;
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
    setupTwoFactorAuth(user: User): Promise<{
        message: string;
        qrCode: string;
    }>;
    verifyTwoFactorAuth(user: User, code: string): Promise<{
        message: string;
        backupCodes: string[];
        warning: string;
    }>;
    disableTwoFactorAuth(user: User, password: string): Promise<{
        message: string;
    }>;
}
