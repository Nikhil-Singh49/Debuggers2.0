import sql from 'mssql';

let poolPromise = null;

export function getPool(env) {
    if (!poolPromise) {
        const pool = new sql.ConnectionPool({
            server: env.DB_SERVER,
            port: env.DB_PORT,
            database: env.DB_NAME,
            user: env.DB_USER,
            password: env.DB_PASSWORD,
            options: {
                encrypt: env.DB_ENCRYPT,
                trustServerCertificate: env.DB_TRUST_SERVER_CERT,
            },
            pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
            connectionTimeout: 10000,
            requestTimeout: 15000,
        });
        poolPromise = pool.connect().catch((error) => {
            poolPromise = null;
            throw error;
        });
    }
    return poolPromise;
}

export async function pingDb(env) {
    const pool = await getPool(env);
    await pool.request().query('SELECT 1 AS ok');
}

export async function closePool() {
    if (!poolPromise) return;
    const pending = poolPromise;
    poolPromise = null;
    const pool = await pending.catch(() => null);
    if (pool) await pool.close();
}
