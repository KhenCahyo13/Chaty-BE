import type { Prisma } from "@generated/prisma/client";
import type { PrivateConversation } from "./private-conversation.model";
import type { userListSelect, lastMessageListSelect } from "./private-conversation.select";

export interface CreatePrivateConversationPayload {
    user1Id: string;
    user2Id: string;
}

type UserPayload = Prisma.UserGetPayload<{ select: typeof userListSelect }>;
type LastMessagePayload = Prisma.PrivateMessageGetPayload<{ select: typeof lastMessageListSelect }>;
type LastMessageWithRedaction = Omit<LastMessagePayload, "content"> & { content: string | null };

export type PrivateConversationWithRelations = Prisma.PrivateConversationGetPayload<{
    include: {
        user1: { select: typeof userListSelect };
        user2: { select: typeof userListSelect };
        messages: {
            select: typeof lastMessageListSelect;
            orderBy: { createdAt: "desc" };
            take: 1;
        };
    };
}>;

export type PrivateConversationListItem = Omit<PrivateConversation, "user1Id" | "user2Id"> & {
    sender: UserPayload;
    lastMessage: LastMessageWithRedaction | null;
};