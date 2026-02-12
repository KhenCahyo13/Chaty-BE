import z from 'zod';

export const createPrivateMessageSchema = z.object({
    content: z
        .string()
        .trim()
        .optional()
        .transform((value) =>
            value === undefined || value === '' ? null : value
        ),
    message_type: z.enum(['AUDIO', 'FILE', 'TEXT']).default('TEXT'),
    private_conversation_id: z.uuid(
        'Invalid conversation id format. Must be a valid UUID.'
    ),
});
