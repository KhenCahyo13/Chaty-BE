import { toHttpError } from '@lib/http-error';
import { errorResponse, successResponse } from '@lib/response';
import { authenticateUser, AuthRequest } from '@modules/auth/auth.middleware';
import { Router } from 'express';

import { getProfile } from './me.service';

const router = Router();

router.get('', authenticateUser, async (req, res) => {
    try {
        const { userId } = (req as AuthRequest).auth;

        const result = await getProfile(userId);

        return res.json(
            successResponse('Users retrieved successfully.', result)
        );
    } catch (error) {
        const { statusCode, message, errors } = toHttpError(error);
        return res.status(statusCode).json(errorResponse(message, errors));
    }
});

export default router;
