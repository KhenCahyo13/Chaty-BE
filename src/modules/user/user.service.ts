import { findAllUsers } from './user.repository';
import { UserListResponse } from './user.types';

export const getAllUsers = async (
    userId: string,
    limit: number,
    search: string,
    cursor?: string
): Promise<{ nextCursor: null | string; users: UserListResponse[] }> => {
    return await findAllUsers(userId, limit, search, cursor);
};
