import { jwtConfig } from '@config/jwt';
import jwt from 'jsonwebtoken';
import { HttpError } from 'src/types/response';

import type { AuthTokens } from './auth.types';

const refreshTokenStore = new Map<string, string>();

const {
    accessTokenExpiresIn,
    accessTokenSecret,
    refreshTokenExpiresIn,
    refreshTokenSecret,
} = jwtConfig;

export const buildAccessToken = (userId: string, username?: string): string =>
    jwt.sign({ sub: userId, username }, accessTokenSecret, {
        expiresIn: accessTokenExpiresIn,
    });

export const buildRefreshToken = (userId: string): string =>
    jwt.sign({ sub: userId, type: 'refresh' }, refreshTokenSecret, {
        expiresIn: refreshTokenExpiresIn,
    });

export const createAuthError = (
    message: string,
    statusCode = 401,
    errors?: unknown
): HttpError => ({
    errors,
    message,
    statusCode,
});

export const storeRefreshToken = (
    refreshToken: string,
    userId: string
): void => {
    refreshTokenStore.set(refreshToken, userId);
};

export const revokeRefreshToken = (refreshToken: string): void => {
    refreshTokenStore.delete(refreshToken);
};

export const revokeUserRefreshTokens = (userId: string): void => {
    for (const [token, tokenUserId] of refreshTokenStore.entries()) {
        if (tokenUserId === userId) {
            refreshTokenStore.delete(token);
        }
    }
};

export const assertRefreshToken = (refreshToken: string): string => {
    if (!refreshTokenStore.has(refreshToken)) {
        throw createAuthError('Refresh token is not valid.', 401);
    }

    try {
        const payload = jwt.verify(
            refreshToken,
            refreshTokenSecret
        ) as jwt.JwtPayload;
        const userId = payload.sub;

        if (!userId || payload.type !== 'refresh') {
            throw createAuthError('Refresh token is not valid.', 401);
        }

        return String(userId);
    } catch {
        throw createAuthError('Refresh token is not valid.', 401);
    }
};

export const rotateRefreshToken = (
    refreshToken: string,
    userId: string
): AuthTokens => {
    revokeRefreshToken(refreshToken);

    const accessToken = buildAccessToken(userId);
    const newRefreshToken = buildRefreshToken(userId);

    storeRefreshToken(newRefreshToken, userId);

    return {
        access_token: accessToken,
        refresh_token: newRefreshToken,
    };
};

export const verifyAccessToken = (
    accessToken: string
): { userId: string; username?: string } => {
    try {
        const payload = jwt.verify(
            accessToken,
            accessTokenSecret
        ) as jwt.JwtPayload;
        const userId = payload.sub;

        if (!userId) {
            throw createAuthError('Access token is not valid.', 401);
        }

        const username =
            typeof payload.username === 'string' ? payload.username : undefined;

        return { userId: String(userId), username };
    } catch {
        throw createAuthError('Access token is not valid.', 401);
    }
};
