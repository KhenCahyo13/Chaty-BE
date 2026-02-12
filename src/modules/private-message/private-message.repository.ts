import { createHttpError } from '@lib/http-error';
import prisma from '@lib/prisma';

import { PrivateMessage } from './private-message.model';
import {
    CreatePrivateMessageValues,
    SocketPrivateMessagePayload,
} from './private-message.types';

export const storePrivateMessage = async (
    data: CreatePrivateMessageValues,
    senderId: string
): Promise<PrivateMessage> => {
    return await prisma.privateMessage.create({
        data: {
            content: data.content,
            privateConversationId: data.private_conversation_id,
            senderId: senderId,
        },
    });
};

export const formatPrivateMessageForSocket = async (
    messageId: string
): Promise<SocketPrivateMessagePayload> => {
    const message = await prisma.privateMessage.findUnique({
        include: {
            _count: {
                select: { reads: true },
            },
        },
        where: { id: messageId },
    });

    if (!message) {
        throw createHttpError('Private message not found.', 404);
    }

    return {
        content: message.isDeleted ? null : message.content,
        createdAt: message.createdAt,
        id: message.id,
        isDeleted: message.isDeleted,
        readsCount: message._count.reads,
        senderId: message.senderId,
    };
};

export const findPrivateMessageInConversationById = async (
    messageId: string,
    conversationId: string
): Promise<null | { createdAt: Date }> => {
    return await prisma.privateMessage.findFirst({
        select: {
            createdAt: true,
        },
        where: {
            id: messageId,
            privateConversationId: conversationId,
        },
    });
};

export const findUnreadPrivateMessageIdsInConversation = async (
    conversationId: string,
    receiverId: string,
    lastReadMessageCreatedAt: Date
): Promise<string[]> => {
    const unreadMessages = await prisma.privateMessage.findMany({
        select: {
            id: true,
        },
        where: {
            createdAt: {
                lte: lastReadMessageCreatedAt,
            },
            privateConversationId: conversationId,
            reads: {
                none: {
                    receiverId,
                },
            },
            senderId: {
                not: receiverId,
            },
        },
    });

    return unreadMessages.map((message) => message.id);
};
