import { describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
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
const logger = createLogger(env);

const buildApp = (checkDb = async () => {}) => createApp({ env, logger, checkDb });

describe('health endpoints', () => {
    it('GET /api/health returns ok and a request id header', async () => {
        const res = await request(buildApp()).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
        expect(res.headers['x-request-id']).toBeTruthy();
    });

    it('GET /api/ready returns 200 when the database is reachable', async () => {
        const res = await request(buildApp()).get('/api/ready');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: 'ready', database: 'up' });
    });

    it('GET /api/ready returns 503 without leaking internal error details', async () => {
        const checkDb = async () => {
            throw new Error('Login failed for user sa at 10.0.0.5');
        };
        const res = await request(buildApp(checkDb)).get('/api/ready');
        expect(res.status).toBe(503);
        expect(res.body.error.code).toBe('DB_UNAVAILABLE');
        expect(JSON.stringify(res.body)).not.toContain('10.0.0.5');
        expect(JSON.stringify(res.body)).not.toContain('stack');
    });
});

describe('error handling', () => {
    it('returns a consistent 404 for unknown routes', async () => {
        const res = await request(buildApp()).get('/api/nope');
        expect(res.status).toBe(404);
        expect(res.body.error.code).toBe('NOT_FOUND');
        expect(res.body.error.requestId).toBeTruthy();
    });

    it('returns 400 INVALID_JSON for a malformed body', async () => {
        const res = await request(buildApp())
            .post('/api/health')
            .set('Content-Type', 'application/json')
            .send('{"broken":');
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('INVALID_JSON');
    });

    it('returns 413 for an oversized body', async () => {
        const res = await request(buildApp())
            .post('/api/health')
            .set('Content-Type', 'application/json')
            .send(JSON.stringify({ blob: 'x'.repeat(200 * 1024) }));
        expect(res.status).toBe(413);
        expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
    });
});

describe('CORS', () => {
    it('allows an approved origin', async () => {
        const res = await request(buildApp()).get('/api/health').set('Origin', 'http://localhost:5173');
        expect(res.status).toBe(200);
        expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });
});

describe('authentication', () => {
    it('authenticates with a bcrypt hash and returns a JWT usable by /auth/me', async () => {
        const password = await bcrypt.hash('correct horse battery staple', 4);
        const app = createApp({
            env,
            logger,
            checkDb: async () => {},
            findUser: async () => ({
                userId: 7,
                username: 'admin@example.test',
                password,
                role: 'admin',
                status: 'Active',
                name: 'School Admin',
            }),
        });

        const login = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@example.test', password: 'correct horse battery staple', role: 'Admin' });
        expect(login.status).toBe(200);
        expect(login.body.user).toMatchObject({ id: 7, name: 'School Admin', role: 'Admin' });
        expect(login.body.token).toBeTruthy();

        const profile = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${login.body.token}`);
        expect(profile.status).toBe(200);
        expect(profile.body).toEqual({ id: 7, email: 'admin@example.test', role: 'Admin' });
    });

    it('authenticates with a numeric user ID and reports a selected-role mismatch', async () => {
        const password = await bcrypt.hash('correct password', 4);
        const findUser = async (identifier) => identifier === '7'
            ? {
                userId: 7,
                username: 'admin@example.test',
                password,
                role: 'Admin',
                status: 'Active',
                name: 'School Admin',
            }
            : null;
        const app = createApp({ env, logger, checkDb: async () => {}, findUser });

        const login = await request(app)
            .post('/api/auth/login')
            .send({ email: '7', password: 'correct password', role: 'Admin' });
        expect(login.status).toBe(200);
        expect(login.body.user.id).toBe(7);

        const mismatch = await request(app)
            .post('/api/auth/login')
            .send({ email: '7', password: 'correct password', role: 'Student' });
        expect(mismatch.status).toBe(403);
        expect(mismatch.body.error.code).toBe('ROLE_MISMATCH');
    });

    it('rejects invalid passwords and unauthenticated API requests', async () => {
        const password = await bcrypt.hash('correct password', 4);
        const app = createApp({
            env,
            logger,
            checkDb: async () => {},
            findUser: async () => ({
                userId: 9,
                username: 'teacher@example.test',
                password,
                role: 'Teacher',
                status: 'Active',
                name: 'School Teacher',
            }),
        });
        const login = await request(app)
            .post('/api/auth/login')
            .send({ email: 'teacher@example.test', password: 'wrong password', role: 'Teacher' });
        expect(login.status).toBe(401);
        expect(login.body.error.code).toBe('INVALID_CREDENTIALS');

        const dashboard = await request(app).get('/api/dashboard');
        expect(dashboard.status).toBe(401);
        expect(dashboard.body.error.code).toBe('AUTH_REQUIRED');

        const teacherToken = jwt.sign({ role: 'Teacher' }, env.JWT_SECRET, { subject: '9', expiresIn: '1h' });
        const forbidden = await request(app)
            .post('/api/students')
            .set('Authorization', `Bearer ${teacherToken}`)
            .send({ name: 'Student', klass: 'VI-A', guardian: 'Parent' });
        expect(forbidden.status).toBe(403);
        expect(forbidden.body.error.code).toBe('FORBIDDEN');
    });
});

describe('CORS', () => {
    it('rejects an unapproved origin with a JSON 403', async () => {
        const res = await request(buildApp()).get('/api/health').set('Origin', 'http://evil.example.com');
        expect(res.status).toBe(403);
        expect(res.body.error.code).toBe('CORS_ORIGIN_DENIED');
        expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
});
