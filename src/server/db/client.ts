import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle as neonDrizzle } from 'drizzle-orm/neon-serverless';
import postgres from 'postgres';
import { drizzle as pgDrizzle } from 'drizzle-orm/postgres-js';
import ws from 'ws';
import * as schema from './schema';

// Astro/Vite exposes .env via import.meta.env in SSR; Node scripts use process.env
const connectionString =
  process.env.DATABASE_URL ||
  (import.meta as any).env?.DATABASE_URL ||
  'postgres://postgres:postgresdevpassword@localhost:5432/astro_blog_db';

// Local Docker Postgres speaks raw TCP (postgres.js).
// Neon speaks WebSocket (neon-serverless). Auto-detect by host.
const isLocalDb = /localhost|127\.0\.0\.1/.test(connectionString);

function createDb() {
  if (isLocalDb) {
    const client = postgres(connectionString);
    return pgDrizzle(client, { schema });
  }

  if (typeof WebSocket === 'undefined') {
    neonConfig.webSocketConstructor = ws;
  }
  const pool = new Pool({ connectionString });
  return neonDrizzle(pool, { schema });
}

export const db = createDb();
