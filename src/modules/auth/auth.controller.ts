import { toHttpError } from '@lib/http-error';
import { errorResponse, successResponse } from '@lib/response';
import { mapZodIssues } from '@lib/validation-error';
import { authenticateUser, AuthRequest } from '@modules/auth/auth.middleware';
import { Router } from 'express';

import { loginSchema, refreshSchema } from './auth.schema';
import { login, logout, refresh } from './auth.service';

const router = Router();

router.post('/login', async (req, res) => {
    const parsed = loginSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
        return res
            .status(400)
            .json(
                errorResponse(
                    'Payload is not valid.',
                    mapZodIssues(parsed.error.issues)
                )
            );
    }

    try {
        const result = await login(parsed.data.username, parsed.data.password);
        return res.json(
            successResponse('Login successful.', result.user, {
                access_token: result.access_token,
                refresh_token: result.refresh_token,
            })
        );
    } catch (error) {
        const { statusCode, message, errors } = toHttpError(error);
        return res.status(statusCode).json(errorResponse(message, errors));
    }
});

router.post('/refresh', async (req, res) => {
    const parsed = refreshSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
        return res
            .status(400)
            .json(
                errorResponse(
                    'Payload is not valid.',
                    mapZodIssues(parsed.error.issues)
                )
            );
    }

    try {
        const result = await refresh(parsed.data.refresh_token);
        return res.json(
            successResponse('Token refreshed.', null, {
                access_token: result.access_token,
                refresh_token: result.refresh_token,
            })
        );
    } catch (error) {
        const { statusCode, message, errors } = toHttpError(error);
        return res.status(statusCode).json(errorResponse(message, errors));
    }
});

router.post('/logout', authenticateUser, async (req, res) => {
    try {
        const { userId } = (req as AuthRequest).auth;
        await logout(userId);
        return res.json(successResponse('Logout successful.', null));
    } catch (error) {
        const { statusCode, message, errors } = toHttpError(error);
        return res.status(statusCode).json(errorResponse(message, errors));
    }
});

export default router;
