import { deleteCacheByPatterns } from '@lib/redis';

export const buildPrivateConversationListCacheKey = (
    userId: string,
    limit: number,
    search: string | undefined,
    cursor?: string
): string =>
    `private-conversations:list:${userId}:${limit}:${search ?? ''}:${cursor ?? ''}`;

export const buildPrivateConversationDetailsCacheKey = (
    conversationId: string,
    userId: string
): string => `private-conversations:details:${conversationId}:${userId}`;

export const buildPrivateConversationMessagesCacheKey = (
    conversationId: string,
    userId: string,
    limit: number,
    cursor?: string
): string =>
    `private-conversations:messages:${conversationId}:${userId}:${limit}:${cursor ?? ''}`;

export const invalidatePrivateConversationCacheByConversationId = async (
    conversationId: string
): Promise<void> => {
    await deleteCacheByPatterns([
        `private-conversations:details:${conversationId}:*`,
        `private-conversations:messages:${conversationId}:*`,
    ]);
};

export const invalidatePrivateConversationCacheByUserIds = async (
    userIds: string[]
): Promise<void> => {
    const uniqueUserIds = [...new Set(userIds)];

    if (!uniqueUserIds.length) {
        return;
    }

    await deleteCacheByPatterns(
        uniqueUserIds.map((userId) => `private-conversations:list:${userId}:*`)
    );
};
