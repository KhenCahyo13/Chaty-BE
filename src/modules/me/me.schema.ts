import { z } from 'zod';

export const updateMeProfileSchema = z.object({
    fullName: z
        .string()
        .trim()
        .min(1, 'Full name is required.')
        .max(255, 'Full name maximum 255 characters.'),
    about: z
        .string()
        .trim()
        .max(100, 'About maximum 100 characters.')
        .optional()
        .transform((value) => (value === undefined || value === '' ? null : value)),
});
