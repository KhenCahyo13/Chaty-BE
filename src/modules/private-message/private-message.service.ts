import { sendFcmNotificationToTokens } from '@config/firebase';
import { io } from '@lib/socket';
import {
    invalidatePrivateConversationCacheByConversationId,
    invalidatePrivateConversationCacheByUserIds,
} from '@modules/private-conversation/private-conversation.cache';
import { findPrivateConversationUserIdsById } from '@modules/private-conversation/private-conversation.repository';
import { findUserById } from '@modules/user/user.repository';
import { findActivePushTokensByUserId } from '@modules/user-push-token/user-push-token.repository';

import { PrivateMessage } from './private-message.model';
import {
    formatPrivateMessageForSocket,
    storePrivateMessage,
} from './private-message.repository';
import {
    CreatePrivateMessageValues,
    SocketPrivateMessageCreatedPayload,
} from './private-message.types';

export const createPrivateMessage = async (
    data: CreatePrivateMessageValues,
    senderId: string
): Promise<PrivateMessage> => {
    const createdMessage = await storePrivateMessage(data, senderId);
    const conversationUsersIds = await findPrivateConversationUserIdsById(
        createdMessage.privateConversationId
    );
    const formattedMessage = await formatPrivateMessageForSocket(
        createdMessage.id
    );

    const receiverId =
        conversationUsersIds?.user1Id === senderId
            ? conversationUsersIds.user2Id
            : conversationUsersIds?.user1Id;

    await Promise.all([
        invalidatePrivateConversationCacheByConversationId(
            createdMessage.privateConversationId
        ),
        invalidatePrivateConversationCacheByUserIds(
            [senderId, receiverId].filter(
                (userId): userId is string => typeof userId === 'string'
            )
        ),
    ]);

    const socketPayload: SocketPrivateMessageCreatedPayload = {
        message: formattedMessage,
        private_conversation_id: createdMessage.privateConversationId,
    };

    io.to(`user:${senderId}`).emit('private-message:sent', socketPayload);
    io.to(`user:${receiverId}`).emit('private-message:new', socketPayload);

    if (receiverId) {
        const receiverTokens = await findActivePushTokensByUserId(receiverId);
        const sender = await findUserById(senderId);
        const senderName =
            sender?.profile?.fullName || sender?.username || 'Unknown';

        if (receiverTokens.length) {
            try {
                await sendFcmNotificationToTokens(receiverTokens, {
                    body: formattedMessage.content ?? '(Deleted message)',
                    data: {
                        private_conversation_id:
                            createdMessage.privateConversationId,
                        private_message_id: createdMessage.id,
                        sender_id: senderId,
                    },
                    title: `New message from ${senderName}`,
                });
            } catch {
                // Ignore FCM errors
            }
        }
    }

    return createdMessage;
};
