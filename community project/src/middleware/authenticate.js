import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';

export function authenticate(secret) {
    return (req, res, next) => {
        const authorization = req.get('authorization');
        const [scheme, token, extra] = authorization?.split(' ') ?? [];
        if (scheme !== 'Bearer' || !token || extra) {
            return next(new ApiError(401, 'AUTH_REQUIRED', 'Sign in to continue'));
        }

        try {
            req.auth = jwt.verify(token, secret, { algorithms: ['HS256'] });
            return next();
        } catch {
            return next(new ApiError(401, 'INVALID_TOKEN', 'Your session is invalid or expired'));
        }
    };
}

export function authorize(...roles) {
    return (req, res, next) => {
        if (!req.auth || !roles.includes(req.auth.role)) {
            return next(new ApiError(403, 'FORBIDDEN', 'You do not have permission to perform this action'));
        }
        return next();
    };
}
