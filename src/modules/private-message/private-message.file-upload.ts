import { extname } from 'node:path';

import { createHttpError, toHttpError } from '@lib/http-error';
import { errorResponse } from '@lib/response';
import { NextFunction, Request, Response } from 'express';
import multer from 'multer';

const MAX_CHAT_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_CHAT_FILES_COUNT = 10;
const ALLOWED_AUDIO_EXTENSIONS = new Set([
    '.aac',
    '.m4a',
    '.mp3',
    '.ogg',
    '.wav',
    '.webm',
]);
const ALLOWED_CHAT_FILE_EXTENSIONS = new Set([
    '.bmp',
    '.csv',
    '.doc',
    '.docx',
    '.gif',
    '.heic',
    '.heif',
    '.jpeg',
    '.jpg',
    '.ods',
    '.odt',
    '.pdf',
    '.png',
    '.ppt',
    '.pptx',
    '.txt',
    '.webp',
    '.xls',
    '.xlsx',
]);
const INVALID_AUDIO_FILE_ERROR_CODE = 'INVALID_AUDIO_FILE';
const INVALID_CHAT_FILE_ERROR_CODE = 'INVALID_CHAT_FILE';

const uploadPrivateMessageFiles = multer({
    fileFilter: (_req, file, callback) => {
        const extension = extname(file.originalname).toLowerCase();
        const isAudioField = file.fieldname === 'audio';
        const isFilesField = file.fieldname === 'files';

        if (isAudioField) {
            const isAllowedMimeType = file.mimetype.startsWith('audio/');
            const isAllowedExtension = ALLOWED_AUDIO_EXTENSIONS.has(extension);

            if (!isAllowedMimeType || !isAllowedExtension) {
                callback(new Error(INVALID_AUDIO_FILE_ERROR_CODE));
                return;
            }

            callback(null, true);
            return;
        }

        if (isFilesField) {
            const isAllowedExtension =
                ALLOWED_CHAT_FILE_EXTENSIONS.has(extension);

            if (!isAllowedExtension) {
                callback(new Error(INVALID_CHAT_FILE_ERROR_CODE));
                return;
            }

            callback(null, true);
            return;
        }

        callback(new Error(INVALID_CHAT_FILE_ERROR_CODE));
    },
    limits: {
        fileSize: MAX_CHAT_FILE_SIZE_BYTES,
    },
    storage: multer.memoryStorage(),
});

export const uploadPrivateMessageFilesMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    uploadPrivateMessageFiles.fields([
        { maxCount: 1, name: 'audio' },
        { maxCount: MAX_CHAT_FILES_COUNT, name: 'files' },
    ])(req, res, (error: unknown) => {
        if (!error) {
            next();
            return;
        }

        if (
            error instanceof multer.MulterError &&
            error.code === 'LIMIT_FILE_SIZE'
        ) {
            const maxSizeMb = Math.floor(
                MAX_CHAT_FILE_SIZE_BYTES / 1024 / 1024
            );
            const { errors, message, statusCode } = toHttpError(
                createHttpError(`Maximum file size is ${maxSizeMb}MB.`, 400)
            );
            res.status(statusCode).json(errorResponse(message, errors));
            return;
        }

        if (
            error instanceof multer.MulterError &&
            error.code === 'LIMIT_UNEXPECTED_FILE'
        ) {
            const { errors, message, statusCode } = toHttpError(
                createHttpError(
                    `Maximum files upload is ${MAX_CHAT_FILES_COUNT}.`,
                    400
                )
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

        if (
            error instanceof Error &&
            error.message === INVALID_CHAT_FILE_ERROR_CODE
        ) {
            const { errors, message, statusCode } = toHttpError(
                createHttpError(
                    'File harus memiliki ekstensi yang didukung: image, pdf, doc, docx, csv, xls, xlsx, ppt, pptx, txt, odt, ods.',
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
