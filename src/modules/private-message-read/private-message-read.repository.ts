import prisma from '@lib/prisma';

export const storePrivateMessageReads = async (
    messageIds: string[],
    receiverId: string,
    readAt: Date
): Promise<void> => {
    if (!messageIds.length) {
        return;
    }

    await prisma.privateMessageRead.createMany({
        data: messageIds.map((messageId) => ({
            messageId,
            readAt,
            receiverId,
        })),
        skipDuplicates: true,
    });
};
