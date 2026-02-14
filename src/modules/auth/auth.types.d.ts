import { HttpError } from '@lib/http-error';
import { Request } from 'express';

export type AuthError = HttpError;

export interface AuthUser {
    email: string;
    id: string;
    username: string;
}

export interface AuthTokens {
    access_token: string;
    refresh_token: string;
}

export interface LoginResult extends AuthTokens {
    user: AuthUser;
}

export interface RefreshResult extends AuthTokens {
    userId: string;
}

export interface RegisterPushTokenInput {
    device_id?: string;
    fcm_token: string;
    platform: 'android' | 'ios' | 'web';
}

export interface FcmNotificationPayload {
    body: string;
    data?: Record<string, string>;
    title: string;
}

export interface GoogleOAuthTokenResponse {
    access_token: string;
    expires_in: number;
}

export interface AuthRequest extends Request {
    auth: {
        userId: string;
        username?: string;
    };
}
