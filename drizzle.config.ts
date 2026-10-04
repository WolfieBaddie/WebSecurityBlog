import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/server/db/schema/*',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://postgres:postgresdevpassword@localhost:5432/astro_blog_db',
  },
  schemaFilter: ['core', 'content', 'challenges', 'eval', 'media'],
});