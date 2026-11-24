import { describe, expect, it } from 'vitest';
import { loadEnv } from '../../src/config/env.js';

const valid = {
    DB_SERVER: 'localhost',
    DB_NAME: 'SchoolManagement',
    DB_USER: 'app_user',
    DB_PASSWORD: 'super-secret-value',
    JWT_SECRET: 'test-secret-with-at-least-thirty-two-characters',
    CORS_ORIGINS: 'http://localhost:5173, https://school.example.com',
};

describe('loadEnv', () => {
    it('parses a valid configuration and applies defaults', () => {
        const env = loadEnv(valid);
        expect(env.PORT).toBe(4000);
        expect(env.DB_PORT).toBe(1433);
        expect(env.DB_ENCRYPT).toBe(true);
        expect(env.DB_TRUST_SERVER_CERT).toBe(false);
        expect(env.CORS_ORIGINS).toEqual(['http://localhost:5173', 'https://school.example.com']);
    });

    it('names missing variables without echoing secret values', () => {
        let message = '';
        try {
            loadEnv({ ...valid, DB_USER: undefined, DB_PASSWORD: '' });
        } catch (error) {
            message = error.message;
        }
        expect(message).toContain('DB_USER');
        expect(message).toContain('DB_PASSWORD');
        expect(message).not.toContain('super-secret-value');
    });

    it('rejects a wildcard CORS origin', () => {
        expect(() => loadEnv({ ...valid, CORS_ORIGINS: '*' })).toThrow(/CORS_ORIGINS/);
    });

    it('rejects origins with a trailing slash or a path', () => {
        expect(() => loadEnv({ ...valid, CORS_ORIGINS: 'http://localhost:5173/' })).toThrow(/CORS_ORIGINS/);
        expect(() => loadEnv({ ...valid, CORS_ORIGINS: 'http://localhost:5173/app' })).toThrow(/CORS_ORIGINS/);
    });

    it('rejects an out-of-range port', () => {
        expect(() => loadEnv({ ...valid, PORT: '70000' })).toThrow(/PORT/);
    });
});
