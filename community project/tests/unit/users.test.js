import { expect, it } from 'vitest';
import { createUserLookup } from '../../src/services/users.js';

it('looks up users by username or numeric user ID', async () => {
    const parameters = {};
    let queryText = '';
    const request = {
        input(name, value) {
            parameters[name] = value;
            return this;
        },
        async query(query) {
            queryText = query;
            return { recordset: [] };
        },
    };
    const findUser = createUserLookup(async () => ({ request: () => request }));

    await findUser('27');

    expect(parameters.username).toBe('27');
    expect(queryText).toContain('LOWER(u.username) = LOWER(@username)');
    expect(queryText).toContain('LOWER(CAST(u.user_id AS varchar(20))) = LOWER(@username)');
    expect(queryText).toContain('LEFT JOIN dbo.user_profiles profile ON profile.user_id = u.user_id');
});
