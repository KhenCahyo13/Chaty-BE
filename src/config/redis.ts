import './env';

const parsedDefaultTtl = Number(process.env.REDIS_DEFAULT_TTL_SECONDS);

export const redisConfig = {
    defaultTtlSeconds:
        Number.isFinite(parsedDefaultTtl) && parsedDefaultTtl > 0
            ? parsedDefaultTtl
            : 3600,
    url: process.env.REDIS_URL,
};
