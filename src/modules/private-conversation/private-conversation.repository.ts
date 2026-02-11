import prisma from '@lib/prisma';

import { PrivateConversation } from './private-conversation.model';
import {
    lastMessageListSelect,
    userListSelect,
} from './private-conversation.select';
import {
    CreatePrivateConversationPayload,
    type PrivateConversationListItem,
} from './private-conversation.types';

export const findAllPrivateConversationsByUserId = async (
    limit: number,
    userId: string
): Promise<PrivateConversationListItem[]> => {
    const conversations = await prisma.privateConversation.findMany({
        take: limit,
        where: {
            OR: [{ user1Id: userId }, { user2Id: userId }],
            messages: {
                some: {},
            },
        },
        include: {
            user1: {
                select: userListSelect,
            },
            user2: {
                select: userListSelect,
            },
            messages: {
                take: 1,
                orderBy: {
                    createdAt: 'desc',
                },
                where: {
                    senderId: {
                        not: userId,
                    },
                },
                select: {
                    ...lastMessageListSelect,
                    _count: {
                        select: {
                            reads: {
                                where: {
                                    receiverId: userId
                                }
                            }
                        }
                    }
                }
            },
        },
    });

    return conversations.map((conversation) => {
        const sender =
            conversation.user1Id === userId
                ? conversation.user2
                : conversation.user1;
        const lastMessage = conversation.messages[0]
            ? (() => {
                const { _count, ...message } = conversation.messages[0];

                return {
                    ...message,
                    isRead: _count.reads > 0,
                    content: message.isDeleted ? null : message.content,
                };
            })()
            : null;


        return {
            id: conversation.id,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
            sender,
            lastMessage,
        };
    });
};

export const storePrivateConversation = async (
    data: CreatePrivateConversationPayload
): Promise<PrivateConversation> => {
    return await prisma.privateConversation.create({
        data: data,
    });
};

export const checkPrivateConversationRoomExistence = async (
    user1Id: string,
    user2Id: string
): Promise<PrivateConversation | null> => {
    return await prisma.privateConversation.findFirst({
        where: {
            OR: [
                {
                    user1Id: user1Id,
                    user2Id: user2Id,
                },
                {
                    user1Id: user2Id,
                    user2Id: user1Id,
                },
            ],
        },
    });
};
