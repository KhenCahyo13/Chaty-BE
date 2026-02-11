import { PrivateMessage } from './private-message.model';
import { storePrivateMessage } from './private-message.repository';
import { CreatePrivateMessageValues } from './private-message.types';

export const createPrivateMessage = async (
    data: CreatePrivateMessageValues,
    senderId: string
): Promise<PrivateMessage> => {
    return await storePrivateMessage(data, senderId);
};