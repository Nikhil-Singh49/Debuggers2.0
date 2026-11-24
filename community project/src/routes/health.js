import { Router } from 'express';

export function healthRouter({ checkDb }) {
    const router = Router();

    router.get('/health', (req, res) => {
        res.json({ status: 'ok', uptimeSeconds: Math.round(process.uptime()) });
    });

    router.get('/ready', async (req, res) => {
        try {
            await checkDb();
            res.json({ status: 'ready', database: 'up' });
        } catch (err) {
            req.log.error({ err }, 'Readiness check failed');
            res.status(503).json({
                error: { code: 'DB_UNAVAILABLE', message: 'Database is not reachable', requestId: req.id },
            });
        }
    });

    return router;
}
