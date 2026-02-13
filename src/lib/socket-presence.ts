const activeSocketCountByUserId = new Map<string, number>();

export const markUserConnected = (userId: string): boolean => {
    const currentSocketCount = activeSocketCountByUserId.get(userId) ?? 0;
    activeSocketCountByUserId.set(userId, currentSocketCount + 1);

    return currentSocketCount === 0;
};

export const markUserDisconnected = (userId: string): boolean => {
    const previousCount = activeSocketCountByUserId.get(userId) ?? 1;
    const nextCount = Math.max(0, previousCount - 1);

    if (nextCount === 0) {
        activeSocketCountByUserId.delete(userId);
        return true;
    }

    activeSocketCountByUserId.set(userId, nextCount);

    return false;
};
