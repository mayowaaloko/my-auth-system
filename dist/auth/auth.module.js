"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const users_module_1 = require("../users/users.module");
const jwt_1 = require("@nestjs/jwt");
const hash_password_module_1 = require("../hash-password/hash-password.module");
const email_module_1 = require("../email/email.module");
const refresh_token_module_1 = require("../refresh-token/refresh-token.module");
const logger_module_1 = require("../logger/logger.module");
const config_1 = require("@nestjs/config");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const google_service_1 = require("../google/google.service");
const two_factor_auth_module_1 = require("../two-factor-auth/two-factor-auth.module");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            users_module_1.UsersModule,
            jwt_1.JwtModule.registerAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    secret: config.get('JWT_ACCESS_SECRET'),
                    signOptions: {
                        expiresIn: config.get('JWT_ACCESS_EXPIRES_IN'),
                    },
                }),
            }),
            hash_password_module_1.HashPasswordModule,
            email_module_1.EmailModule,
            refresh_token_module_1.RefreshTokenModule,
            logger_module_1.LoggerModule,
            two_factor_auth_module_1.TwoFactorAuthModule,
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [auth_service_1.AuthService, jwt_auth_guard_1.JwtAuthGuard, google_service_1.GoogleService],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map