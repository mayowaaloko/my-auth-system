"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokens = exports.users = exports.userRoleEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const pg_core_2 = require("drizzle-orm/pg-core");
const pg_core_3 = require("drizzle-orm/pg-core");
const pg_core_4 = require("drizzle-orm/pg-core");
const pg_core_5 = require("drizzle-orm/pg-core");
const pg_core_6 = require("drizzle-orm/pg-core");
exports.userRoleEnum = (0, pg_core_4.pgEnum)('user_role', ['admin', 'user']);
exports.users = (0, pg_core_6.pgTable)('user', {
    id: (0, pg_core_5.uuid)('id').defaultRandom().primaryKey(),
    firstName: (0, pg_core_1.text)('first_name').notNull(),
    lastName: (0, pg_core_1.text)('last_name').notNull(),
    email: (0, pg_core_1.text)('email').notNull().unique(),
    password: (0, pg_core_1.text)('password').notNull(),
    passwordChangedAt: (0, pg_core_1.timestamp)('password_changed_at'),
    role: (0, exports.userRoleEnum)('role').notNull().default('user'),
    googleId: (0, pg_core_1.text)('google_id').unique(),
    twoFactorAuth: (0, pg_core_2.boolean)('two_factor_auth').notNull().default(false),
    twoFactorAuthSecret: (0, pg_core_1.text)('two_factor_auth_secret'),
    twoFactorAuthBackupCodes: (0, pg_core_1.text)('two_factor_auth_backup_codes').array(),
    isEmailVerified: (0, pg_core_2.boolean)('is_verified').notNull().default(false),
    emailVerificationToken: (0, pg_core_1.text)('email_verification_token').unique(),
    emailVerificationTokenExpiresAt: (0, pg_core_1.timestamp)('email_verification_token_expires_at'),
    resetToken: (0, pg_core_1.text)('reset_token').unique(),
    resetTokenExpiresAt: (0, pg_core_1.timestamp)('reset_token_expires_at'),
    failedLoginAttempts: (0, pg_core_3.integer)('failed_login_attempts').notNull().default(0),
    lockUntil: (0, pg_core_1.timestamp)('lock_until'),
    tokenVersion: (0, pg_core_3.integer)('token_version').notNull().default(0),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow(),
});
exports.refreshTokens = (0, pg_core_6.pgTable)('refresh_token', {
    id: (0, pg_core_5.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_5.uuid)('user_id')
        .notNull()
        .references(() => exports.users.id, { onDelete: 'cascade' }),
    tokenHash: (0, pg_core_1.text)('token_hash').notNull().unique(),
    family: (0, pg_core_1.text)('family').notNull(),
    jti: (0, pg_core_1.text)('jti').notNull().unique(),
    used: (0, pg_core_2.boolean)('used').notNull().default(false),
    expiresAt: (0, pg_core_1.timestamp)('expires_at').notNull(),
    revokedAt: (0, pg_core_1.timestamp)('revoked_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').notNull().defaultNow(),
});
//# sourceMappingURL=schema.js.map