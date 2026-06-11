import { Injectable } from '@nestjs/common';
import { db } from 'src/db/db';
import { NewRefreshToken, refreshTokens } from 'src/db/schema';
import { and, eq, desc, isNull } from 'drizzle-orm';

@Injectable()
export class RefreshTokenService {
  async create(data: NewRefreshToken) {
    const result = await db.insert(refreshTokens).values(data).returning();

    return result[0];
  }
  async findLatestByFamily(family: string) {
    const result = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.family, family))
      .orderBy(desc(refreshTokens.createdAt))
      .limit(1);

    return result[0] ?? null;
  }

  async revokeFamily(family: string) {
    return db
      .update(refreshTokens)
      .set({
        revokedAt: new Date(),
      })
      .where(eq(refreshTokens.family, family));
  }

  async revokeToken(id: string) {
    return db
      .update(refreshTokens)
      .set({
        revokedAt: new Date(),
      })
      .where(eq(refreshTokens.id, id));
  }
  async findByJti(jti: string) {
    const result = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.jti, jti))
      .limit(1);
    return result[0] ?? null;
  }

  async markAsUsed(id: string) {
    return db
      .update(refreshTokens)
      .set({
        used: true,
        revokedAt: new Date(),
      })
      .where(eq(refreshTokens.id, id));
  }
  async revokeAllForUser(userId: string) {
    return db
      .update(refreshTokens)
      .set({
        revokedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)),
      )
      .returning();
  }
}
