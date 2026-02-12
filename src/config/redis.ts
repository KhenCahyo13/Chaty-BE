import './env';

const parsedDefaultTtl = Number(process.env.REDIS_DEFAULT_TTL_SECONDS);

export const redisConfig = {
    url: process.env.REDIS_URL,
    defaultTtlSeconds:
        Number.isFinite(parsedDefaultTtl) && parsedDefaultTtl > 0
            ? parsedDefaultTtl
            : 3600,
};
