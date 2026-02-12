import { createHttpError } from '@lib/http-error';

import { PrivateConversation } from './private-conversation.model';
import {
    checkPrivateConversationRoomExistence,
    findAllPrivateConversationsByUserId,
    findPrivateConversationDetailsById,
    findPrivateConversationMessagesById,
    storePrivateConversation,
} from './private-conversation.repository';
import {
    CreatePrivateConversationPayload,
    type PrivateConversationListItem,
} from './private-conversation.types';

export const getAllPrivateConversationsByUserId = async (
    limit: number,
    search: string | undefined,
    userId: string
): Promise<PrivateConversationListItem[]> => {
    return await findAllPrivateConversationsByUserId(limit, search, userId);
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
): Promise<PrivateConversation | null> => {
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

    return await storePrivateConversation(data);
};
