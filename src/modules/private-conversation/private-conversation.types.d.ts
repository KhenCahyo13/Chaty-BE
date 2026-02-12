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
    privateConversationId: string;
    readerId: string;
    messageIds: string[];
    readAt: Date;
}

type UserPayload = Prisma.UserGetPayload<{ select: typeof userListSelect }>;
type LastMessagePayload = Prisma.PrivateMessageGetPayload<{
    select: typeof lastMessageListSelect;
}>;
export type LastMessageWithRedaction = Omit<LastMessagePayload, 'content'> & {
    content: string | null;
};

export type PrivateConversationWithRelations =
    Prisma.PrivateConversationGetPayload<{
        include: {
            user1: { select: typeof userListSelect };
            user2: { select: typeof userListSelect };
            messages: {
                select: typeof lastMessageListSelect;
                orderBy: { createdAt: 'desc' };
                take: 1;
            };
        };
    }>;

export type PrivateConversationListItem = Omit<
    PrivateConversation,
    'user1Id' | 'user2Id'
> & {
    sender: UserPayload;
    lastMessage: LastMessageWithRedaction | null;
    unreadMessageCount: number;
};
