import { toHttpError } from '@lib/http-error';
import { errorResponse } from '@lib/response';
import type { NextFunction, Request, Response } from 'express';

import { verifyAccessToken } from './auth.helpers';
import { AuthRequest } from './auth.types';

export const authenticateUser = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        res.status(401).json(errorResponse('Access token is not valid.'));
        return;
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
        res.status(401).json(errorResponse('Access token is not valid.'));
        return;
    }

    try {
        const payload = verifyAccessToken(token);
        (req as AuthRequest).auth = payload;
        next();
    } catch (error) {
        const { errors, message, statusCode } = toHttpError(error);
        res.status(statusCode).json(errorResponse(message, errors));
    }
};
