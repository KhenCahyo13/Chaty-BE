import z from 'zod';

export const createPrivateConversationSchema = z.object({
    user_2_id: z.uuid('Invalid user id format. Must be a valid UUID.'),
});

export const markPrivateConversationAsReadSchema = z.object({
    last_read_message_id: z.uuid(
        'Invalid message id format. Must be a valid UUID.'
    ),
});
