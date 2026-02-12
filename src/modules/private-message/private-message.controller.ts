import { toHttpError } from '@lib/http-error';
import { errorResponse, successResponse } from '@lib/response';
import { mapZodIssues } from '@lib/validation-error';
import { authenticateUser, AuthRequest } from '@modules/auth/auth.middleware';
import { Router } from 'express';

import { uploadPrivateMessageFilesMiddleware } from './private-message.file-upload';
import { createPrivateMessageSchema } from './private-message.schema';
import { createPrivateMessage } from './private-message.service';

const router = Router();

router.post(
    '',
    authenticateUser,
    uploadPrivateMessageFilesMiddleware,
    async (req, res) => {
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
            const uploadedFiles = req.files as
                | undefined
                | {
                      audio?: Express.Multer.File[];
                      files?: Express.Multer.File[];
                  };
            const result = await createPrivateMessage(parsed.data, userId, {
                audioFile: uploadedFiles?.audio?.[0],
                files: uploadedFiles?.files ?? [],
            });

            return res.json(
                successResponse(
                    'Private conversation created successfully.',
                    result
                )
            );
        } catch (error) {
            const { errors, message, statusCode } = toHttpError(error);
            return res.status(statusCode).json(errorResponse(message, errors));
        }
    }
);

export default router;
