import { toHttpError } from '@lib/http-error';
import { errorResponse, successResponse } from '@lib/response';
import { mapZodIssues } from '@lib/validation-error';
import { authenticateUser } from '@modules/auth/auth.middleware';
import { AuthRequest } from '@modules/auth/auth.types';
import { Router } from 'express';

import { uploadAvatarMiddleware } from './me.file-upload';
import { updateMeProfileSchema } from './me.schema';
import { getProfile, updateProfile } from './me.service';

const router = Router();

router.get('', authenticateUser, async (req, res) => {
    try {
        const { userId } = (req as AuthRequest).auth;

        const result = await getProfile(userId);

        return res.json(
            successResponse('Users retrieved successfully.', result)
        );
    } catch (error) {
        const { errors, message, statusCode } = toHttpError(error);
        return res.status(statusCode).json(errorResponse(message, errors));
    }
});

router.patch('', authenticateUser, uploadAvatarMiddleware, async (req, res) => {
    const parsed = updateMeProfileSchema.safeParse(req.body ?? {});

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

        const result = await updateProfile(userId, {
            about: parsed.data.about,
            avatarFile: req.file,
            fullName: parsed.data.fullName,
        });

        return res.json(
            successResponse('Profile updated successfully.', result)
        );
    } catch (error) {
        const { errors, message, statusCode } = toHttpError(error);
        return res.status(statusCode).json(errorResponse(message, errors));
    }
});

export default router;
