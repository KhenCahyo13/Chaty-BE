import { extname } from 'node:path';

import { createHttpError } from '@lib/http-error';
import prisma from '@lib/prisma';
import { createSignedUrl } from '@lib/supabase-storage';

import { PrivateMessage } from './private-message.model';
import {
    CreatePrivateMessageValues,
    SocketPrivateMessagePayload,
} from './private-message.types';

const AUDIO_SIGNED_URL_EXPIRES_IN = Number(
    process.env.SUPABASE_STORAGE_SIGNED_URL_EXPIRES_IN
);

export const storePrivateMessage = async (
    data: CreatePrivateMessageValues,
    senderId: string,
    audioFile?: Express.Multer.File,
    audioPath?: string
): Promise<PrivateMessage> => {
    const audioExtension = audioFile
        ? extname(audioFile.originalname).replace('.', '').toLowerCase()
        : null;

    return await prisma.privateMessage.create({
        data: {
            content: data.content,
            messageType: data.message_type,
            privateConversationId: data.private_conversation_id,
            senderId: senderId,
            ...(audioFile &&
                audioPath && {
                    attachments: {
                        create: [
                            {
                                fileName: audioFile.originalname,
                                fileSize: BigInt(audioFile.size),
                                fileType:
                                    audioExtension?.slice(0, 10) ?? 'audio',
                                fileUrl: audioPath,
                            },
                        ],
                    },
                }),
        },
    });
};

export const formatPrivateMessageForSocket = async (
    messageId: string
): Promise<SocketPrivateMessagePayload> => {
    const audioBucket = process.env.SUPABASE_STORAGE_AUDIO_BUCKET;
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
                    fileUrl: true,
                },
                take: 1,
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
    const audioUrl =
        !message.isDeleted && audioPath && audioBucket
            ? (
                  await createSignedUrl({
                      bucket: audioBucket,
                      expiresIn: AUDIO_SIGNED_URL_EXPIRES_IN,
                      path: audioPath,
                  })
              ).signedUrl
            : null;

    return {
        audioUrl,
        content: message.isDeleted ? null : message.content,
        createdAt: message.createdAt,
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
