import { findPrivateConversationUserIdsById } from '@modules/private-conversation/private-conversation.repository';
import { PrivateMessage } from './private-message.model';
import { storePrivateMessage } from './private-message.repository';
import { CreatePrivateMessageValues, SocketPrivateMessageCreatedPayload } from './private-message.types';
import { io } from '@lib/socket';

export const createPrivateMessage = async (
    data: CreatePrivateMessageValues,
    senderId: string
): Promise<PrivateMessage> => {
    const createdMessage = await storePrivateMessage(data, senderId);
    const conversationUsersIds = await findPrivateConversationUserIdsById(createdMessage.privateConversationId);
    const receiverId = conversationUsersIds?.user1Id === senderId ? conversationUsersIds.user2Id : conversationUsersIds?.user1Id;

    const socketPayload: SocketPrivateMessageCreatedPayload = {
        private_conversation_id: createdMessage.privateConversationId,
    }

    io.to(`user:${senderId}`).emit('private-message:sent', socketPayload);
    io.to(`user:${receiverId}`).emit('private-message:new', socketPayload);

    return createdMessage;
};