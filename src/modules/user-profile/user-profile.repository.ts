import prisma from '@lib/prisma';

export const upsertUserProfile = async (
    userId: string,
    payload: {
        about: null | string;
        avatarUrl: null | string;
        fullName: string;
    }
) => {
    return prisma.userProfile.upsert({
        create: {
            about: payload.about,
            avatarUrl: payload.avatarUrl,
            fullName: payload.fullName,
            userId,
        },
        update: {
            about: payload.about,
            avatarUrl: payload.avatarUrl,
            fullName: payload.fullName,
        },
        where: {
            userId,
        },
    });
};
