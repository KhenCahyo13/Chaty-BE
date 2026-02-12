import prisma from '@lib/prisma';

import { PrivateConversation } from './private-conversation.model';
import {
    conversationUserIdsSelect,
    detailsMessageSelect,
    lastMessageListSelect,
    userListSelect,
} from './private-conversation.select';
import {
    CreatePrivateConversationPayload,
    type PrivateConversationListItem,
} from './private-conversation.types';

export const findAllPrivateConversationsByUserId = async (
    limit: number,
    search: string | undefined,
    userId: string,
    cursor?: string
): Promise<{
    conversations: PrivateConversationListItem[];
    nextCursor: string | null;
}> => {
    const conversations = await prisma.privateConversation.findMany({
        take: limit,
        orderBy: {
            createdAt: 'desc',
        },
        ...(cursor && {
            cursor: { id: cursor },
            skip: 1,
        }),
        where: {
            OR: [{ user1Id: userId }, { user2Id: userId }],
            AND: [
                {
                    OR: [
                        {
                            user1: {
                                username: {
                                    contains: search,
                                    mode: 'insensitive',
                                },
                            },
                        },
                        {
                            user2: {
                                username: {
                                    contains: search,
                                    mode: 'insensitive',
                                },
                            },
                        },
                        {
                            user1: {
                                profile: {
                                    fullName: {
                                        contains: search,
                                        mode: 'insensitive',
                                    },
                                },
                            },
                        },
                        {
                            user2: {
                                profile: {
                                    fullName: {
                                        contains: search,
                                        mode: 'insensitive',
                                    },
                                },
                            },
                        },
                    ],
                },
            ],
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
                select: {
                    ...lastMessageListSelect,
                    _count: {
                        select: {
                            reads: {
                                where: {
                                    receiverId: userId,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    const mappedConversations = conversations.map((conversation) => {
        const sender =
            conversation.user1Id === userId
                ? conversation.user2
                : conversation.user1;
        const lastMessage = conversation.messages[0]
            ? (() => {
                  const { _count, ...message } = conversation.messages[0];

                  return {
                      ...message,
                      isMe: message.senderId === userId,
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

    return {
        conversations: mappedConversations,
        nextCursor: mappedConversations.length
            ? mappedConversations[mappedConversations.length - 1].id
            : null,
    };
};

export const findPrivateConversationDetailsById = async (
    id: string,
    userId: string
) => {
    const conversation = await prisma.privateConversation.findFirst({
        where: {
            id: id,
            OR: [{ user1Id: userId }, { user2Id: userId }],
        },
        include: {
            user1: {
                select: userListSelect,
            },
            user2: {
                select: userListSelect,
            },
        },
    });

    return {
        id: conversation?.id,
        createdAt: conversation?.createdAt,
        updatedAt: conversation?.updatedAt,
        receiver:
            conversation?.user1Id === userId
                ? conversation?.user2
                : conversation?.user1,
    };
};

export const findPrivateConversationMessagesById = async (
    id: string,
    userId: string,
    limit: number,
    cursor?: string
) => {
    const conversation = await prisma.privateConversation.findFirst({
        where: {
            id: id,
            OR: [{ user1Id: userId }, { user2Id: userId }],
        },
        include: {
            messages: {
                orderBy: { createdAt: 'desc' },
                take: limit,
                ...(cursor && {
                    cursor: { id: cursor },
                    skip: 1,
                }),
                select: {
                    ...detailsMessageSelect,
                    _count: {
                        select: { reads: true },
                    },
                },
            },
        },
    });

    const messages = conversation?.messages.map((message) => {
        const { _count, ...msg } = message;

        return {
            id: msg.id,
            content: msg.isDeleted ? null : msg.content,
            isMe: msg.senderId === userId,
            isDeleted: msg.isDeleted,
            isRead: msg.senderId === userId ? _count.reads > 0 : true,
            createdAt: msg.createdAt,
        };
    });

    return {
        messages,
        nextCursor: messages?.length ? messages[messages.length - 1].id : null,
    };
};

export const findPrivateConversationUserIdsById = async (
    id: string
): Promise<Partial<PrivateConversation> | null> => {
    const conversation = await prisma.privateConversation.findUnique({
        where: {
            id: id,
        },
        select: conversationUserIdsSelect,
    });

    return conversation;
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
