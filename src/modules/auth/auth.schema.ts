import { z } from 'zod';

export const loginSchema = z.object({
    username: z.string().min(1, 'Username is required.'),
    password: z.string().min(1, 'Password is required.'),
});

export const refreshSchema = z.object({
    refresh_token: z.string().min(1, 'Refresh token is required.'),
});
