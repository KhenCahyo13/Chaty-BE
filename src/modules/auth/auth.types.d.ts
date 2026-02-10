export type AuthUser = {
    id: string;
    username: string;
    email: string;
};

export type AuthTokens = {
    access_token: string;
    refresh_token: string;
};

export type LoginResult = AuthTokens & {
    user: AuthUser;
};

export type RefreshResult = AuthTokens & {
    userId: string;
};

import type { HttpError } from '../../lib/http-error';

export type AuthError = HttpError;
