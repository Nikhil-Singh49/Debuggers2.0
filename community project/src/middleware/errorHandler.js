import { ApiError } from '../utils/ApiError.js';

export function notFound(req, res, next) {
    next(new ApiError(404, 'NOT_FOUND', 'Route not found'));
}

// Express recognises error middleware by its 4-argument signature.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
    if (res.headersSent) return next(err);

    let status = 500;
    let code = 'INTERNAL_ERROR';
    let message = 'Something went wrong. Please try again later.';
    let details;

    if (err instanceof ApiError) {
        ({ status, code, message, details } = err);
    } else if (err?.name === 'ZodError' && Array.isArray(err.issues)) {
        status = 422;
        code = 'VALIDATION_ERROR';
        message = 'Some fields are invalid';
        details = err.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
    } else if (err?.type === 'entity.parse.failed') {
        status = 400;
        code = 'INVALID_JSON';
        message = 'Request body is not valid JSON';
    } else if (err?.type === 'entity.too.large') {
        status = 413;
        code = 'PAYLOAD_TOO_LARGE';
        message = 'Request body is too large';
    }

    // Stack traces and internal messages go to the server log only.
    if (status >= 500) req.log.error({ err }, 'Unhandled error');

    const body = { error: { code, message, requestId: req.id } };
    if (details) body.error.details = details;
    return res.status(status).json(body);
}
