import { toHttpError } from '@lib/http-error';
import { errorResponse, successResponse } from '@lib/response';
import { mapZodIssues } from '@lib/validation-error';
import {
    authenticateUser,
    type AuthRequest,
} from '@modules/auth/auth.middleware';
import { Router } from 'express';

import { findAllPrivateConversationsByUserId } from './private-conversation.repository';
import { createPrivateConversationSchema } from './private-conversation.schema';
import {
    createPrivateConversation,
    getPrivateConversationDetailsById,
} from './private-conversation.service';

const router = Router();

router.get('', authenticateUser, async (req, res) => {
    try {
        const { userId } = (req as AuthRequest).auth;
        const limit = req.query.limit
            ? parseInt(req.query.limit as string, 10)
            : 20;
        const result = await findAllPrivateConversationsByUserId(limit, userId);

        return res.json(
            successResponse(
                'Private conversations retrieved successfully.',
                result
            )
        );
    } catch (error) {
        const { statusCode, message, errors } = toHttpError(error);
        return res.status(statusCode).json(errorResponse(message, errors));
    }
});

router.get('/:id', authenticateUser, async (req, res) => {
    try {
        const id = req.params.id;
        const { userId } = (req as AuthRequest).auth;
        const result = await getPrivateConversationDetailsById(
            id as string,
            userId
        );

        return res.json(
            successResponse(
                'Private conversation details retrieved successfully.',
                result
            )
        );
    } catch (error) {
        const { statusCode, message, errors } = toHttpError(error);
        return res.status(statusCode).json(errorResponse(message, errors));
    }
});

router.post('', authenticateUser, async (req, res) => {
    const parsed = createPrivateConversationSchema.safeParse(req.body ?? {});
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
        const { userId } = (req as AuthRequest).auth;
        const result = await createPrivateConversation({
            user1Id: userId,
            user2Id: parsed.data.user_2_id,
        });

        return res.json(
            successResponse(
                'Private conversation created successfully.',
                result
            )
        );
    } catch (error) {
        const { statusCode, message, errors } = toHttpError(error);
        return res.status(statusCode).json(errorResponse(message, errors));
    }
});

export default router;
