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
var IsNotPwnedConstraint_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsNotPwnedConstraint = void 0;
exports.IsNotPwned = IsNotPwned;
require("dotenv/config");
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const crypto = __importStar(require("node:crypto"));
let IsNotPwnedConstraint = IsNotPwnedConstraint_1 = class IsNotPwnedConstraint {
    logger = new common_1.Logger(IsNotPwnedConstraint_1.name);
    async validate(password, args) {
        if (!password)
            return false;
        try {
            const hash = crypto
                .createHash('sha256')
                .update(password)
                .digest('hex')
                .toUpperCase();
            const prefix = hash.slice(0, 5);
            const suffix = hash.slice(5);
            const url = process.env.HIBP_URL || 'https://api.pwnedpasswords.com/range';
            const userAgent = process.env.USER_AGENT || 'MyNestApp';
            const response = await fetch(`${url}/${prefix}`, {
                headers: {
                    'User-Agent': userAgent,
                },
            });
            if (!response.ok) {
                this.logger.error(`HIBP API check failed with status: ${response.status}`);
                return true;
            }
            const text = await response.text();
            const isPwned = text.split('\r\n').some((line) => {
                const [hashSuffix] = line.split(':');
                return hashSuffix === suffix;
            });
            return !isPwned;
        }
        catch (error) {
            this.logger.error(`Password pwned check error: ${error.message}`);
            return true;
        }
    }
    defaultMessage(args) {
        return 'This password has appeared in a data breach. Please use a different password.';
    }
};
exports.IsNotPwnedConstraint = IsNotPwnedConstraint;
exports.IsNotPwnedConstraint = IsNotPwnedConstraint = IsNotPwnedConstraint_1 = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ name: 'isNotPwned', async: true })
], IsNotPwnedConstraint);
function IsNotPwned(validationOptions) {
    return function (object, propertyName) {
        (0, class_validator_1.registerDecorator)({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsNotPwnedConstraint,
        });
    };
}
//# sourceMappingURL=is-not-pwned.validator.js.map