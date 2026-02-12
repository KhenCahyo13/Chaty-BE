import { extname } from 'node:path';

import { createHttpError, toHttpError } from '@lib/http-error';
import { errorResponse } from '@lib/response';
import { NextFunction, Request, Response } from 'express';
import multer from 'multer';

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const INVALID_AVATAR_FILE_ERROR_CODE = 'INVALID_AVATAR_FILE';

const uploadAvatar = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_AVATAR_SIZE_BYTES,
    },
    fileFilter: (_req, file, callback) => {
        const extension = extname(file.originalname).toLowerCase();
        const isAllowedMimeType = file.mimetype.startsWith('image/');
        const isAllowedExtension = ALLOWED_IMAGE_EXTENSIONS.has(extension);

        if (!isAllowedMimeType || !isAllowedExtension) {
            callback(new Error(INVALID_AVATAR_FILE_ERROR_CODE));
            return;
        }

        callback(null, true);
    },
});

export const uploadAvatarMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    uploadAvatar.single('avatar')(req, res, (error: unknown) => {
        if (!error) {
            next();
            return;
        }

        if (
            error instanceof multer.MulterError &&
            error.code === 'LIMIT_FILE_SIZE'
        ) {
            const { statusCode, message, errors } = toHttpError(
                createHttpError('Maximum avatar size is 2MB.', 400)
            );
            res.status(statusCode).json(errorResponse(message, errors));
            return;
        }

        if (
            error instanceof Error &&
            error.message === INVALID_AVATAR_FILE_ERROR_CODE
        ) {
            const { statusCode, message, errors } = toHttpError(
                createHttpError(
                    'Avatar harus image dengan ekstensi: .jpg, .jpeg, .png, .webp.',
                    400
                )
            );
            res.status(statusCode).json(errorResponse(message, errors));
            return;
        }

        const { statusCode, message, errors } = toHttpError(error);
        res.status(statusCode).json(errorResponse(message, errors));
    });
};
