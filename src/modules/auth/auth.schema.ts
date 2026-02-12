import { z } from 'zod';

export const loginSchema = z.object({
    username: z.string().min(1, 'Username is required.'),
    password: z.string().min(1, 'Password is required.'),
});

export const refreshSchema = z.object({
    refresh_token: z.string().min(1, 'Refresh token is required.'),
});

export const registerPushTokenSchema = z.object({
    fcm_token: z.string().min(1, 'FCM token is required.'),
    platform: z.enum(['ios', 'android', 'web']),
    device_id: z.string().max(255).optional(),
});
