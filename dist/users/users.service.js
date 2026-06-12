"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../db/db");
const schema_1 = require("../db/schema");
let UsersService = class UsersService {
    async findByEmail(email) {
        const result = db_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.email, email))
            .limit(1);
        return (await result)[0] ?? null;
    }
    async findById(id) {
        const result = db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id)).limit(1);
        return (await result)[0] ?? null;
    }
    async create(data) {
        const result = await db_1.db.insert(schema_1.users).values(data).returning();
        return result[0];
    }
    async update(id, data) {
        const result = await db_1.db
            .update(schema_1.users)
            .set(data)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
            .returning();
        return result[0];
    }
    async findByEmailVerificationToken(token) {
        const result = await db_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.emailVerificationToken, token))
            .limit(1);
        return result[0] ?? null;
    }
    async findByResetToken(token) {
        const result = await db_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.resetToken, token))
            .limit(1);
        return result[0] ?? null;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)()
], UsersService);
//# sourceMappingURL=users.service.js.map