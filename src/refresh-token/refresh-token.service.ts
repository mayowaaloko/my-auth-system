import { Injectable } from '@nestjs/common';
import { db } from 'src/db/db';
import { NewRefreshToken, refreshTokens } from 'src/db/schema';

@Injectable()
export class RefreshTokenService {
  async create(data: NewRefreshToken) {
    const result = await db.insert(refreshTokens).values(data).returning();
    return result[0];
  }
}
