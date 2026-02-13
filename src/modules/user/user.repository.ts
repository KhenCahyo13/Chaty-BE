import prisma from '@lib/prisma';
import { getCache, setCache } from '@lib/redis';

import {
    buildUserByIdCacheKey,
    buildUserListCacheKey,
    invalidateUserCacheById,
} from './user.cache';
import { listUsersSelect, presenceUserSelect } from './user.select';
import type { UserAuthRecord, UserListResponse } from './user.types';

export const findAllUsers = async (
    userId: string,
    limit: number,
    search: string,
    cursor?: string
): Promise<{ nextCursor: null | string; users: UserListResponse[] }> => {
    const cacheKey = buildUserListCacheKey(userId, limit, search, cursor);
    const cached = await getCache<{
        nextCursor: null | string;
        users: UserListResponse[];
    }>(cacheKey);

    if (cached) {
        return cached;
    }

    const users = await prisma.user.findMany({
        orderBy: { id: 'desc' },
        take: limit,
        ...(cursor && {
            cursor: { id: cursor },
            skip: 1,
        }),
        select: listUsersSelect,
        where: {
            id: { not: userId },
            OR: [
                { username: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                {
                    profile: {
                        fullName: { contains: search, mode: 'insensitive' },
                    },
                },
            ],
        },
    });

    const result = {
        nextCursor: users.length ? users[users.length - 1].id : null,
        users,
    };

    await setCache(cacheKey, result);

    return result as { nextCursor: null | string; users: UserListResponse[] };
};

export const findUserByUsername = async (
    username: string
): Promise<null | UserAuthRecord> => {
    return prisma.user.findUnique({
        select: {
            email: true,
            id: true,
            password: true,
            username: true,
        },
        where: { username },
    });
};

export const findUserById = async (
    id: string
): Promise<null | UserListResponse> => {
    const cacheKey = buildUserByIdCacheKey(id);
    const cached = await getCache<UserListResponse>(cacheKey);

    if (cached) {
        return cached;
    }

    const result = await prisma.user.findUnique({
        select: presenceUserSelect,
        where: { id },
    });

    if (result) {
        await setCache(cacheKey, result);
    }

    return result;
};

export const findUserPresenceById = async (
    id: string
): Promise<null | { id: string; isOnline: boolean; lastSeenAt: Date }> => {
    return prisma.user.findUnique({
        select: {
            id: true,
            isOnline: true,
            lastSeenAt: true,
        },
        where: { id },
    });
};

export const setUserOnlineStatus = async (
    userId: string,
    isOnline: boolean
): Promise<void> => {
    const now = new Date();

    await prisma.user.update({
        data: {
            isOnline,
            ...(isOnline ? {} : { lastSeenAt: now }),
            updatedAt: now,
        },
        where: {
            id: userId,
        },
    });

    await invalidateUserCacheById(userId);
};
