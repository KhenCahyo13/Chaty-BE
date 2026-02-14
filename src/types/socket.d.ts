export type PrivateCallEndStatus =
    | 'cancelled'
    | 'ended'
    | 'failed'
    | 'missed'
    | 'rejected';

export type PrivateCallType = 'audio' | 'video';

export interface SessionDescription {
    sdp: string;
    type: string;
}

export type SocketPayload = Record<string, unknown>;
