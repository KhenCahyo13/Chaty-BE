import z from 'zod';

import { createPrivateMessageSchema } from './private-message.schema';

export type CreatePrivateMessageValues = z.infer<
    typeof createPrivateMessageSchema
>;

export interface SocketPrivateMessagePayload {
    audioUrl: null | string;
    content: null | string;
    createdAt: Date;
    id: string;
    isDeleted: boolean;
    messageType: 'AUDIO' | 'TEXT';
    readsCount: number;
    senderId: string;
}

export interface SocketPrivateMessageCreatedPayload {
    message: SocketPrivateMessagePayload;
    private_conversation_id: string;
}
