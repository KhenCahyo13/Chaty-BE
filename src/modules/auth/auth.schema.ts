import { z } from 'zod';

export const loginSchema = z.object({
    password: z.string().min(1, 'Password is required.'),
    username: z.string().min(1, 'Username is required.'),
});

export const refreshSchema = z.object({
    refresh_token: z.string().min(1, 'Refresh token is required.'),
});

export const registerPushTokenSchema = z.object({
    device_id: z.string().max(255).optional(),
    fcm_token: z.string().min(1, 'FCM token is required.'),
    platform: z.enum(['ios', 'android', 'web']),
});
