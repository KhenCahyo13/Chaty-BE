import { Prisma } from '@generated/prisma/client';

import { registerPushTokenSelect } from './user-push-token.select';

export type RegisterPushTokenResult = Prisma.UserPushTokenGetPayload<{
    select: typeof registerPushTokenSelect;
}>;
