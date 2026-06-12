"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashPasswordModule = void 0;
const common_1 = require("@nestjs/common");
const hash_password_service_1 = require("./hash-password.service");
const hash_password_controller_1 = require("./hash-password.controller");
let HashPasswordModule = class HashPasswordModule {
};
exports.HashPasswordModule = HashPasswordModule;
exports.HashPasswordModule = HashPasswordModule = __decorate([
    (0, common_1.Module)({
        providers: [hash_password_service_1.HashPasswordService],
        controllers: [hash_password_controller_1.HashPasswordController],
        exports: [hash_password_service_1.HashPasswordService],
    })
], HashPasswordModule);
//# sourceMappingURL=hash-password.module.js.map