import { createHttpError } from '@lib/http-error';

import { PrivateConversation } from './private-conversation.model';
import {
    checkPrivateConversationRoomExistence,
    findAllPrivateConversationsByUserId,
    findPrivateConversationDetailsById,
    storePrivateConversation,
} from './private-conversation.repository';
import {
    CreatePrivateConversationPayload,
    type PrivateConversationListItem,
} from './private-conversation.types';

export const getAllPrivateConversationsByUserId = async (
    limit: number,
    userId: string
): Promise<PrivateConversationListItem[]> => {
    return await findAllPrivateConversationsByUserId(limit, userId);
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
