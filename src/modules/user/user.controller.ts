import { toHttpError } from '@lib/http-error';
import { errorResponse, successResponse } from '@lib/response';
import { authenticateUser, AuthRequest } from '@modules/auth/auth.middleware';
import { Router } from 'express';

import { getAllUsers } from './user.service';

const router = Router();

router.get('', authenticateUser, async (req, res) => {
    try {
        const { cursor, limit, search } = req.query;
        const { userId } = (req as AuthRequest).auth;

        const result = await getAllUsers(
            userId,
            limit ? parseInt(limit as string, 10) : 20,
            search ? (search as string) : '',
            cursor as string | undefined
        );

        return res.json(
            successResponse('Users retrieved successfully.', result.users, {
                nextCursor: result.nextCursor,
            })
        );
    } catch (error) {
        const { errors, message, statusCode } = toHttpError(error);
        return res.status(statusCode).json(errorResponse(message, errors));
    }
});

export default router;
