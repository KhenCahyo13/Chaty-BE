import { findUserById } from '@modules/user/user.repository';
import { UserListResponse } from '@modules/user/user.types';

export const getProfile = async (
    userId: string
): Promise<UserListResponse | null> => {
    return await findUserById(userId);
};
