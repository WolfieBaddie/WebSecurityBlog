import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from '../src/server/db/client';
import { users } from '../src/server/db/schema';
import { hashPassword } from '../src/server/modules/auth/password';

async function main() {
  const username = process.env.ADMIN_USERNAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !email || !password) {
    console.error(
      'Usage:\n' +
        '  ADMIN_USERNAME=operator ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=yoursecret \\\n' +
        '  npx tsx scripts/create-admin.ts'
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);

  if (existing.length > 0) {
    await db
      .update(users)
      .set({ passwordHash, role: 'admin', email })
      .where(eq(users.id, existing[0].id));
    console.log(`✔ Admin '${username}' password reset to the provided value.`);
  } else {
    await db.insert(users).values({ username, email, passwordHash, role: 'admin' });
    console.log(`✔ Admin '${username}' created.`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
