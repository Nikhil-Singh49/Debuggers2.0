import { resolve } from 'node:path';
import dotenv from 'dotenv';
import serverless from 'serverless-http';
import { createApp } from '../../src/app.js';
import { loadEnv } from '../../src/config/env.js';
import { getPool, pingDb } from '../../src/db/pool.js';
import { createLogger } from '../../src/utils/logger.js';

dotenv.config({ path: resolve(process.cwd(), 'community project', '.env') });

const origins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

if (process.env.URL) {
    origins.push(new URL(process.env.URL).origin);
}

const env = loadEnv({
    ...process.env,
    CORS_ORIGINS: [...new Set(origins)].join(','),
});
const logger = createLogger(env);
const app = createApp({
    env,
    logger,
    checkDb: () => pingDb(env),
    getPool: () => getPool(env),
});

export const handler = serverless(app, { basePath: '/.netlify/functions/api' });
