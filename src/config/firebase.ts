import {
    FcmNotificationPayload,
    GoogleOAuthTokenResponse,
} from '@modules/auth/auth.types';
import jwt from 'jsonwebtoken';

const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
const GOOGLE_JWT_AUDIENCE = GOOGLE_OAUTH_TOKEN_URL;

let tokenCache: { accessToken: string; expiresAtMs: number } | null = null;

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

const getGoogleAccessToken = async (): Promise<string | null> => {
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
            iss: credentials.clientEmail,
            sub: credentials.clientEmail,
            aud: GOOGLE_JWT_AUDIENCE,
            scope: GOOGLE_FCM_SCOPE,
        },
        credentials.privateKey,
        {
            algorithm: 'RS256',
            expiresIn: '1h',
        }
    );

    const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion,
        }),
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
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: {
                    token,
                    notification: {
                        title: payload.title,
                        body: payload.body,
                    },
                    data: payload.data,
                },
            }),
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
