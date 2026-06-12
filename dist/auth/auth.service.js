"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nest_winston_1 = require("nest-winston");
const users_service_1 = require("../users/users.service");
const winston_1 = require("winston");
const jwt_1 = require("@nestjs/jwt");
const hash_password_service_1 = require("../hash-password/hash-password.service");
const crypto = __importStar(require("crypto"));
const email_service_1 = require("../email/email.service");
const refresh_token_service_1 = require("../refresh-token/refresh-token.service");
const two_factor_auth_service_1 = require("../two-factor-auth/two-factor-auth.service");
let AuthService = class AuthService {
    logger;
    usersService;
    configService;
    jwtService;
    hashPasswordService;
    emailService;
    refreshTokenService;
    twoFactorAuthService;
    constructor(logger, usersService, configService, jwtService, hashPasswordService, emailService, refreshTokenService, twoFactorAuthService) {
        this.logger = logger;
        this.usersService = usersService;
        this.configService = configService;
        this.jwtService = jwtService;
        this.hashPasswordService = hashPasswordService;
        this.emailService = emailService;
        this.refreshTokenService = refreshTokenService;
        this.twoFactorAuthService = twoFactorAuthService;
    }
    async register(dto) {
        const existingUser = await this.usersService.findByEmail(dto.email);
        if (existingUser) {
            this.logger.error(`User with email ${dto.email} already exists`);
            throw new common_1.ConflictException('An email has been sent if your account exists');
        }
        const hashPassword = await this.hashPasswordService.hashPassword(dto.password);
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        const hashedEmailToken = crypto
            .createHash('sha256')
            .update(emailVerificationToken)
            .digest('hex');
        const emailVerificationTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
        const user = await this.usersService.create({
            email: dto.email,
            firstName: dto.firstName,
            lastName: dto.lastName,
            password: hashPassword,
            emailVerificationToken: hashedEmailToken,
            emailVerificationTokenExpiresAt,
        });
        this.logger.info(`User with email ${dto.email} has been created`);
        await this.emailService.sendVerificationEmail(dto.email, emailVerificationToken);
        this.logger.info(`Verification email sent to user with email ${dto.email}`);
        const tokens = await this.generateTokens({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        return {
            message: 'Registration successful. Please check your email for verification instructions.',
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
    async verifyEmail(token) {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await this.usersService.findByEmailVerificationToken(hashedToken);
        if (!user || !user.emailVerificationTokenExpiresAt) {
            this.logger.error('Invalid or expired verification token');
            throw new common_1.BadRequestException('Please initiate the registration process again');
        }
        if (new Date(user.emailVerificationTokenExpiresAt) < new Date()) {
            throw new common_1.BadRequestException('Please request a new verification email.');
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
    async resendEmailVerification(email) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        if (user.isEmailVerified) {
            throw new common_1.BadRequestException('Your account is already verified. Please log in.');
        }
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        const hashedEmailToken = crypto
            .createHash('sha256')
            .update(emailVerificationToken)
            .digest('hex');
        const emailVerificationTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await this.usersService.update(user.id, {
            emailVerificationToken: hashedEmailToken,
            emailVerificationTokenExpiresAt,
            updatedAt: new Date(),
        });
        await this.emailService.sendVerificationEmail(email, emailVerificationToken);
        return { message: 'Verification email sent successfully.' };
    }
    async login(dto) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user) {
            throw new common_1.BadRequestException('Invalid credentials');
        }
        if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
            const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 1000 / 60);
            throw new common_1.BadRequestException(`Account locked. Try again in ${minutesLeft} minutes.`);
        }
        const isPasswordCorrect = await this.hashPasswordService.verifyPassword(dto.password, user.password);
        if (!isPasswordCorrect) {
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
            throw new common_1.BadRequestException('Invalid credentials');
        }
        if (!user.isEmailVerified) {
            this.logger.error(`User with email ${dto.email} is not verified`);
            throw new common_1.BadRequestException('Your account is not verified. Please verify your email.');
        }
        if (user.twoFactorAuth) {
            if (!user.twoFactorAuthSecret) {
                throw new common_1.BadRequestException('Two-factor authentication is enabled but not configured. Please contact support.');
            }
            if (!dto.twoFactorAuthCode) {
                return {
                    message: 'Two-factor authentication required',
                    TwoFactorAuthRequired: true,
                };
            }
            let isValid = await this.twoFactorAuthService.verifyLoginCode(user.id, dto.twoFactorAuthCode);
            if (!isValid) {
                isValid = await this.twoFactorAuthService.verifyBackupCode(user.id, dto.twoFactorAuthCode);
            }
            if (!isValid) {
                this.logger.error(`Invalid two-factor authentication code for user ${dto.email}`);
                throw new common_1.BadRequestException('Invalid two-factor authentication code');
            }
        }
        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        await this.usersService.update(user.id, {
            id: user.id,
            failedLoginAttempts: user.failedLoginAttempts,
            lockUntil: user.lockUntil,
            updatedAt: new Date(),
        });
        const tokens = await this.generateTokens({
            id: user.id,
            email: user.email,
            role: user.role,
        });
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
    async refreshAccessToken(refreshToken) {
        if (!refreshToken) {
            throw new common_1.UnauthorizedException('No refresh token provided');
        }
        let payload;
        try {
            payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
            });
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        const { sub: userId, jti, family } = payload;
        const storedToken = await this.refreshTokenService.findByJti(jti);
        if (!storedToken) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        if (storedToken.used || storedToken.revokedAt) {
            await this.refreshTokenService.revokeFamily(storedToken.family);
            this.logger.warn(`Refresh token reuse detected for user ${userId}. Revoking famiy.`);
            throw new common_1.UnauthorizedException('Refresh token reuse detected. Please login again.');
        }
        if (storedToken.expiresAt < new Date()) {
            await this.refreshTokenService.revokeToken(storedToken.id);
            throw new common_1.UnauthorizedException('Refresh token has expired.Please login again');
        }
        const isValid = await this.hashPasswordService.verifyPassword(refreshToken, storedToken.tokenHash);
        if (!isValid) {
            throw new common_1.UnauthorizedException('Invalid refresh token signature');
        }
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException('User no longer exists');
        }
        await this.refreshTokenService.markAsUsed(storedToken.id);
        const tokens = await this.generateTokens({
            id: user.id,
            email: user.email,
            role: user.role,
        }, storedToken.family);
        this.logger.info(`Access token refreshed successfully for user ${userId}`);
        return {
            message: 'Access token refreshed successfully',
            ...tokens,
        };
    }
    async logout(refreshToken) {
        if (!refreshToken) {
            return { message: 'Logged out successfully' };
        }
        try {
            const payload = this.jwtService.decode(refreshToken);
            if (payload && payload.family) {
                await this.refreshTokenService.revokeFamily(payload.family);
                this.logger.info(`Session family ${payload.family} revoked for user ${payload.sub}`);
            }
        }
        catch (error) {
            this.logger.error(`Error during logout: ${error.message}`);
        }
        return { message: 'Logged out successfuly' };
    }
    async forgotPassword(email) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            return {
                message: 'If an account with this email exists, you will receive a password reset email',
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
            message: 'If an account with this email exists, you will receive a password reset email',
        };
    }
    async resetPassword(token, newPassword) {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await this.usersService.findByResetToken(hashedToken);
        if (!user ||
            !user.resetTokenExpiresAt ||
            new Date(user.resetTokenExpiresAt) < new Date()) {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        const hashedPassword = await this.hashPasswordService.hashPassword(newPassword);
        await this.refreshTokenService.revokeAllForUser(user.id);
        await this.usersService.update(user.id, {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiresAt: null,
            updatedAt: new Date(),
            passwordChangedAt: new Date(),
        });
        this.logger.info(`Password reset for user ${user.email}`);
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
    async updatePassword(userId, newPassword, oldPassword) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException('You are not authorized to perform this action');
        }
        const isPasswordCorrect = await this.hashPasswordService.verifyPassword(oldPassword, user.password);
        if (!isPasswordCorrect) {
            throw new common_1.BadRequestException('Incorrect old password');
        }
        const hashedPassword = await this.hashPasswordService.hashPassword(newPassword);
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
    async logoutAll(userId) {
        await this.refreshTokenService.revokeAllForUser(userId);
        return { message: 'All sessions logged out successfully' };
    }
    async googleAuth(googleUser) {
        const normalizedEmail = googleUser.email.toLowerCase();
        let user = await this.usersService.findByEmail(normalizedEmail);
        const [firstName, lastName] = googleUser.name.split(' ');
        const hashPassword = await this.hashPasswordService.hashPassword(crypto.randomBytes(32).toString('hex'));
        if (!user) {
            user = await this.usersService.create({
                email: normalizedEmail,
                firstName: firstName || '',
                lastName: lastName || '',
                password: hashPassword,
                isEmailVerified: true,
                googleId: googleUser.googleId,
            });
            this.logger.info(`User with email ${normalizedEmail} has been created`);
        }
        else {
            const updates = {};
            if (!user.googleId)
                updates.googleId = googleUser.googleId;
            if (!user.isEmailVerified) {
                updates.isEmailVerified = true;
            }
            if (Object.keys(updates).length > 0) {
                await this.usersService.update(user.id, {
                    ...updates,
                    updatedAt: new Date(),
                });
            }
        }
        const tokens = await this.generateTokens({
            id: user.id,
            email: user.email,
            role: user.role,
        });
        return {
            message: ' Google authentication successful',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                isEmailVerified: user.isEmailVerified,
                role: user.role,
            },
            ...tokens,
        };
    }
    parseDurationToMs(value) {
        if (value === undefined)
            return 7 * 24 * 60 * 60 * 1000;
        if (typeof value === 'number')
            return value;
        if (/^\d+$/.test(value))
            return parseInt(value, 10);
        const match = value.match(/^(\d+(?:\.\d+)?)\s*([smhdw])?$/i);
        if (!match)
            return 7 * 24 * 60 * 60 * 1000;
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
    async generateTokens(user, existingFamily) {
        const jti = crypto.randomUUID();
        const family = existingFamily || crypto.randomUUID();
        const [accessToken, refreshToken] = await Promise.all([
            this.generateAccessToken(user),
            this.generateRefreshToken(user, jti, family),
        ]);
        const tokenHash = await this.hashPasswordService.hashPassword(refreshToken);
        const refreshExpiresMs = this.parseDurationToMs(this.configService.get('JWT_REFRESH_EXPIRES_IN'));
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
    generateAccessToken(user) {
        const payload = { sub: user.id, email: user.email, role: user.role };
        return this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_ACCESS_SECRET'),
            expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
        });
    }
    generateRefreshToken(user, jti, family) {
        const payload = { sub: user.id, jti, family };
        return this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(nest_winston_1.WINSTON_MODULE_PROVIDER)),
    __metadata("design:paramtypes", [winston_1.Logger,
        users_service_1.UsersService,
        config_1.ConfigService,
        jwt_1.JwtService,
        hash_password_service_1.HashPasswordService,
        email_service_1.EmailService,
        refresh_token_service_1.RefreshTokenService,
        two_factor_auth_service_1.TwoFactorAuthService])
], AuthService);
//# sourceMappingURL=auth.service.js.map