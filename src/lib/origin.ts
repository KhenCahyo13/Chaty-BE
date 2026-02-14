export const formatAllowedOrigins = (
    value: null | string | undefined
): string | string[] => {
    if (!value) {
        return '*';
    }

    const origins = value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

    if (origins.length === 0) {
        return '*';
    }

    return [...new Set(origins)];
};
