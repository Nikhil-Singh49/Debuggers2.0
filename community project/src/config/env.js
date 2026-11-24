import { z } from 'zod';

const booleanString = (fallback) =>
    z.enum(['true', 'false']).default(fallback).transform((value) => value === 'true');

const isOrigin = (value) => {
    try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol) && url.origin === value;
    } catch {
        return false;
    }
};

const schema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
    DB_SERVER: z.string().min(1),
    DB_PORT: z.coerce.number().int().min(1).max(65535).default(1433),
    DB_NAME: z.string().min(1),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_ENCRYPT: booleanString('true'),
    DB_TRUST_SERVER_CERT: booleanString('false'),
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().regex(/^\d+[smhd]$/).default('8h'),
    CORS_ORIGINS: z
        .string()
        .min(1)
        .transform((value) => value.split(',').map((item) => item.trim()).filter(Boolean))
        .refine((list) => list.length > 0 && list.every(isOrigin), {
            message: 'must be a comma-separated list of origins like http://localhost:5173 (no wildcard, no trailing slash)',
        }),
});

/**
 * Validates environment variables. Error messages name the failing
 * variables but never echo their values, so secrets cannot leak into logs.
 */
export function loadEnv(source = process.env) {
    const result = schema.safeParse(source);
    if (!result.success) {
        const lines = result.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`);
        throw new Error(`Invalid environment configuration:\n${lines.join('\n')}`);
    }
    return Object.freeze(result.data);
}
