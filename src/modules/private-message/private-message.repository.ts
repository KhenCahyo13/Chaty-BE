import prisma from '@lib/prisma';

import { PrivateMessage } from './private-message.model';
import { CreatePrivateMessageValues } from './private-message.types';

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
};
