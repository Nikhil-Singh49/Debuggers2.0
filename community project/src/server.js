import 'dotenv/config';
import { loadEnv } from './config/env.js';
import { createLogger } from './utils/logger.js';
import { createApp } from './app.js';
import { closePool, getPool, pingDb } from './db/pool.js';

let env;
try {
    env = loadEnv();
} catch (error) {
    console.error(error.message);
    process.exit(1);
}

const logger = createLogger(env);
const app = createApp({
    env,
    logger,
    checkDb: () => pingDb(env),
    getPool: () => getPool(env),
});

const server = app.listen(env.PORT, () => {
    logger.info(`EduPulse API listening on port ${env.PORT} (${env.NODE_ENV})`);
});

async function shutdown(signal) {
    logger.info(`${signal} received, shutting down`);
    const forceExit = setTimeout(() => process.exit(1), 10000);
    forceExit.unref();
    server.close(async () => {
        await closePool().catch((err) => logger.error({ err }, 'Error closing database pool'));
        process.exit(0);
    });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => logger.error({ err: reason }, 'Unhandled promise rejection'));
process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception');
    process.exit(1);
});
