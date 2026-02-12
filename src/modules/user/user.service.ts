import { findAllUsers } from './user.repository';
import { UserListResponse } from './user.types';

export const getAllUsers = async (
    userId: string,
    limit: number,
    search: string
): Promise<UserListResponse[]> => {
    return await findAllUsers(userId, limit, search);
};
