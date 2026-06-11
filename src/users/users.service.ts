import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from 'src/db/db';
import { NewUser, users } from 'src/db/schema';

@Injectable()
export class UsersService {
  async findByEmail(email: string) {
    const result = db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return (await result)[0] ?? null;
  }

  async findById(id: string) {
    const result = db.select().from(users).where(eq(users.id, id)).limit(1);
    return (await result)[0] ?? null;
  }

  async create(data: NewUser) {
    const result = await db.insert(users).values(data).returning();
    return result[0];
  }
  async update(id: string, data: Partial<NewUser>) {
    const result = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async findByEmailVerificationToken(token: string) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.emailVerificationToken, token))
      .limit(1);
    return result[0] ?? null;
  }

  async findByResetToken(token: string) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.resetToken, token))
      .limit(1);
    return result[0] ?? null;
  }
}
