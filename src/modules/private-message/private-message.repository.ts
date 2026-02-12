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
            privateConversationId: data.private_conversation_id,
            content: data.content,
            senderId: senderId,
        },
    });
};

export const formatPrivateMessageForSocket = async (
    messageId: string
): Promise<SocketPrivateMessagePayload> => {
    const message = await prisma.privateMessage.findUnique({
        where: { id: messageId },
        include: {
            _count: {
                select: { reads: true },
            },
        },
    });

    if (!message) {
        throw createHttpError('Private message not found.', 404);
    }

    return {
        id: message.id,
        content: message.isDeleted ? null : message.content,
        senderId: message.senderId,
        isDeleted: message.isDeleted,
        createdAt: message.createdAt,
        readsCount: message._count.reads,
    };
};

export const findPrivateMessageInConversationById = async (
    messageId: string,
    conversationId: string
): Promise<{ createdAt: Date } | null> => {
    return await prisma.privateMessage.findFirst({
        where: {
            id: messageId,
            privateConversationId: conversationId,
        },
        select: {
            createdAt: true,
        },
    });
};

export const findUnreadPrivateMessageIdsInConversation = async (
    conversationId: string,
    receiverId: string,
    lastReadMessageCreatedAt: Date
): Promise<string[]> => {
    const unreadMessages = await prisma.privateMessage.findMany({
        where: {
            privateConversationId: conversationId,
            senderId: {
                not: receiverId,
            },
            createdAt: {
                lte: lastReadMessageCreatedAt,
            },
            reads: {
                none: {
                    receiverId,
                },
            },
        },
        select: {
            id: true,
        },
    });

    return unreadMessages.map((message) => message.id);
};
