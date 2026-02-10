import { createHttpError } from "@lib/http-error";
import { PrivateConversation } from "./private-conversation.model";
import { CreatePrivateConversationPayload } from "./private-conversation.types";
import {
    checkPrivateConversationRoomExistence,
    storePrivateConversation,
} from "./private-conversation.repository";

export const createPrivateConversation = async (
    data: CreatePrivateConversationPayload,
): Promise<PrivateConversation | null> => {
    if (data.user1Id === data.user2Id) {
        throw createHttpError(
            "Cannot create a private conversation with yourself.",
            400
        );
    }

    const privateConversationRoom = await checkPrivateConversationRoomExistence(
        data.user1Id,
        data.user2Id,
    );

    if (privateConversationRoom) {
        return privateConversationRoom;
    }

    return await storePrivateConversation(data);
};