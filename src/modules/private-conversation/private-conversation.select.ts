// List Select
export const profileListSelect = {
    id: true,
    fullName: true,
    about: true,
    avatarUrl: true,
} as const;

export const userListSelect = {
    id: true,
    username: true,
    email: true,
    profile: {
        select: profileListSelect,
    },
} as const;

export const lastMessageListSelect = {
    id: true,
    content: true,
    isDeleted: true,
    createdAt: true,
} as const;

// Details Select
export const detailsMessageSelect = {
    ...lastMessageListSelect,
    senderId: true,
} as const;
