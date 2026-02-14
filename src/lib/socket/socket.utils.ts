import { PRIVATE_CALL_END_STATUSES } from '@constants/call';
import {
    PrivateCallEndStatus,
    PrivateCallType,
    SessionDescription,
    SocketPayload,
} from 'src/types/socket';

export const getSocketPayload = (payload: unknown): null | SocketPayload => {
    if (typeof payload !== 'object' || payload === null) {
        return null;
    }

    return payload as SocketPayload;
};

export const buildScopedRoom = (
    scope: string,
    conversationId: string
): string => `${scope}:${conversationId}`;

export const getPrivateConversationId = (payload: unknown): null | string => {
    if (typeof payload === 'string') {
        return payload;
    }

    const socketPayload = getSocketPayload(payload);

    if (
        socketPayload &&
        typeof socketPayload.private_conversation_id === 'string'
    ) {
        return socketPayload.private_conversation_id;
    }

    return null;
};

const isPrivateCallEndStatus = (
    value: unknown
): value is PrivateCallEndStatus =>
    typeof value === 'string' &&
    PRIVATE_CALL_END_STATUSES.includes(value as PrivateCallEndStatus);

export const getCallType = (payload: unknown): PrivateCallType => {
    const socketPayload = getSocketPayload(payload);

    if (
        socketPayload &&
        (socketPayload.call_type === 'audio' ||
            socketPayload.call_type === 'video')
    ) {
        return socketPayload.call_type;
    }

    return 'audio';
};

export const getCallEndStatus = (payload: unknown): PrivateCallEndStatus => {
    const socketPayload = getSocketPayload(payload);

    if (socketPayload && isPrivateCallEndStatus(socketPayload.status)) {
        return socketPayload.status;
    }

    return 'ended';
};

export const getCallId = (payload: unknown): null | string => {
    const socketPayload = getSocketPayload(payload);

    if (socketPayload && typeof socketPayload.call_id === 'string') {
        return socketPayload.call_id;
    }

    return null;
};

export const getSessionDescription = (
    payload: unknown
): null | SessionDescription => {
    const socketPayload = getSocketPayload(payload);

    if (!socketPayload) {
        return null;
    }

    const sdpPayload = getSocketPayload(socketPayload.sdp);

    if (
        !sdpPayload ||
        typeof sdpPayload.type !== 'string' ||
        typeof sdpPayload.sdp !== 'string'
    ) {
        return null;
    }

    return {
        sdp: sdpPayload.sdp,
        type: sdpPayload.type,
    };
};

export const hasIceCandidate = (
    payload: unknown
): payload is { candidate: unknown } => {
    const socketPayload = getSocketPayload(payload);

    return Boolean(socketPayload && 'candidate' in socketPayload);
};
