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
exports.TwoFactorAuthService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const QRCode = __importStar(require("qrcode"));
const nest_winston_1 = require("nest-winston");
const otplib_1 = require("otplib");
const hash_password_service_1 = require("../hash-password/hash-password.service");
const users_service_1 = require("../users/users.service");
const winston_1 = require("winston");
let TwoFactorAuthService = class TwoFactorAuthService {
    logger;
    usersService;
    hashPasswordService;
    constructor(logger, usersService, hashPasswordService) {
        this.logger = logger;
        this.usersService = usersService;
        this.hashPasswordService = hashPasswordService;
    }
    async setup(userId) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException();
        }
        if (user.twoFactorAuth) {
            throw new common_1.ConflictException('Two-factor authentication is already enabled');
        }
        const secret = (0, otplib_1.generateSecret)();
        const uri = (0, otplib_1.generateURI)({
            issuer: 'Authentication System',
            label: user.email,
            secret,
        });
        const qrCode = await QRCode.toDataURL(uri, {
            margin: 1,
            scale: 2,
            width: 400,
        });
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
    async verifyAndEnable(userId, code) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException();
        }
        if (user.twoFactorAuth) {
            throw new common_1.ConflictException('Two-factor authentication is already enabled');
        }
        if (!user.twoFactorAuthSecret) {
            throw new common_1.BadRequestException('Two-factor authentication setup not found. Please initiate setup first.');
        }
        const result = await (0, otplib_1.verify)({
            secret: user.twoFactorAuthSecret,
            token: code,
        });
        if (!result.valid) {
            throw new common_1.BadRequestException('Invalid verification code');
        }
        const backupCodes = this.generateBackupCodes();
        const hashedBackupCodes = await Promise.all(backupCodes.map((code) => this.hashPasswordService.hashPassword(code)));
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
            warning: 'Save these backup codes securely. They will not be shown again.',
        };
    }
    async verifyLoginCode(userId, code) {
        const user = await this.usersService.findById(userId);
        if (!user || !user.twoFactorAuthSecret) {
            return false;
        }
        const result = await (0, otplib_1.verify)({
            secret: user.twoFactorAuthSecret,
            token: code,
        });
        return result.valid;
    }
    async verifyBackupCode(userId, code) {
        const user = await this.usersService.findById(userId);
        if (!user || !user.twoFactorAuthBackupCodes?.length) {
            return false;
        }
        const codes = user.twoFactorAuthBackupCodes;
        for (let i = 0; i < codes.length; i++) {
            const isMatch = await this.hashPasswordService.verifyPassword(code, codes[i]);
            if (isMatch) {
                const remainingCodes = codes.filter((_, idx) => idx !== i);
                await this.usersService.update(user.id, {
                    twoFactorAuthBackupCodes: remainingCodes.length > 0 ? remainingCodes : null,
                    updatedAt: new Date(),
                });
                this.logger.info(`Backup code used for user ${user.email}`);
                return true;
            }
        }
        return false;
    }
    async disable(userId, password) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException();
        }
        if (!user.twoFactorAuth) {
            throw new common_1.BadRequestException('Two-factor authentication is not enabled');
        }
        const isPasswordCorrect = await this.hashPasswordService.verifyPassword(password, user.password);
        if (!isPasswordCorrect) {
            throw new common_1.BadRequestException('Invalid password');
        }
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
    generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
        }
        return codes;
    }
};
exports.TwoFactorAuthService = TwoFactorAuthService;
exports.TwoFactorAuthService = TwoFactorAuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(nest_winston_1.WINSTON_MODULE_PROVIDER)),
    __metadata("design:paramtypes", [winston_1.Logger,
        users_service_1.UsersService,
        hash_password_service_1.HashPasswordService])
], TwoFactorAuthService);
//# sourceMappingURL=two-factor-auth.service.js.map