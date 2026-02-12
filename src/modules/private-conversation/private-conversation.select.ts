// List Select
export const profileListSelect = {
    about: true,
    avatarUrl: true,
    fullName: true,
    id: true,
} as const;

export const userListSelect = {
    email: true,
    id: true,
    profile: {
        select: profileListSelect,
    },
    username: true,
} as const;

export const lastMessageListSelect = {
    content: true,
    createdAt: true,
    id: true,
    isDeleted: true,
    senderId: true,
} as const;

// Details Select
export const detailsMessageSelect = {
    ...lastMessageListSelect,
    senderId: true,
} as const;

export const conversationUserIdsSelect = {
    id: true,
    user1Id: true,
    user2Id: true,
} as const;
