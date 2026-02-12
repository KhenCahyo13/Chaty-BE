import prisma from '@lib/prisma';

import { registerPushTokenSelect } from './user-push-token.select';
import { RegisterPushTokenResult } from './user-push-token.types';

export const upsertUserPushToken = async (
    userId: string,
    payload: {
        device_id?: string;
        fcm_token: string;
        platform: 'android' | 'ios' | 'web';
    }
): Promise<RegisterPushTokenResult> => {
    return prisma.userPushToken.upsert({
        create: {
            deviceId: payload.device_id,
            fcmToken: payload.fcm_token,
            isActive: true,
            platform: payload.platform,
            userId,
        },
        select: registerPushTokenSelect,
        update: {
            deviceId: payload.device_id,
            fcmToken: payload.fcm_token,
            isActive: true,
            lastSeenAt: new Date(),
            updatedAt: new Date(),
        },
        where: {
            userId_platform: {
                platform: payload.platform,
                userId,
            },
        },
    });
};

export const findActivePushTokensByUserId = async (
    userId: string
): Promise<string[]> => {
    const tokens = await prisma.userPushToken.findMany({
        select: {
            fcmToken: true,
        },
        where: {
            isActive: true,
            userId,
        },
    });

    return tokens.map((token) => token.fcmToken);
};
