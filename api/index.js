import serverless from 'serverless-http';
import { createApp } from '../community project/src/app.js';
import { loadEnv } from '../community project/src/config/env.js';
import { getPool, pingDb } from '../community project/src/db/pool.js';
import { createLogger } from '../community project/src/utils/logger.js';

const origins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
}

if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    origins.push(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
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

export default serverless(app);
