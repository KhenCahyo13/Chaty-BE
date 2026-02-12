import z from 'zod';

export const createPrivateMessageSchema = z.object({
    content: z.string().min(1, 'Message content cannot be empty.'),
    private_conversation_id: z.uuid(
        'Invalid conversation id format. Must be a valid UUID.'
    ),
});
