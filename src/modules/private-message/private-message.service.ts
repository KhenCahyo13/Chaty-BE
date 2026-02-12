import { sendFcmNotificationToTokens } from '@config/firebase';
import { buildStorageObjectPath } from '@lib/file-upload';
import { createHttpError } from '@lib/http-error';
import { io } from '@lib/socket';
import { uploadFileWithBuffer } from '@lib/supabase-storage';
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
    senderId: string,
    audioFile?: Express.Multer.File
): Promise<PrivateMessage> => {
    const audioBucket = process.env.SUPABASE_STORAGE_AUDIO_BUCKET;
    const messageType = audioFile ? 'AUDIO' : data.message_type;

    if (!audioFile && messageType === 'AUDIO') {
        throw createHttpError('Audio file is required for audio message.', 400);
    }

    if (!audioFile && messageType === 'TEXT' && !data.content) {
        throw createHttpError('Message content cannot be empty.', 400);
    }

    let audioPath: string | undefined;

    if (audioFile) {
        if (!audioBucket) {
            throw createHttpError(
                'SUPABASE_STORAGE_AUDIO_BUCKET is not configured.',
                500
            );
        }

        audioPath = buildStorageObjectPath(senderId, audioFile.originalname);
        await uploadFileWithBuffer({
            bucket: audioBucket,
            buffer: audioFile.buffer,
            contentType: audioFile.mimetype,
            path: audioPath,
            upsert: false,
        });
    }

    const createdMessage = await storePrivateMessage(
        {
            ...data,
            content: messageType === 'TEXT' ? data.content : null,
            message_type: messageType,
        },
        senderId,
        audioFile,
        audioPath
    );
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
                    body:
                        formattedMessage.messageType === 'AUDIO'
                            ? 'Voice message'
                            : (formattedMessage.content ?? '(Deleted message)'),
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
