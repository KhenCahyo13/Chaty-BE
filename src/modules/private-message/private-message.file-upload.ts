import { extname } from 'node:path';

import { createHttpError, toHttpError } from '@lib/http-error';
import { errorResponse } from '@lib/response';
import { NextFunction, Request, Response } from 'express';
import multer from 'multer';

const MAX_AUDIO_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_AUDIO_EXTENSIONS = new Set([
    '.aac',
    '.m4a',
    '.mp3',
    '.ogg',
    '.wav',
    '.webm',
]);
const INVALID_AUDIO_FILE_ERROR_CODE = 'INVALID_AUDIO_FILE';

const uploadAudio = multer({
    fileFilter: (_req, file, callback) => {
        const extension = extname(file.originalname).toLowerCase();
        const isAllowedMimeType = file.mimetype.startsWith('audio/');
        const isAllowedExtension = ALLOWED_AUDIO_EXTENSIONS.has(extension);

        if (!isAllowedMimeType || !isAllowedExtension) {
            callback(new Error(INVALID_AUDIO_FILE_ERROR_CODE));
            return;
        }

        callback(null, true);
    },
    limits: {
        fileSize: MAX_AUDIO_SIZE_BYTES,
    },
    storage: multer.memoryStorage(),
});

export const uploadAudioMessageMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    uploadAudio.single('audio')(req, res, (error: unknown) => {
        if (!error) {
            next();
            return;
        }

        if (
            error instanceof multer.MulterError &&
            error.code === 'LIMIT_FILE_SIZE'
        ) {
            const { errors, message, statusCode } = toHttpError(
                createHttpError('Maximum audio size is 20MB.', 400)
            );
            res.status(statusCode).json(errorResponse(message, errors));
            return;
        }

        if (
            error instanceof Error &&
            error.message === INVALID_AUDIO_FILE_ERROR_CODE
        ) {
            const { errors, message, statusCode } = toHttpError(
                createHttpError(
                    'Audio harus file audio dengan ekstensi: .aac, .m4a, .mp3, .ogg, .wav, .webm.',
                    400
                )
            );
            res.status(statusCode).json(errorResponse(message, errors));
            return;
        }

        const { errors, message, statusCode } = toHttpError(error);
        res.status(statusCode).json(errorResponse(message, errors));
    });
};
