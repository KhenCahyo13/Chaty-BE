import z from 'zod';

export const createPrivateMessageSchema = z.object({
    private_conversation_id: z.uuid(
        'Invalid conversation id format. Must be a valid UUID.'
    ),
    content: z.string().min(1, 'Message content cannot be empty.'),
});
