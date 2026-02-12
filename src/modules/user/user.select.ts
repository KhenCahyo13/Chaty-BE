export const profileListSelect = {
    about: true,
    avatarUrl: true,
    fullName: true,
    id: true,
} as const;

export const listUsersSelect = {
    email: true,
    id: true,
    profile: {
        select: profileListSelect,
    },
    username: true,
};
