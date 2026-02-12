import prisma from '@lib/prisma';

export const upsertUserProfile = async (
    userId: string,
    payload: {
        fullName: string;
        about: string | null;
        avatarUrl: string | null;
    }
) => {
    return prisma.userProfile.upsert({
        where: {
            userId,
        },
        create: {
            userId,
            fullName: payload.fullName,
            about: payload.about,
            avatarUrl: payload.avatarUrl,
        },
        update: {
            fullName: payload.fullName,
            about: payload.about,
            avatarUrl: payload.avatarUrl,
        },
    });
};
