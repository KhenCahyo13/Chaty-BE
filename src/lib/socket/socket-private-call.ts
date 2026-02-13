import { findPrivateConversationUserIdsById } from '@modules/private-conversation/private-conversation.repository';
import { randomUUID } from 'crypto';
import { Server, Socket } from 'socket.io';

const buildPrivateCallRoom = (conversationId: string): string =>
    `private-call:${conversationId}`;
const privateCallEndStatuses = new Set([
    'ended',
    'missed',
    'rejected',
    'failed',
    'cancelled',
] as const);

const getPrivateCallId = (payload: unknown): null | string => {
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

const getCallType = (payload: unknown): 'audio' | 'video' => {
    if (
        typeof payload === 'object' &&
        payload &&
        'call_type' in payload &&
        (payload.call_type === 'audio' || payload.call_type === 'video')
    ) {
        return payload.call_type;
    }

    return 'audio';
};

const getCallEndStatus = (
    payload: unknown
): 'cancelled' | 'ended' | 'failed' | 'missed' | 'rejected' => {
    if (
        typeof payload === 'object' &&
        payload &&
        'status' in payload &&
        typeof payload.status === 'string' &&
        privateCallEndStatuses.has(payload.status as never)
    ) {
        return payload.status as
            | 'cancelled'
            | 'ended'
            | 'failed'
            | 'missed'
            | 'rejected';
    }

    return 'ended';
};

const getCallId = (payload: unknown): null | string => {
    if (
        typeof payload === 'object' &&
        payload &&
        'call_id' in payload &&
        typeof payload.call_id === 'string'
    ) {
        return payload.call_id;
    }

    return null;
};

export const registerPrivateCallHandlers = (
    io: Server,
    socket: Socket,
    userId: string
): void => {
    socket.on('private-call:start', async (payload: unknown) => {
        const privateConversationId = getPrivateCallId(payload);

        if (!privateConversationId) {
            socket.emit('private-call:start:error', {
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
            socket.emit('private-call:start:error', {
                message: 'Private conversation not found.',
            });
            return;
        }

        const receiverId =
            conversation.user1Id === userId
                ? conversation.user2Id
                : conversation.user1Id;
        const callType = getCallType(payload);
        const startedAt = new Date();
        const callId = randomUUID();
        const room = buildPrivateCallRoom(privateConversationId);

        socket.join(room);

        const socketPayload = {
            call_id: callId,
            call_type: callType,
            callee_id: receiverId,
            caller_id: userId,
            private_conversation_id: privateConversationId,
            room,
            started_at: startedAt,
            status: 'ringing' as const,
        };

        io.to(`user:${userId}`).emit('private-call:started', socketPayload);
        io.to(`user:${receiverId}`).emit(
            'private-call:incoming',
            socketPayload
        );
    });

    socket.on('private-call:answer', async (payload: unknown) => {
        const privateConversationId = getPrivateCallId(payload);

        if (!privateConversationId) {
            socket.emit('private-call:answer:error', {
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
            socket.emit('private-call:answer:error', {
                message: 'Private conversation not found.',
            });
            return;
        }

        const receiverId =
            conversation.user1Id === userId
                ? conversation.user2Id
                : conversation.user1Id;
        const callId = getCallId(payload);
        const room = buildPrivateCallRoom(privateConversationId);
        const answeredAt = new Date();

        socket.join(room);

        const socketPayload = {
            answered_at: answeredAt,
            call_id: callId,
            private_conversation_id: privateConversationId,
            room,
            status: 'answered' as const,
            user_id: userId,
        };

        io.to(`user:${userId}`).emit('private-call:answered', socketPayload);
        io.to(`user:${receiverId}`).emit(
            'private-call:answered',
            socketPayload
        );

        io.to(`user:${userId}`).emit('private-call:ongoing', socketPayload);
        io.to(`user:${receiverId}`).emit('private-call:ongoing', socketPayload);
    });

    socket.on('private-call:end', async (payload: unknown) => {
        const privateConversationId = getPrivateCallId(payload);

        if (!privateConversationId) {
            socket.emit('private-call:end:error', {
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
            socket.emit('private-call:end:error', {
                message: 'Private conversation not found.',
            });
            return;
        }

        const receiverId =
            conversation.user1Id === userId
                ? conversation.user2Id
                : conversation.user1Id;
        const endedAt = new Date();
        const room = buildPrivateCallRoom(privateConversationId);
        const status = getCallEndStatus(payload);
        const callId = getCallId(payload);

        socket.leave(room);

        const socketPayload = {
            call_id: callId,
            ended_at: endedAt,
            ended_by: userId,
            private_conversation_id: privateConversationId,
            status,
        };

        io.to(`user:${userId}`).emit('private-call:ended', socketPayload);
        io.to(`user:${receiverId}`).emit('private-call:ended', socketPayload);
    });
};
