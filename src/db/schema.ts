import { text, timestamp } from 'drizzle-orm/pg-core';
import { boolean } from 'drizzle-orm/pg-core';
import { integer } from 'drizzle-orm/pg-core';
import { pgEnum } from 'drizzle-orm/pg-core';
import { uuid } from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['admin', 'user']);

export const users = pgTable('user', {
  id: uuid('id').defaultRandom().primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  passwordChangedAt: timestamp('password_changed_at'),
  role: userRoleEnum('role').notNull().default('user'),
  googleId: text('google_id').unique(),
  twoFactorAuth: boolean('two_factor_auth').notNull().default(false),
  twoFactorAuthSecret: text('two_factor_auth_secret'),
  isEmailVerified: boolean('is_verified').notNull().default(false),
  emailVerificationToken: text('email_verification_token').unique(),
  emailVerificationTokenExpiresAt: timestamp(
    'email_verification_token_expires_at',
  ),
  resetToken: text('reset_token').unique(),
  resetTokenExpiresAt: timestamp('reset_token_expires_at'),
  failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
  lockUntil: timestamp('lock_until'),

  tokenVersion: integer('token_version').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const refreshTokens = pgTable('refresh_token', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  family: text('family').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
