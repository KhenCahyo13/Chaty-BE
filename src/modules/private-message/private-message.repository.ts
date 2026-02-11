import prisma from '@lib/prisma';
import { CreatePrivateMessageValues } from './private-message.types';
import { PrivateMessage } from './private-message.model';

export const storePrivateMessage = async (
    data: CreatePrivateMessageValues,
    senderId: string
): Promise<PrivateMessage> => {
    return await prisma.privateMessage.create({
        data: {
            privateConversationId: data.private_conversation_id,
            content: data.content,
            senderId: senderId,
        },
    });
}