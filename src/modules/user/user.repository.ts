import prisma from "@lib/prisma";

import type { UserAuthRecord } from "./user.types";

export const findUserByUsername = async (
    username: string,
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
