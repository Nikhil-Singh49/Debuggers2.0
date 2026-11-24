export function createUserLookup(getPool) {
    return async (identifier) => {
        const pool = await getPool();
        const result = await pool
            .request()
            .input('username', identifier)
            .query(`
                SELECT u.user_id AS userId, u.username, u.password, u.role, u.status,
                    COALESCE(s.name, t.teacher_name, u.username) AS name,
                    profile.display_name AS displayName
                FROM dbo.users u
                LEFT JOIN dbo.students s ON s.user_id = u.user_id
                LEFT JOIN dbo.teachers t ON t.user_id = u.user_id
                LEFT JOIN dbo.user_profiles profile ON profile.user_id = u.user_id
                WHERE LOWER(u.username) = LOWER(@username)
                    OR LOWER(CAST(u.user_id AS varchar(20))) = LOWER(@username)
            `);
        return result.recordset[0] ?? null;
    };
}
