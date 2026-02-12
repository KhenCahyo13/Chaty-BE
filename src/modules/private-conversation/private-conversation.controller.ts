import { toHttpError } from '@lib/http-error';
import { errorResponse, successResponse } from '@lib/response';
import { mapZodIssues } from '@lib/validation-error';
import {
    authenticateUser,
    type AuthRequest,
} from '@modules/auth/auth.middleware';
import { Router } from 'express';

import { findAllPrivateConversationsByUserId } from './private-conversation.repository';
import {
    createPrivateConversationSchema,
    markPrivateConversationAsReadSchema,
} from './private-conversation.schema';
import {
    createPrivateConversation,
    getPrivateConversationDetailsById,
    getPrivateConversationMessagesById,
    markPrivateConversationAsRead,
} from './private-conversation.service';

const router = Router();

router.get('', authenticateUser, async (req, res) => {
    try {
        const { userId } = (req as AuthRequest).auth;
        const { limit, search, cursor } = req.query;
        const result = await findAllPrivateConversationsByUserId(
            limit ? parseInt(limit as string, 10) : 10,
            search as string | undefined,
            userId,
            cursor as string | undefined
        );

        return res.json(
            successResponse(
                'Private conversations retrieved successfully.',
                result.conversations,
                {
                    nextCursor: result.nextCursor,
                }
            )
        );
    } catch (error) {
        const { statusCode, message, errors } = toHttpError(error);
        return res.status(statusCode).json(errorResponse(message, errors));
    }
});

router.get('/:id', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
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

router.get('/:id/messages', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { limit, cursor } = req.query;
        const { userId } = (req as AuthRequest).auth;

        const result = await getPrivateConversationMessagesById(
            id as string,
            userId,
            limit ? parseInt(limit as string, 10) : 10,
            cursor as string | undefined
        );

        return res.json(
            successResponse(
                'Private conversation messages retrieved successfully.',
                result.messages,
                {
                    nextCursor: result.nextCursor,
                }
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

router.post('/:id/read', authenticateUser, async (req, res) => {
    const parsed = markPrivateConversationAsReadSchema.safeParse(req.body ?? {});
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
        const { id } = req.params;
        const { userId } = (req as AuthRequest).auth;
        const result = await markPrivateConversationAsRead(
            id as string,
            userId,
            parsed.data
        );

        return res.json(
            successResponse('Private conversation marked as read.', {
                message_ids: result.messageIds,
                read_at: result.readAt,
            })
        );
    } catch (error) {
        const { statusCode, message, errors } = toHttpError(error);
        return res.status(statusCode).json(errorResponse(message, errors));
    }
});

export default router;
