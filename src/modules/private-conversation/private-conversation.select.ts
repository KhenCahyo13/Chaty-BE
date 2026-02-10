const profileListSelect = {
    id: true,
    fullName: true,
    about: true,
    avatarUrl: true,
} as const;

const userListSelect = {
    id: true,
    username: true,
    email: true,
    profile: {
        select: profileListSelect,
    },
} as const;

const lastMessageListSelect = {
    id: true,
    content: true,
    isDeleted: true,
    createdAt: true,
} as const;

export { profileListSelect, userListSelect, lastMessageListSelect };
