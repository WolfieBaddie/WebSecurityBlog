import { db } from '../../db/client';
import { users } from '../../db/schema';
import { eq, or } from 'drizzle-orm';

export type UserRow = typeof users.$inferSelect;

export class AuthRepository {
  async findByIdentifier(identifier: string): Promise<UserRow | null> {
    const found = await db
      .select()
      .from(users)
      .where(or(eq(users.username, identifier), eq(users.email, identifier)))
      .limit(1);
    return found[0] ?? null;
  }

  async findById(id: string): Promise<UserRow | null> {
    const found = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return found[0] ?? null;
  }
}

export const authRepository = new AuthRepository();
