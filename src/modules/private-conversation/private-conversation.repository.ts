import prisma from "@lib/prisma";
import { PrivateConversation } from "./private-conversation.model";
import { CreatePrivateConversationPayload } from "./private-conversation.types";

export const storePrivateConversation = async (data: CreatePrivateConversationPayload): Promise<PrivateConversation> => {
    return await prisma.privateConversation.create({
        data: data,
    });
}

export const checkPrivateConversationRoomExistence = async (user1Id: string, user2Id: string): Promise<PrivateConversation | null> => {
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
                }
            ]
        }
    });
}