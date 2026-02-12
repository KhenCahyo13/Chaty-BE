import prisma from '@lib/prisma';

import { registerPushTokenSelect } from './user-push-token.select';
import { RegisterPushTokenResult } from './user-push-token.types';

export const upsertUserPushToken = async (
    userId: string,
    payload: {
        fcm_token: string;
        platform: 'ios' | 'android' | 'web';
        device_id?: string;
    }
): Promise<RegisterPushTokenResult> => {
    return prisma.userPushToken.upsert({
        where: {
            userId_platform: {
                userId,
                platform: payload.platform,
            },
        },
        update: {
            fcmToken: payload.fcm_token,
            deviceId: payload.device_id,
            isActive: true,
            lastSeenAt: new Date(),
            updatedAt: new Date(),
        },
        create: {
            userId,
            fcmToken: payload.fcm_token,
            platform: payload.platform,
            deviceId: payload.device_id,
            isActive: true,
        },
        select: registerPushTokenSelect,
    });
};

export const findActivePushTokensByUserId = async (
    userId: string
): Promise<string[]> => {
    const tokens = await prisma.userPushToken.findMany({
        where: {
            userId,
            isActive: true,
        },
        select: {
            fcmToken: true,
        },
    });

    return tokens.map((token) => token.fcmToken);
};
