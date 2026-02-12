import { extname } from 'node:path';

import { SUPABASE_STORAGE_SIGNED_URL_EXPIRES_IN } from '@constants/storage';
import { createHttpError } from '@lib/http-error';
import prisma from '@lib/prisma';
import { createSignedUrl } from '@lib/supabase-storage';

import { PrivateMessage } from './private-message.model';
import {
    CreatePrivateMessageValues,
    SocketPrivateMessagePayload,
    StorePrivateMessageAttachmentInput,
} from './private-message.types';

export const storePrivateMessage = async (
    data: CreatePrivateMessageValues,
    senderId: string,
    attachments: StorePrivateMessageAttachmentInput[]
): Promise<PrivateMessage> => {
    return await prisma.privateMessage.create({
        data: {
            content: data.content,
            messageType: data.message_type,
            privateConversationId: data.private_conversation_id,
            senderId: senderId,
            ...(attachments.length && {
                attachments: {
                    create: attachments.map((attachment) => {
                        const extension = extname(attachment.fileName)
                            .replace('.', '')
                            .toLowerCase();
                        const normalizedFileType =
                            extension ||
                            attachment.fileType.split('/')[1] ||
                            'file';

                        return {
                            fileName: attachment.fileName,
                            fileSize: BigInt(attachment.fileSize),
                            fileType: normalizedFileType.slice(0, 10),
                            fileUrl: attachment.filePath,
                        };
                    }),
                },
            }),
        },
    });
};

export const formatPrivateMessageForSocket = async (
    messageId: string
): Promise<SocketPrivateMessagePayload> => {
    const audioBucket = process.env.SUPABASE_STORAGE_AUDIO_BUCKET;
    const filesBucket = process.env.SUPABASE_STORAGE_FILES_BUCKET;
    const message = await prisma.privateMessage.findUnique({
        include: {
            _count: {
                select: { reads: true },
            },
            attachments: {
                orderBy: {
                    id: 'asc',
                },
                select: {
                    fileName: true,
                    fileUrl: true,
                },
            },
        },
        where: { id: messageId },
    });

    if (!message) {
        throw createHttpError('Private message not found.', 404);
    }

    const audioPath =
        message.messageType === 'AUDIO'
            ? message.attachments[0]?.fileUrl
            : null;
    const filePaths =
        message.messageType === 'FILE'
            ? message.attachments.map((attachment) => attachment.fileUrl)
            : [];
    const audioUrl =
        !message.isDeleted && audioPath && audioBucket
            ? (
                  await createSignedUrl({
                      bucket: audioBucket,
                      expiresIn: SUPABASE_STORAGE_SIGNED_URL_EXPIRES_IN,
                      path: audioPath,
                  })
              ).signedUrl
            : null;
    const fileUrls =
        !message.isDeleted && filesBucket && filePaths.length
            ? await Promise.all(
                  filePaths.map(async (filePath) => {
                      return (
                          await createSignedUrl({
                              bucket: filesBucket,
                              expiresIn: SUPABASE_STORAGE_SIGNED_URL_EXPIRES_IN,
                              path: filePath,
                          })
                      ).signedUrl;
                  })
              )
            : [];

    return {
        audioUrl,
        content: message.isDeleted ? null : message.content,
        createdAt: message.createdAt,
        fileUrls,
        id: message.id,
        isDeleted: message.isDeleted,
        messageType: message.messageType,
        readsCount: message._count.reads,
        senderId: message.senderId,
    };
};

export const findPrivateMessageInConversationById = async (
    messageId: string,
    conversationId: string
): Promise<null | { createdAt: Date }> => {
    return await prisma.privateMessage.findFirst({
        select: {
            createdAt: true,
        },
        where: {
            id: messageId,
            privateConversationId: conversationId,
        },
    });
};

export const findUnreadPrivateMessageIdsInConversation = async (
    conversationId: string,
    receiverId: string,
    lastReadMessageCreatedAt: Date
): Promise<string[]> => {
    const unreadMessages = await prisma.privateMessage.findMany({
        select: {
            id: true,
        },
        where: {
            createdAt: {
                lte: lastReadMessageCreatedAt,
            },
            privateConversationId: conversationId,
            reads: {
                none: {
                    receiverId,
                },
            },
            senderId: {
                not: receiverId,
            },
        },
    });

    return unreadMessages.map((message) => message.id);
};
