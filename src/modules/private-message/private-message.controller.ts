import { authenticateUser, AuthRequest } from '@modules/auth/auth.middleware';
import { Router } from 'express';
import { createPrivateMessageSchema } from './private-message.schema';
import { errorResponse, successResponse } from '@lib/response';
import { mapZodIssues } from '@lib/validation-error';
import { toHttpError } from '@lib/http-error';
import { createPrivateMessage } from './private-message.service';

const router = Router();

router.post('', authenticateUser, async (req, res) => {
    const parsed = createPrivateMessageSchema.safeParse(req.body ?? {});
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
        const result = await createPrivateMessage(parsed.data, userId);

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