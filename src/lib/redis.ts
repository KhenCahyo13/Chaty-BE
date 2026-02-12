import { redisConfig } from '@config/redis';
import { createClient, type RedisClientType } from 'redis';

const CACHE_NAMESPACE = 'dev-chaty';

let redisClient: null | RedisClientType = null;
let connectPromise: null | Promise<RedisClientType | undefined> = null;

const buildNamespacedKey = (key: string): string => `${CACHE_NAMESPACE}:${key}`;

const getRedisClient = (): null | RedisClientType => {
    if (!redisConfig.url) {
        return null;
    }

    if (!redisClient) {
        redisClient = createClient({
            url: redisConfig.url,
        });

        redisClient.on('error', () => undefined);
    }

    return redisClient;
};

const getConnectedRedisClient = async (): Promise<null | RedisClientType> => {
    const client = getRedisClient();

    if (!client) {
        return null;
    }

    if (client.isOpen) {
        return client;
    }

    if (!connectPromise) {
        connectPromise = client
            .connect()
            .catch(() => undefined)
            .finally(() => {
                connectPromise = null;
            });
    }

    await connectPromise;

    return client.isOpen ? client : null;
};

export const getCache = async <T>(key: string): Promise<null | T> => {
    try {
        const client = await getConnectedRedisClient();
        if (!client) {
            return null;
        }

        const value = await client.get(buildNamespacedKey(key));
        return value ? (JSON.parse(value) as T) : null;
    } catch {
        return null;
    }
};

export const setCache = async (
    key: string,
    value: unknown,
    ttlSeconds: number = redisConfig.defaultTtlSeconds
): Promise<void> => {
    try {
        const client = await getConnectedRedisClient();
        if (!client) {
            return;
        }

        await client.set(buildNamespacedKey(key), JSON.stringify(value), {
            EX: ttlSeconds,
        });
    } catch {
        return;
    }
};

export const deleteCacheByPatterns = async (
    patterns: string[]
): Promise<void> => {
    try {
        const client = await getConnectedRedisClient();
        if (!client) {
            return;
        }

        for (const pattern of patterns) {
            for await (const keys of client.scanIterator({
                COUNT: 100,
                MATCH: buildNamespacedKey(pattern),
            })) {
                for (const key of keys) {
                    await client.del(key);
                }
            }
        }
    } catch {
        return;
    }
};
