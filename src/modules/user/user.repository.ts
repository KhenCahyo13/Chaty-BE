import prisma from '@lib/prisma';

import { listUsersSelect } from './user.select';
import type { UserAuthRecord, UserListResponse } from './user.types';

export const findAllUsers = async (
    userId: string,
    limit: number,
    search: string
): Promise<UserListResponse[]> => {
    const users = await prisma.user.findMany({
        take: limit,
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

    return users;
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
