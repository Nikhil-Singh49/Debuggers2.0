import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/authenticate.js';
import { ApiError } from '../utils/ApiError.js';

const loginSchema = z.object({
    email: z.string().trim().min(1).max(255),
    password: z.string().min(1).max(128),
    role: z.enum(['Admin', 'Teacher', 'Accounts', 'Student']).optional(),
});
const profileSchema = z.object({
    displayName: z.string().trim().min(1).max(100),
});
const roles = new Map(['Admin', 'Teacher', 'Accounts', 'Student'].map((role) => [role.toLowerCase(), role]));

export function authRouter({ env, findUser, getPool }) {
    const router = Router();

    router.post('/auth/login', async (req, res, next) => {
        try {
            const { email, password, role } = loginSchema.parse(req.body);
            const user = await findUser(email);
            const canonicalRole = roles.get(user?.role?.toLowerCase());
            if (
                !user ||
                user.status?.toLowerCase() !== 'active' ||
                !canonicalRole ||
                typeof user.password !== 'string' ||
                !(await bcrypt.compare(password, user.password))
            ) {
                throw new ApiError(401, 'INVALID_CREDENTIALS', 'User ID, email, or password is incorrect');
            }

            if (role && canonicalRole !== role) {
                throw new ApiError(403, 'ROLE_MISMATCH', `This account is registered as ${canonicalRole}. Select that role and try again.`);
            }

            const token = jwt.sign(
                { role: canonicalRole, username: user.username },
                env.JWT_SECRET,
                { algorithm: 'HS256', subject: String(user.userId), expiresIn: env.JWT_EXPIRES_IN },
            );
            const displayName = user.displayName || user.name;
            res.json({
                token,
                user: {
                    id: user.userId,
                    name: user.name,
                    displayName,
                    initials: displayName.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
                    email: user.username,
                    greeting: displayName.split(/\s+/)[0],
                    role: canonicalRole,
                },
            });
        } catch (error) {
            next(error);
        }
    });

    router.get('/auth/me', authenticate(env.JWT_SECRET), (req, res) => {
        res.json({
            id: Number(req.auth.sub),
            email: req.auth.username,
            role: req.auth.role,
        });
    });

    router.put(
        '/auth/profile',
        authenticate(env.JWT_SECRET),
        authorize('Teacher', 'Accounts', 'Student'),
        async (req, res, next) => {
            try {
                const { displayName } = profileSchema.parse(req.body);
                const pool = await getPool();
                await pool.request()
                    .input('userId', Number(req.auth.sub))
                    .input('displayName', displayName)
                    .query(`
                        UPDATE dbo.user_profiles
                        SET display_name = @displayName, updated_at = SYSDATETIME()
                        WHERE user_id = @userId;

                        IF @@ROWCOUNT = 0
                            INSERT INTO dbo.user_profiles (user_id, display_name)
                            VALUES (@userId, @displayName);
                    `);
                res.json({ displayName });
            } catch (error) {
                next(error);
            }
        },
    );

    return router;
}
