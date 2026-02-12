import type { Prisma } from '@generated/prisma/client';

import type { PrivateConversation } from './private-conversation.model';
import type {
    lastMessageListSelect,
    userListSelect,
} from './private-conversation.select';

export interface CreatePrivateConversationPayload {
    user1Id: string;
    user2Id: string;
}

export interface MarkPrivateConversationAsReadValues {
    last_read_message_id: string;
}

export interface PrivateConversationReadReceiptResult {
    messageIds: string[];
    readAt: Date;
}

export interface SocketPrivateMessageReadPayload {
    messageIds: string[];
    privateConversationId: string;
    readAt: Date;
    readerId: string;
}

type UserPayload = Prisma.UserGetPayload<{ select: typeof userListSelect }>;
type LastMessagePayload = Prisma.PrivateMessageGetPayload<{
    select: typeof lastMessageListSelect;
}>;
export type LastMessageWithRedaction = Omit<LastMessagePayload, 'content'> & {
    content: null | string;
};

export type PrivateConversationWithRelations =
    Prisma.PrivateConversationGetPayload<{
        include: {
            messages: {
                orderBy: { createdAt: 'desc' };
                select: typeof lastMessageListSelect;
                take: 1;
            };
            user1: { select: typeof userListSelect };
            user2: { select: typeof userListSelect };
        };
    }>;

export type PrivateConversationListItem = Omit<
    PrivateConversation,
    'user1Id' | 'user2Id'
> & {
    lastMessage: LastMessageWithRedaction | null;
    sender: UserPayload;
    unreadMessageCount: number;
};
