import { resolveSupabaseStorageObjectPath } from '@lib/file-upload';
import { createSignedUrl } from '@lib/supabase-storage';
import { UserListResponse } from '@modules/user/user.types';

import {
    SUPABASE_STORAGE_AVATAR_BUCKET,
    SUPABASE_STORAGE_SIGNED_URL_EXPIRES_IN,
} from '@constants/storage';

export const mapProfileAvatarToSignedUrl = async (
    user: UserListResponse
): Promise<UserListResponse> => {
    const avatarPath = resolveSupabaseStorageObjectPath(
        user.profile?.avatarUrl,
        SUPABASE_STORAGE_AVATAR_BUCKET
    );

    if (!avatarPath || !user.profile) {
        return user;
    }

    const signedUrl = await createSignedUrl({
        bucket: SUPABASE_STORAGE_AVATAR_BUCKET,
        expiresIn: SUPABASE_STORAGE_SIGNED_URL_EXPIRES_IN,
        path: avatarPath,
    });

    return {
        ...user,
        profile: {
            ...user.profile,
            avatarUrl: signedUrl.signedUrl,
        },
    };
};
