import { createHttpError } from '@lib/http-error';
import { io } from '@lib/socket/socket';
import {
    findPrivateMessageInConversationById,
    findUnreadPrivateMessageIdsInConversation,
} from '@modules/private-message/private-message.repository';
import { storePrivateMessageReads } from '@modules/private-message-read/private-message-read.repository';

import {
    invalidatePrivateConversationCacheByConversationId,
    invalidatePrivateConversationCacheByUserIds,
} from './private-conversation.cache';
import { PrivateConversation } from './private-conversation.model';
import {
    checkPrivateConversationRoomExistence,
    findAllPrivateConversationsByUserId,
    findPrivateConversationDetailsById,
    findPrivateConversationMessagesById,
    findPrivateConversationUserIdsById,
    storePrivateConversation,
} from './private-conversation.repository';
import {
    CreatePrivateConversationPayload,
    MarkPrivateConversationAsReadValues,
    type PrivateConversationListItem,
    PrivateConversationReadReceiptResult,
    SocketPrivateMessageReadPayload,
} from './private-conversation.types';

export const getAllPrivateConversationsByUserId = async (
    limit: number,
    search: string | undefined,
    userId: string,
    cursor?: string
): Promise<{
    conversations: PrivateConversationListItem[];
    nextCursor: null | string;
}> => {
    return await findAllPrivateConversationsByUserId(
        limit,
        search,
        userId,
        cursor
    );
};

export const getPrivateConversationDetailsById = async (
    id: string,
    userId: string
) => {
    const data = await findPrivateConversationDetailsById(id, userId);

    if (!data) {
        throw createHttpError('Private conversation not found.', 404);
    }

    return data;
};

export const getPrivateConversationMessagesById = async (
    id: string,
    userId: string,
    limit: number,
    cursor?: string
) => {
    const data = await findPrivateConversationMessagesById(
        id,
        userId,
        limit,
        cursor
    );

    if (!data) {
        throw createHttpError('Private conversation not found.', 404);
    }

    return data;
};

export const createPrivateConversation = async (
    data: CreatePrivateConversationPayload
): Promise<null | PrivateConversation> => {
    if (data.user1Id === data.user2Id) {
        throw createHttpError(
            'Cannot create a private conversation with yourself.',
            400
        );
    }

    const privateConversationRoom = await checkPrivateConversationRoomExistence(
        data.user1Id,
        data.user2Id
    );

    if (privateConversationRoom) {
        return privateConversationRoom;
    }

    const createdConversation = await storePrivateConversation(data);

    await invalidatePrivateConversationCacheByUserIds([
        createdConversation.user1Id,
        createdConversation.user2Id,
    ]);

    return createdConversation;
};

export const markPrivateConversationAsRead = async (
    id: string,
    userId: string,
    data: MarkPrivateConversationAsReadValues
): Promise<PrivateConversationReadReceiptResult> => {
    const conversationUsersIds = await findPrivateConversationUserIdsById(id);

    if (
        !conversationUsersIds ||
        (conversationUsersIds.user1Id !== userId &&
            conversationUsersIds.user2Id !== userId)
    ) {
        throw createHttpError('Private conversation not found.', 404);
    }

    const lastReadMessage = await findPrivateMessageInConversationById(
        data.last_read_message_id,
        id
    );
    if (!lastReadMessage) {
        throw createHttpError('Private message not found.', 404);
    }

    const messageIds = await findUnreadPrivateMessageIdsInConversation(
        id,
        userId,
        lastReadMessage.createdAt
    );
    const readAt = new Date();
    await storePrivateMessageReads(messageIds, userId, readAt);

    const receiverId =
        conversationUsersIds.user1Id === userId
            ? conversationUsersIds.user2Id
            : conversationUsersIds.user1Id;

    await Promise.all([
        invalidatePrivateConversationCacheByConversationId(id),
        invalidatePrivateConversationCacheByUserIds([
            userId,
            receiverId as string,
        ]),
    ]);

    if (messageIds.length) {
        const socketPayload: SocketPrivateMessageReadPayload = {
            messageIds: messageIds,
            privateConversationId: id,
            readAt: readAt,
            readerId: userId,
        };

        io.to(`user:${receiverId}`).emit('private-message:read', socketPayload);
    }

    return {
        messageIds,
        readAt,
    };
};
