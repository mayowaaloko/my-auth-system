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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const google_auth_library_1 = require("google-auth-library");
let GoogleService = class GoogleService {
    configService;
    scopes = ['openid', 'email', 'profile'];
    constructor(configService) {
        this.configService = configService;
    }
    getClient() {
        const clientId = this.configService.get('GOOGLE_CLIENT_ID');
        const clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET');
        const redirectUri = this.configService.get('GOOGLE_REDIRECT_URI');
        if (!clientId || !clientSecret || !redirectUri) {
            throw new Error('Missing Google OAuth environment variables');
        }
        return new google_auth_library_1.OAuth2Client(clientId, clientSecret, redirectUri);
    }
    getAuthUrl() {
        const client = this.getClient();
        return client.generateAuthUrl({
            access_type: 'offline',
            scope: this.scopes,
            include_granted_scopes: true,
            prompt: 'consent',
        });
    }
    async getUserFromCode(code) {
        const client = this.getClient();
        const { tokens } = await client.getToken(code);
        if (!tokens.id_token || !tokens.access_token) {
            throw new Error('Google OAuth failed - Failed to get tokens');
        }
        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: this.configService.get('GOOGLE_CLIENT_ID'),
        });
        const payload = ticket.getPayload();
        if (!payload) {
            throw new Error('Google OAuth failed - Failed to get payload');
        }
        const { sub: googleId, email, name, email_verified } = payload;
        if (!googleId || !email || !name || typeof email_verified !== 'boolean') {
            throw new Error('Google OAuth failed - Email not verified');
        }
        return {
            googleId,
            email,
            name: name || '',
            emailVerified: email_verified,
            refreshToken: tokens.refresh_token || '',
            accessToken: tokens.access_token,
        };
    }
};
exports.GoogleService = GoogleService;
exports.GoogleService = GoogleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GoogleService);
//# sourceMappingURL=google.service.js.map