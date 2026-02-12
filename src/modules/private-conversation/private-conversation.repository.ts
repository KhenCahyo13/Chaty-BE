import prisma from '@lib/prisma';
import { getCache, setCache } from '@lib/redis';
import { createSignedUrl } from '@lib/supabase-storage';

import { SUPABASE_STORAGE_SIGNED_URL_EXPIRES_IN } from '@constants/storage';

import {
    buildPrivateConversationDetailsCacheKey,
    buildPrivateConversationListCacheKey,
    buildPrivateConversationMessagesCacheKey,
} from './private-conversation.cache';
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
    nextCursor: null | string;
}> => {
    const cacheKey = buildPrivateConversationListCacheKey(
        userId,
        limit,
        search,
        cursor
    );
    const cached = await getCache<{
        conversations: PrivateConversationListItem[];
        nextCursor: null | string;
    }>(cacheKey);

    if (cached) {
        return cached;
    }

    const conversations = await prisma.privateConversation.findMany({
        orderBy: {
            createdAt: 'desc',
        },
        take: limit,
        ...(cursor && {
            cursor: { id: cursor },
            skip: 1,
        }),
        include: {
            _count: {
                select: {
                    messages: {
                        where: {
                            reads: {
                                none: {
                                    receiverId: userId,
                                },
                            },
                            senderId: {
                                not: userId,
                            },
                        },
                    },
                },
            },
            messages: {
                orderBy: {
                    createdAt: 'desc',
                },
                select: {
                    ...lastMessageListSelect,
                    _count: {
                        select: {
                            reads: true,
                        },
                    },
                },
                take: 1,
            },
            user1: {
                select: userListSelect,
            },
            user2: {
                select: userListSelect,
            },
        },
        where: {
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
            OR: [{ user1Id: userId }, { user2Id: userId }],
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
                      content: message.isDeleted ? null : message.content,
                      isMe: message.senderId === userId,
                      isRead: _count.reads > 0,
                  };
              })()
            : null;

        return {
            createdAt: conversation.createdAt,
            id: conversation.id,
            lastMessage,
            sender,
            unreadMessageCount: conversation._count.messages,
            updatedAt: conversation.updatedAt,
        };
    });

    const result = {
        conversations: mappedConversations,
        nextCursor: mappedConversations.length
            ? mappedConversations[mappedConversations.length - 1].id
            : null,
    };

    await setCache(cacheKey, result);

    return result;
};

export const findPrivateConversationDetailsById = async (
    id: string,
    userId: string
) => {
    const cacheKey = buildPrivateConversationDetailsCacheKey(id, userId);
    const cached = await getCache<{
        createdAt: Date;
        id: string;
        receiver: Record<string, unknown>;
        updatedAt: Date;
    }>(cacheKey);

    if (cached) {
        return cached;
    }

    const conversation = await prisma.privateConversation.findFirst({
        include: {
            user1: {
                select: userListSelect,
            },
            user2: {
                select: userListSelect,
            },
        },
        where: {
            id: id,
            OR: [{ user1Id: userId }, { user2Id: userId }],
        },
    });

    if (!conversation) {
        return null;
    }

    const result = {
        createdAt: conversation.createdAt,
        id: conversation.id,
        receiver:
            conversation.user1Id === userId
                ? conversation.user2
                : conversation.user1,
        updatedAt: conversation.updatedAt,
    };

    await setCache(cacheKey, result);

    return result;
};

export const findPrivateConversationMessagesById = async (
    id: string,
    userId: string,
    limit: number,
    cursor?: string
) => {
    const audioBucket = process.env.SUPABASE_STORAGE_AUDIO_BUCKET;
    const filesBucket = process.env.SUPABASE_STORAGE_FILES_BUCKET;
    const cacheKey = buildPrivateConversationMessagesCacheKey(
        id,
        userId,
        limit,
        cursor
    );
    const cached = await getCache<{
        messages: Array<{
            audioUrl: null | string;
            content: null | string;
            createdAt: Date;
            fileUrls: string[];
            id: string;
            isDeleted: boolean;
            isMe: boolean;
            isRead: boolean;
            messageType: 'AUDIO' | 'FILE' | 'TEXT';
        }>;
        nextCursor: null | string;
    }>(cacheKey);

    if (cached) {
        return cached;
    }

    const conversation = await prisma.privateConversation.findFirst({
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
                    attachments: {
                        orderBy: {
                            id: 'asc',
                        },
                        select: {
                            fileUrl: true,
                        },
                    },
                },
            },
        },
        where: {
            id: id,
            OR: [{ user1Id: userId }, { user2Id: userId }],
        },
    });

    if (!conversation) {
        return null;
    }

    const messages = await Promise.all(
        conversation.messages.map(async (message) => {
            const { _count, attachments, ...msg } = message;
            const audioPath =
                msg.messageType === 'AUDIO' ? attachments[0]?.fileUrl : null;
            const filePaths =
                msg.messageType === 'FILE'
                    ? attachments.map((attachment) => attachment.fileUrl)
                    : [];
            const audioUrl =
                !msg.isDeleted && audioPath && audioBucket
                    ? (
                          await createSignedUrl({
                              bucket: audioBucket,
                              expiresIn:
                                  SUPABASE_STORAGE_SIGNED_URL_EXPIRES_IN,
                              path: audioPath,
                          })
                      ).signedUrl
                    : null;
            const fileUrls =
                !msg.isDeleted && filesBucket && filePaths.length
                    ? await Promise.all(
                          filePaths.map(async (filePath) => {
                              return (
                                  await createSignedUrl({
                                      bucket: filesBucket,
                                      expiresIn:
                                          SUPABASE_STORAGE_SIGNED_URL_EXPIRES_IN,
                                      path: filePath,
                                  })
                              ).signedUrl;
                          })
                      )
                    : [];

            return {
                audioUrl,
                content: msg.isDeleted ? null : msg.content,
                createdAt: msg.createdAt,
                fileUrls,
                id: msg.id,
                isDeleted: msg.isDeleted,
                isMe: msg.senderId === userId,
                isRead: msg.senderId === userId ? _count.reads > 0 : true,
                messageType: msg.messageType,
            };
        })
    );

    const result = {
        messages,
        nextCursor: messages.length ? messages[messages.length - 1].id : null,
    };

    await setCache(cacheKey, result);

    return result;
};

export const findPrivateConversationUserIdsById = async (
    id: string
): Promise<null | Partial<PrivateConversation>> => {
    const conversation = await prisma.privateConversation.findUnique({
        select: conversationUserIdsSelect,
        where: {
            id: id,
        },
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
): Promise<null | PrivateConversation> => {
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
