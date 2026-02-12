import {
    FcmNotificationPayload,
    GoogleOAuthTokenResponse,
} from '@modules/auth/auth.types';
import jwt from 'jsonwebtoken';

const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
const GOOGLE_JWT_AUDIENCE = GOOGLE_OAUTH_TOKEN_URL;

let tokenCache: null | { accessToken: string; expiresAtMs: number } = null;

const getServiceAccountCredentials = () => {
    const clientEmail = process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL;
    const privateKey =
        process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (!clientEmail || !privateKey || !projectId) {
        return null;
    }

    return { clientEmail, privateKey, projectId };
};

const getGoogleAccessToken = async (): Promise<null | string> => {
    const nowMs = Date.now();
    if (tokenCache && tokenCache.expiresAtMs > nowMs + 30_000) {
        return tokenCache.accessToken;
    }

    const credentials = getServiceAccountCredentials();
    if (!credentials) {
        return null;
    }

    const assertion = jwt.sign(
        {
            aud: GOOGLE_JWT_AUDIENCE,
            iss: credentials.clientEmail,
            scope: GOOGLE_FCM_SCOPE,
            sub: credentials.clientEmail,
        },
        credentials.privateKey,
        {
            algorithm: 'RS256',
            expiresIn: '1h',
        }
    );

    const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
        body: new URLSearchParams({
            assertion,
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        }),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
    });

    if (!response.ok) {
        return null;
    }

    const result = (await response.json()) as GoogleOAuthTokenResponse;
    tokenCache = {
        accessToken: result.access_token,
        expiresAtMs: nowMs + result.expires_in * 1000,
    };

    return result.access_token;
};

const sendFcmMessage = async (
    token: string,
    payload: FcmNotificationPayload
): Promise<void> => {
    const credentials = getServiceAccountCredentials();
    if (!credentials) {
        return;
    }

    const accessToken = await getGoogleAccessToken();
    if (!accessToken) {
        return;
    }

    await fetch(
        `https://fcm.googleapis.com/v1/projects/${credentials.projectId}/messages:send`,
        {
            body: JSON.stringify({
                message: {
                    data: payload.data,
                    notification: {
                        body: payload.body,
                        title: payload.title,
                    },
                    token,
                },
            }),
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            method: 'POST',
        }
    );
};

export const sendFcmNotificationToTokens = async (
    tokens: string[],
    payload: FcmNotificationPayload
): Promise<void> => {
    if (!tokens.length) {
        return;
    }

    await Promise.all(tokens.map((token) => sendFcmMessage(token, payload)));
};
