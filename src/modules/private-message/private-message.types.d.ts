import z from 'zod';

import { createPrivateMessageSchema } from './private-message.schema';

export type CreatePrivateMessageValues = z.infer<
    typeof createPrivateMessageSchema
>;

export interface SocketPrivateMessagePayload {
    id: string;
    content: string | null;
    senderId: string;
    isDeleted: boolean;
    createdAt: Date;
    readsCount: number;
}

export interface SocketPrivateMessageCreatedPayload {
    private_conversation_id: string;
    message: SocketPrivateMessagePayload;
}
