export type UserAuthRecord = {
    email: string;
    id: string;
    password: string;
    username: string;
};

export interface UserListResponse {
    email: string;
    id: string;
    profile: null | {
        about: null | string;
        avatarUrl: null | string;
        fullName: string;
        id: string;
    };
    username: string;
}
