export type UserAuthRecord = {
    id: string;
    username: string;
    email: string;
    password: string;
};

export interface UserListResponse {
    id: string;
    username: string;
    email: string;
    profile: {
        id: string;
        fullName: string;
        about: string | null;
        avatarUrl: string | null;
    } | null;
}
