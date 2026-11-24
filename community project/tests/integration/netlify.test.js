import { afterAll, beforeAll, expect, it, vi } from 'vitest';

let handler;

beforeAll(async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('DB_SERVER', 'localhost');
    vi.stubEnv('DB_NAME', 'SchoolManagement');
    vi.stubEnv('DB_USER', 'app_user');
    vi.stubEnv('DB_PASSWORD', 'unused-in-tests');
    vi.stubEnv('JWT_SECRET', 'test-secret-with-at-least-thirty-two-characters');
    vi.stubEnv('CORS_ORIGINS', '');
    vi.stubEnv('URL', 'https://edupulse.netlify.app');

    ({ handler } = await import('../../netlify/functions/api.js'));
});

afterAll(() => {
    vi.unstubAllEnvs();
});

it('serves the Express API through the Netlify rewrite and allows the site origin', async () => {
    const response = await handler({
        httpMethod: 'GET',
        path: '/.netlify/functions/api/api/health',
        headers: {
            host: 'edupulse.netlify.app',
            origin: 'https://edupulse.netlify.app',
        },
        queryStringParameters: null,
        body: null,
        isBase64Encoded: false,
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toMatchObject({ status: 'ok' });
    expect(response.headers['access-control-allow-origin']).toBe('https://edupulse.netlify.app');
});
