export const profileListSelect = {
    id: true,
    fullName: true,
    about: true,
    avatarUrl: true,
} as const;

export const listUsersSelect = {
    id: true,
    username: true,
    email: true,
    profile: {
        select: profileListSelect,
    },
};
