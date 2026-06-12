"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const config_1 = require("@nestjs/config");
const logger_module_1 = require("./logger/logger.module");
const users_module_1 = require("./users/users.module");
const users_controller_1 = require("./users/users.controller");
const auth_module_1 = require("./auth/auth.module");
const hash_password_module_1 = require("./hash-password/hash-password.module");
const email_module_1 = require("./email/email.module");
const refresh_token_module_1 = require("./refresh-token/refresh-token.module");
const core_1 = require("@nestjs/core");
const jwt_auth_guard_1 = require("./auth/guards/jwt-auth.guard");
const jwt_1 = require("@nestjs/jwt");
const google_module_1 = require("./google/google.module");
const two_factor_auth_service_1 = require("./two-factor-auth/two-factor-auth.service");
const two_factor_auth_module_1 = require("./two-factor-auth/two-factor-auth.module");
const throttler_1 = require("@nestjs/throttler");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            throttler_1.ThrottlerModule.forRoot({
                throttlers: [
                    {
                        name: 'default',
                        ttl: 60000,
                        limit: 10,
                    },
                ],
            }),
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                expandVariables: true,
            }),
            logger_module_1.LoggerModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            hash_password_module_1.HashPasswordModule,
            email_module_1.EmailModule,
            refresh_token_module_1.RefreshTokenModule,
            google_module_1.GoogleModule,
            two_factor_auth_module_1.TwoFactorAuthModule,
        ],
        controllers: [app_controller_1.AppController, users_controller_1.UsersController],
        providers: [
            app_service_1.AppService,
            jwt_1.JwtService,
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
            two_factor_auth_service_1.TwoFactorAuthService,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map