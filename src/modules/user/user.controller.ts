import { Router } from 'express';
import { getAllUsers } from './user.service';
import { errorResponse, successResponse } from '@lib/response';
import { toHttpError } from '@lib/http-error';
import { authenticateUser, AuthRequest } from '@modules/auth/auth.middleware';

const router = Router();

router.get('', authenticateUser, async (req, res) => {
    try {
        const { limit, search } = req.query;
        const { userId } = (req as AuthRequest).auth;

        const result = await getAllUsers(
            userId,
            limit ? parseInt(limit as string, 10) : 20,
            search ? (search as string) : ''
        );

        return res.json(
            successResponse(
                'Users retrieved successfully.',
                result
            )
        );
    } catch (error) {
        const { statusCode, message, errors } = toHttpError(error);
        return res.status(statusCode).json(errorResponse(message, errors));
    }
})

export default router;