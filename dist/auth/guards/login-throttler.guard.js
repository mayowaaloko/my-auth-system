"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginThrottlerGuard = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
let LoginThrottlerGuard = class LoginThrottlerGuard extends throttler_1.ThrottlerGuard {
    async getTracker(req) {
        const email = req.body?.email?.trim().toLowerCase() || 'unknown';
        const ip = req.ips?.[0] || req.ip || req.connection?.remoteAddress || 'unknown';
        return `login-${email}-${ip}`;
    }
    async throwThrottlingException() {
        throw new throttler_1.ThrottlerException('Too many login attempts. Please try again later.');
    }
};
exports.LoginThrottlerGuard = LoginThrottlerGuard;
exports.LoginThrottlerGuard = LoginThrottlerGuard = __decorate([
    (0, common_1.Injectable)()
], LoginThrottlerGuard);
//# sourceMappingURL=login-throttler.guard.js.map