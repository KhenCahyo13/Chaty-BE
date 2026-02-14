import { findPrivateConversationUserIdsById } from '@modules/private-conversation/private-conversation.repository';
import { Server, Socket } from 'socket.io';

import {
    getCallId,
    getSessionDescription,
    hasIceCandidate,
} from './socket.utils';
import { getPrivateConversationId } from './socket.utils';

export const registerPrivateCallWebRtcHandlers = (
    io: Server,
    socket: Socket,
    userId: string
): void => {
    socket.on('private-call:webrtc-offer', async (payload: unknown) => {
        const privateConversationId = getPrivateConversationId(payload);
        const callId = getCallId(payload);
        const sdp = getSessionDescription(payload);

        if (!privateConversationId || !callId || !sdp) {
            socket.emit('private-call:webrtc-offer:error', {
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
            socket.emit('private-call:webrtc-offer:error', {
                message: 'Private conversation not found.',
            });
            return;
        }

        const receiverId =
            conversation.user1Id === userId
                ? conversation.user2Id
                : conversation.user1Id;

        io.to(`user:${receiverId}`).emit('private-call:webrtc-offer', {
            call_id: callId,
            from_user_id: userId,
            private_conversation_id: privateConversationId,
            sdp,
        });
    });

    socket.on('private-call:webrtc-answer', async (payload: unknown) => {
        const privateConversationId = getPrivateConversationId(payload);
        const callId = getCallId(payload);
        const sdp = getSessionDescription(payload);

        if (!privateConversationId || !callId || !sdp) {
            socket.emit('private-call:webrtc-answer:error', {
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
            socket.emit('private-call:webrtc-answer:error', {
                message: 'Private conversation not found.',
            });
            return;
        }

        const receiverId =
            conversation.user1Id === userId
                ? conversation.user2Id
                : conversation.user1Id;

        io.to(`user:${receiverId}`).emit('private-call:webrtc-answer', {
            call_id: callId,
            from_user_id: userId,
            private_conversation_id: privateConversationId,
            sdp,
        });
    });

    socket.on('private-call:webrtc-ice-candidate', async (payload: unknown) => {
        const privateConversationId = getPrivateConversationId(payload);
        const callId = getCallId(payload);

        if (!privateConversationId || !callId || !hasIceCandidate(payload)) {
            socket.emit('private-call:webrtc-ice-candidate:error', {
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
            socket.emit('private-call:webrtc-ice-candidate:error', {
                message: 'Private conversation not found.',
            });
            return;
        }

        const receiverId =
            conversation.user1Id === userId
                ? conversation.user2Id
                : conversation.user1Id;

        io.to(`user:${receiverId}`).emit('private-call:webrtc-ice-candidate', {
            call_id: callId,
            candidate: payload.candidate,
            from_user_id: userId,
            private_conversation_id: privateConversationId,
        });
    });
};
