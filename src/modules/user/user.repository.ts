import prisma from '@lib/prisma';
import { getCache, setCache } from '@lib/redis';

import { buildUserByIdCacheKey, buildUserListCacheKey } from './user.cache';
import { listUsersSelect } from './user.select';
import type { UserAuthRecord, UserListResponse } from './user.types';

export const findAllUsers = async (
    userId: string,
    limit: number,
    search: string,
    cursor?: string
): Promise<{ users: UserListResponse[]; nextCursor: string | null }> => {
    const cacheKey = buildUserListCacheKey(userId, limit, search, cursor);
    const cached = await getCache<{
        users: UserListResponse[];
        nextCursor: string | null;
    }>(cacheKey);

    if (cached) {
        return cached;
    }

    const users = await prisma.user.findMany({
        take: limit,
        orderBy: { id: 'desc' },
        ...(cursor && {
            cursor: { id: cursor },
            skip: 1,
        }),
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
        select: listUsersSelect,
    });

    const result = {
        users,
        nextCursor: users.length ? users[users.length - 1].id : null,
    };

    await setCache(cacheKey, result);

    return result;
};

export const findUserByUsername = async (
    username: string
): Promise<UserAuthRecord | null> => {
    return prisma.user.findUnique({
        where: { username },
        select: {
            id: true,
            username: true,
            email: true,
            password: true,
        },
    });
};

export const findUserById = async (
    id: string
): Promise<UserListResponse | null> => {
    const cacheKey = buildUserByIdCacheKey(id);
    const cached = await getCache<UserListResponse>(cacheKey);

    if (cached) {
        return cached;
    }

    const result = await prisma.user.findUnique({
        where: { id },
        select: listUsersSelect,
    });

    if (result) {
        await setCache(cacheKey, result);
    }

    return result;
};
