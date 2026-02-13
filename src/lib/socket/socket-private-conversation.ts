import { findPrivateConversationUserIdsById } from '@modules/private-conversation/private-conversation.repository';
import { findUserPresenceById } from '@modules/user/user.repository';
import { Server, Socket } from 'socket.io';

const buildPrivateConversationRoom = (conversationId: string): string =>
    `private-conversation:${conversationId}`;

const getPrivateConversationId = (payload: unknown): null | string => {
    if (typeof payload === 'string') {
        return payload;
    }

    if (
        typeof payload === 'object' &&
        payload &&
        'private_conversation_id' in payload &&
        typeof payload.private_conversation_id === 'string'
    ) {
        return payload.private_conversation_id;
    }

    return null;
};

export const registerPrivateConversationHandlers = (
    io: Server,
    socket: Socket,
    userId: string
): Set<string> => {
    const joinedPrivateConversationIds = new Set<string>();

    socket.on('private-conversation:join', async (payload: unknown) => {
        const privateConversationId = getPrivateConversationId(payload);

        if (!privateConversationId) {
            socket.emit('private-conversation:join:error', {
                message: 'Payload is not valid.',
            });
            return;
        }

        const conversation = await findPrivateConversationUserIdsById(
            privateConversationId
        );

        if (
            !conversation ||
            (conversation.user1Id !== userId && conversation.user2Id !== userId)
        ) {
            socket.emit('private-conversation:join:error', {
                message: 'Private conversation not found.',
            });
            return;
        }

        const room = buildPrivateConversationRoom(privateConversationId);
        socket.join(room);
        joinedPrivateConversationIds.add(privateConversationId);

        const receiverId =
            conversation.user1Id === userId
                ? conversation.user2Id
                : conversation.user1Id;
        const receiverPresence = await findUserPresenceById(receiverId);

        socket.emit('private-conversation:presence', {
            is_online: receiverPresence?.isOnline ?? false,
            last_seen_at: receiverPresence?.lastSeenAt ?? null,
            private_conversation_id: privateConversationId,
            user_id: receiverId,
        });

        socket.to(room).emit('private-conversation:presence', {
            is_online: true,
            last_seen_at: null,
            private_conversation_id: privateConversationId,
            user_id: userId,
        });
    });

    socket.on('private-conversation:leave', (payload: unknown) => {
        const privateConversationId = getPrivateConversationId(payload);
        if (!privateConversationId) {
            return;
        }

        socket.leave(buildPrivateConversationRoom(privateConversationId));
        joinedPrivateConversationIds.delete(privateConversationId);
    });

    return joinedPrivateConversationIds;
};

export const emitOfflinePresenceToPrivateConversations = (
    io: Server,
    privateConversationIds: Iterable<string>,
    userId: string,
    offlineAt: Date
): void => {
    for (const privateConversationId of privateConversationIds) {
        io.to(buildPrivateConversationRoom(privateConversationId)).emit(
            'private-conversation:presence',
            {
                is_online: false,
                last_seen_at: offlineAt,
                private_conversation_id: privateConversationId,
                user_id: userId,
            }
        );
    }
};
