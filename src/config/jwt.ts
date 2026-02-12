import './env';

import type jwt from 'jsonwebtoken';

export const jwtConfig = {
    accessTokenExpiresIn: process.env
        .JWT_ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    accessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET as jwt.Secret,
    refreshTokenExpiresIn: process.env
        .JWT_REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET as jwt.Secret,
};
