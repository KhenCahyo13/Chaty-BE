import { PrivateCallEndStatus } from 'src/types/socket';

export const PRIVATE_CALL_END_STATUSES: readonly PrivateCallEndStatus[] = [
    'ended',
    'missed',
    'rejected',
    'failed',
    'cancelled',
];
