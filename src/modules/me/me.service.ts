import {
    buildStorageObjectPath,
    resolveSupabaseStorageObjectPath,
} from '@lib/file-upload';
import { createHttpError } from '@lib/http-error';
import { deleteFile, uploadFileWithBuffer } from '@lib/supabase-storage';
import { invalidateUserCacheById } from '@modules/user/user.cache';
import { findUserById } from '@modules/user/user.repository';
import { UserListResponse } from '@modules/user/user.types';
import { upsertUserProfile } from '@modules/user-profile/user-profile.repository';

import { AVATAR_BUCKET, mapProfileAvatarToSignedUrl } from './me.helpers';

export const getProfile = async (
    userId: string
): Promise<UserListResponse | null> => {
    const user = await findUserById(userId);

    if (!user) {
        return null;
    }

    return mapProfileAvatarToSignedUrl(user);
};

export const updateProfile = async (
    userId: string,
    payload: {
        fullName: string;
        about: string | null;
        avatarFile?: Express.Multer.File;
    }
): Promise<UserListResponse> => {
    const currentUser = await findUserById(userId);

    if (!currentUser) {
        throw createHttpError('User not found.', 404);
    }

    let nextAvatarPath = resolveSupabaseStorageObjectPath(
        currentUser.profile?.avatarUrl,
        AVATAR_BUCKET
    );

    if (payload.avatarFile) {
        const avatarPath = buildStorageObjectPath(
            userId,
            payload.avatarFile.originalname
        );

        await uploadFileWithBuffer({
            bucket: AVATAR_BUCKET,
            path: avatarPath,
            buffer: payload.avatarFile.buffer,
            contentType: payload.avatarFile.mimetype,
            upsert: false,
        });

        const oldAvatarPath = nextAvatarPath;

        if (oldAvatarPath && oldAvatarPath !== avatarPath) {
            try {
                await deleteFile({
                    bucket: AVATAR_BUCKET,
                    path: oldAvatarPath,
                });
            } catch {
                // noop: old avatar cleanup failure should not block profile update.
            }
        }

        nextAvatarPath = avatarPath;
    }

    await upsertUserProfile(userId, {
        fullName: payload.fullName,
        about: payload.about,
        avatarUrl: nextAvatarPath,
    });

    await invalidateUserCacheById(userId);

    const updated = await findUserById(userId);

    if (!updated) {
        throw createHttpError('User not found.', 404);
    }

    return mapProfileAvatarToSignedUrl(updated);
};
