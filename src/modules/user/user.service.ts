import { findAllUsers } from './user.repository';
import { UserListResponse } from './user.types';

export const getAllUsers = async (
    userId: string,
    limit: number,
    search: string,
    cursor?: string
): Promise<{ users: UserListResponse[]; nextCursor: string | null }> => {
    return await findAllUsers(userId, limit, search, cursor);
};
