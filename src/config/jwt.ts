import './env';

import type jwt from 'jsonwebtoken';

export const jwtConfig = {
    accessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET as jwt.Secret,
    refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET as jwt.Secret,
    accessTokenExpiresIn: process.env
        .JWT_ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    refreshTokenExpiresIn: process.env
        .JWT_REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'],
};
