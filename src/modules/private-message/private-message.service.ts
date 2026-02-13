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
    uploadedMedia?: {
        audioFile?: Express.Multer.File;
        files: Express.Multer.File[];
    }
): Promise<PrivateMessage> => {
    const audioBucket = process.env.SUPABASE_STORAGE_AUDIO_BUCKET;
    const filesBucket = process.env.SUPABASE_STORAGE_FILES_BUCKET;
    const audioFile = uploadedMedia?.audioFile;
    const files = uploadedMedia?.files ?? [];
    const hasAudio = Boolean(audioFile);
    const hasFiles = files.length > 0;
    const messageType = hasAudio
        ? 'AUDIO'
        : hasFiles
          ? 'FILE'
          : data.message_type;
    const conversationUsersIds = await findPrivateConversationUserIdsById(
        data.private_conversation_id
    );

    if (
        !conversationUsersIds ||
        (conversationUsersIds.user1Id !== senderId &&
            conversationUsersIds.user2Id !== senderId)
    ) {
        throw createHttpError('Private conversation not found.', 404);
    }

    if (hasAudio && hasFiles) {
        throw createHttpError(
            'Cannot send audio and file attachments in one message.',
            400
        );
    }

    if (!hasAudio && messageType === 'AUDIO') {
        throw createHttpError('Audio file is required for audio message.', 400);
    }

    if (!hasFiles && messageType === 'FILE') {
        throw createHttpError(
            'At least one file is required for file message.',
            400
        );
    }

    if (!hasAudio && !hasFiles && messageType === 'TEXT' && !data.content) {
        throw createHttpError('Message content cannot be empty.', 400);
    }

    let audioPath: string | undefined;
    let filePaths: string[] = [];

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

    if (hasFiles) {
        if (!filesBucket) {
            throw createHttpError(
                'SUPABASE_STORAGE_FILES_BUCKET is not configured.',
                500
            );
        }

        filePaths = await Promise.all(
            files.map(async (file) => {
                const filePath = buildStorageObjectPath(
                    senderId,
                    file.originalname
                );
                await uploadFileWithBuffer({
                    bucket: filesBucket,
                    buffer: file.buffer,
                    contentType: file.mimetype,
                    path: filePath,
                    upsert: false,
                });

                return filePath;
            })
        );
    }

    const createdMessage = await storePrivateMessage(
        {
            ...data,
            content:
                messageType === 'TEXT' && !hasAudio && !hasFiles
                    ? data.content
                    : null,
            message_type: messageType,
        },
        senderId,
        [
            ...(hasAudio && audioFile && audioPath
                ? [
                      {
                          fileName: audioFile.originalname,
                          filePath: audioPath,
                          fileSize: audioFile.size,
                          fileType: audioFile.mimetype,
                      },
                  ]
                : []),
            ...files.map((file, index) => ({
                fileName: file.originalname,
                filePath: filePaths[index],
                fileSize: file.size,
                fileType: file.mimetype,
            })),
        ]
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
                            : formattedMessage.messageType === 'FILE'
                              ? 'File message'
                              : (formattedMessage.content ??
                                '(Deleted message)'),
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
