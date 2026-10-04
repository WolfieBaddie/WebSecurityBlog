import {Pool, neonConfig} from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import postgres from 'postgres';
import ws from 'ws';
import * as schema from './schema';

if(typeof WebSocket === 'undefined'){
    neonConfig.webSocketConstructor = ws;
}

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgresdevpassword@localhost:5432/astro_blog_db';

if(!connectionString)
    throw new Error("DATABASE_URL is not set")

// For local dev and Node.js environments
const pool = new Pool({connectionString});
export const db = drizzle(pool, {schema})