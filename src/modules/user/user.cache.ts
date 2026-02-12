import { deleteCacheByPatterns } from '@lib/redis';

export const buildUserListCacheKey = (
    userId: string,
    limit: number,
    search: string,
    cursor?: string
): string => `users:list:${userId}:${limit}:${search}:${cursor ?? ''}`;

export const buildUserByIdCacheKey = (id: string): string =>
    `users:details:${id}`;

export const invalidateUserCacheById = async (id: string): Promise<void> => {
    await deleteCacheByPatterns([buildUserByIdCacheKey(id), 'users:list:*']);
};
