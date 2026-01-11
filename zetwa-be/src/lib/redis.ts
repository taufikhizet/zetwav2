import Redis from 'ioredis';
import { config } from '../config/index.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('redis');

let redis: Redis | null = null;

export const getRedis = (): Redis => {
  if (!redis) {
    redis = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError(err) {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
    });

    redis.on('connect', () => {
      logger.info('✅ Redis connected');
    });

    redis.on('error', (err) => {
      logger.error({ error: err.message }, '❌ Redis error');
    });

    redis.on('reconnecting', () => {
      logger.warn('Redis reconnecting...');
    });
  }

  return redis;
};

export const closeRedis = async () => {
  if (redis) {
    await redis.quit();
    redis = null;
    logger.info('Redis connection closed');
  }
};

// Cache utilities
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const data = await getRedis().get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  },

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await getRedis().setex(key, ttlSeconds, serialized);
    } else {
      await getRedis().set(key, serialized);
    }
  },

  async del(key: string): Promise<void> {
    await getRedis().del(key);
  },

  async exists(key: string): Promise<boolean> {
    const result = await getRedis().exists(key);
    return result === 1;
  },

  async keys(pattern: string): Promise<string[]> {
    return getRedis().keys(pattern);
  },

  async ttl(key: string): Promise<number> {
    return getRedis().ttl(key);
  },
};

// Pub/Sub utilities
export const pubsub = {
  async publish(channel: string, message: unknown): Promise<void> {
    await getRedis().publish(channel, JSON.stringify(message));
  },

  subscribe(channel: string, callback: (message: unknown) => void): Redis {
    const subscriber = getRedis().duplicate();
    subscriber.subscribe(channel);
    subscriber.on('message', (_channel, message) => {
      callback(JSON.parse(message));
    });
    return subscriber;
  },
};
