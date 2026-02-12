import { HttpError } from '@lib/http-error';

export type AuthUser = {
    email: string;
    id: string;
    username: string;
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
    device_id?: string;
    fcm_token: string;
    platform: 'android' | 'ios' | 'web';
};

export type AuthError = HttpError;

export type FcmNotificationPayload = {
    body: string;
    data?: Record<string, string>;
    title: string;
};

export type GoogleOAuthTokenResponse = {
    access_token: string;
    expires_in: number;
};
