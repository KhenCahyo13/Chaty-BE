import { resolveSupabaseStorageObjectPath } from '@lib/file-upload';
import { createSignedUrl } from '@lib/supabase-storage';
import { UserListResponse } from '@modules/user/user.types';

export const AVATAR_BUCKET = process.env.SUPABASE_STORAGE_AVATAR_BUCKET!;
export const AVATAR_SIGNED_URL_EXPIRES_IN = Number(process.env.SUPABASE_STORAGE_SIGNED_URL_EXPIRES_IN);

export const mapProfileAvatarToSignedUrl = async (
    user: UserListResponse
): Promise<UserListResponse> => {
    const avatarPath = resolveSupabaseStorageObjectPath(
        user.profile?.avatarUrl,
        AVATAR_BUCKET
    );

    if (!avatarPath || !user.profile) {
        return user;
    }

    const signedUrl = await createSignedUrl({
        bucket: AVATAR_BUCKET,
        path: avatarPath,
        expiresIn: AVATAR_SIGNED_URL_EXPIRES_IN,
    });

    return {
        ...user,
        profile: {
            ...user.profile,
            avatarUrl: signedUrl.signedUrl,
        },
    };
};