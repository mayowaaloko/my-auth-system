"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenService = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("../db/db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
let RefreshTokenService = class RefreshTokenService {
    async create(data) {
        const result = await db_1.db.insert(schema_1.refreshTokens).values(data).returning();
        return result[0];
    }
    async findLatestByFamily(family) {
        const result = await db_1.db
            .select()
            .from(schema_1.refreshTokens)
            .where((0, drizzle_orm_1.eq)(schema_1.refreshTokens.family, family))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.refreshTokens.createdAt))
            .limit(1);
        return result[0] ?? null;
    }
    async revokeFamily(family) {
        return db_1.db
            .update(schema_1.refreshTokens)
            .set({
            revokedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.refreshTokens.family, family));
    }
    async revokeToken(id) {
        return db_1.db
            .update(schema_1.refreshTokens)
            .set({
            revokedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.refreshTokens.id, id));
    }
    async findByJti(jti) {
        const result = await db_1.db
            .select()
            .from(schema_1.refreshTokens)
            .where((0, drizzle_orm_1.eq)(schema_1.refreshTokens.jti, jti))
            .limit(1);
        return result[0] ?? null;
    }
    async markAsUsed(id) {
        return db_1.db
            .update(schema_1.refreshTokens)
            .set({
            used: true,
            revokedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.refreshTokens.id, id));
    }
    async revokeAllForUser(userId) {
        return db_1.db
            .update(schema_1.refreshTokens)
            .set({
            revokedAt: new Date(),
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.refreshTokens.userId, userId), (0, drizzle_orm_1.isNull)(schema_1.refreshTokens.revokedAt)))
            .returning();
    }
};
exports.RefreshTokenService = RefreshTokenService;
exports.RefreshTokenService = RefreshTokenService = __decorate([
    (0, common_1.Injectable)()
], RefreshTokenService);
//# sourceMappingURL=refresh-token.service.js.map