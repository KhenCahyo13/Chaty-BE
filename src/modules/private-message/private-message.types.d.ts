import z from 'zod';

import { createPrivateMessageSchema } from './private-message.schema';

export type CreatePrivateMessageValues = z.infer<
    typeof createPrivateMessageSchema
>;

export interface SocketPrivateMessagePayload {
    content: null | string;
    createdAt: Date;
    id: string;
    isDeleted: boolean;
    readsCount: number;
    senderId: string;
}

export interface SocketPrivateMessageCreatedPayload {
    message: SocketPrivateMessagePayload;
    private_conversation_id: string;
}
