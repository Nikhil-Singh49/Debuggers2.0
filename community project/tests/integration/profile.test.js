import { expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../src/app.js';
import { loadEnv } from '../../src/config/env.js';
import { createLogger } from '../../src/utils/logger.js';

const env = loadEnv({
    NODE_ENV: 'test',
    DB_SERVER: 'localhost',
    DB_NAME: 'SchoolManagement',
    DB_USER: 'app_user',
    DB_PASSWORD: 'unused-in-tests',
    JWT_SECRET: 'test-secret-with-at-least-thirty-two-characters',
    CORS_ORIGINS: 'http://localhost:5173',
});

it('saves a trimmed display name for a non-admin account', async () => {
    const parameters = {};
    let queryText = '';
    const app = createApp({
        env,
        logger: createLogger(env),
        checkDb: async () => {},
        getPool: async () => ({
            request: () => ({
                input(name, value) {
                    parameters[name] = value;
                    return this;
                },
                async query(query) {
                    queryText = query;
                    return { recordset: [] };
                },
            }),
        }),
    });
    const token = jwt.sign({ role: 'Teacher' }, env.JWT_SECRET, { subject: '27', expiresIn: '1h' });

    const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ displayName: '  Shreya Kapoor  ' });

    expect(response.status).toBe(200);
    expect(response.body.displayName).toBe('Shreya Kapoor');
    expect(parameters.userId).toBe(27);
    expect(parameters.displayName).toBe('Shreya Kapoor');
    expect(queryText).toContain('UPDATE dbo.user_profiles');
});

it('does not allow Admin to change a profile through the non-admin endpoint', async () => {
    let databaseAccessed = false;
    const app = createApp({
        env,
        logger: createLogger(env),
        checkDb: async () => {},
        getPool: async () => {
            databaseAccessed = true;
            throw new Error('Database should not be accessed');
        },
    });
    const token = jwt.sign({ role: 'Admin' }, env.JWT_SECRET, { subject: '1', expiresIn: '1h' });

    const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ displayName: 'Not allowed' });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
    expect(databaseAccessed).toBe(false);
});
