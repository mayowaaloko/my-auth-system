"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nest_winston_1 = require("nest-winston");
const resend_1 = require("resend");
const winston_1 = require("winston");
let EmailService = class EmailService {
    configService;
    logger;
    resend;
    constructor(configService, logger) {
        this.configService = configService;
        this.logger = logger;
        const apiKey = this.configService.get('RESEND_API_KEY');
        if (!apiKey) {
            this.logger.error('RESEND_API_KEY is not defined');
            throw new Error('RESEND_API_KEY is not defined');
        }
        this.resend = new resend_1.Resend(apiKey);
    }
    async sendVerificationEmail(email, token) {
        const appUrl = this.configService.get('APP_URL');
        const fromEmail = this.configService.get('RESEND_FROM_EMAIL') ||
            'onboarding@resend.dev';
        const verificationUrl = `${appUrl}/v1/auth/verify-email?token=${token}`;
        try {
            await this.resend.emails.send({
                from: fromEmail,
                to: email,
                subject: 'Verify your account',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome! Please verify your email</h2>
            <p>Thanks for signing up. Click the button below to verify your email address.</p>
            <a
              href="${verificationUrl}"
              style="
                display: inline-block;
                padding: 12px 24px;
                background-color: #4F46E5;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                margin: 16px 0;
              "
            >
              Verify Email
            </a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="color: #6B7280; word-break: break-all;">${verificationUrl}</p>
            <p>This link expires in 24 hours.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
          </div>
        `,
            });
        }
        catch (error) {
            this.logger.error(`Error sending verification email to ${email}: ${error}`);
            throw error;
        }
    }
    async sendPasswordResetEmail(email, token) {
        const appUrl = this.configService.get('APP_URL');
        const fromEmail = this.configService.get('RESEND_FROM_EMAIL') ||
            'onboarding@resend.dev';
        const resetUrl = `${appUrl}/v1/auth/reset-password?token=${token}`;
        try {
            await this.resend.emails.send({
                from: fromEmail,
                to: email,
                subject: 'Reset your password',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>You have requested to reset your password. Click the button below to reset it.</p>
            <a
              href="${resetUrl}"
              style="
                display: inline-block;
                padding: 12px 24px;
                background-color: #4F46E5;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                margin: 16px 0;
              "
            >
              Reset Password
            </a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="color: #6B7280; word-break: break-all;">${resetUrl}</p>
            <p>This link expires in 1 hour.</p>
            <p>If you did not request a password reset, please ignore this email.</p>
          </div>
        `,
            });
        }
        catch (error) {
            this.logger.error(`Failed to send password reset email to ${email}`, error);
            throw error;
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)(nest_winston_1.WINSTON_MODULE_PROVIDER)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        winston_1.Logger])
], EmailService);
//# sourceMappingURL=email.service.js.map