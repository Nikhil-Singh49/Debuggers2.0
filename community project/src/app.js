import { randomUUID } from 'node:crypto';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { schoolRouter } from './routes/school.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { ApiError } from './utils/ApiError.js';
import { getPool as connectPool } from './db/pool.js';
import { createUserLookup } from './services/users.js';

export function createApp({
    env,
    logger,
    checkDb,
    getPool = () => connectPool(env),
    findUser = createUserLookup(() => getPool()),
}) {
    const app = express();
    const allowedOrigins = new Set(env.CORS_ORIGINS);

    app.disable('x-powered-by');

    app.use(
        pinoHttp({
            logger,
            genReqId: (req, res) => {
                const id = randomUUID();
                res.setHeader('X-Request-Id', id);
                return id;
            },
            customLogLevel: (req, res, err) => {
                if (err || res.statusCode >= 500) return 'error';
                if (res.statusCode >= 400) return 'warn';
                return 'info';
            },
        }),
    );
    app.use(helmet());
    app.use(
        cors({
            origin: (origin, callback) => {
                // Requests without an Origin header (curl, health probes) are not browser CORS requests.
                if (!origin || allowedOrigins.has(origin)) return callback(null, true);
                return callback(new ApiError(403, 'CORS_ORIGIN_DENIED', 'Origin is not allowed'));
            },
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            maxAge: 600,
        }),
    );
    app.use(express.json({ limit: '100kb' }));

    app.use('/api', healthRouter({ checkDb }));
    app.use('/api', authRouter({ env, findUser, getPool }));
    app.use('/api', schoolRouter({ env, getPool }));

    app.use(notFound);
    app.use(errorHandler);
    return app;
}
