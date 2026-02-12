import { HttpError } from '@lib/http-error';

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

export type RegisterPushTokenInput = {
    fcm_token: string;
    platform: 'ios' | 'android' | 'web';
    device_id?: string;
};

export type AuthError = HttpError;

export type FcmNotificationPayload = {
    title: string;
    body: string;
    data?: Record<string, string>;
};

export type GoogleOAuthTokenResponse = {
    access_token: string;
    expires_in: number;
};
