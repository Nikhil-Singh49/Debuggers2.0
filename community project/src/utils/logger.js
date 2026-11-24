import pino from 'pino';

export function createLogger(env) {
    return pino({
        level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL,
        redact: ['req.headers.authorization', 'req.headers.cookie'],
        ...(env.NODE_ENV === 'development' && {
            transport: { target: 'pino-pretty', options: { translateTime: 'SYS:HH:MM:ss' } },
        }),
    });
}
