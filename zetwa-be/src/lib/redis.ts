import Redis from 'ioredis';
import { config } from '../config/index.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('redis');

let redis: Redis | null = null;
let redisEnabled = true;
let connectionAttempted = false;

export const getRedis = (): Redis | null => {
  if (!redisEnabled) {
    return null;
  }

  if (!redis && !connectionAttempted) {
    connectionAttempted = true;
    
    try {
      redis = new Redis(config.redis.url, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          if (times > 3) {
            logger.warn('Redis connection failed after 3 attempts, disabling Redis');
            redisEnabled = false;
            return null; // Stop retrying
          }
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
        lazyConnect: true,
      });

      redis.on('connect', () => {
        logger.info('✅ Redis connected');
      });

      redis.on('error', (err) => {
        if (redisEnabled) {
          logger.debug({ error: err.message }, 'Redis connection error (Redis is optional)');
        }
      });

      redis.on('reconnecting', () => {
        if (redisEnabled) {
          logger.debug('Redis reconnecting...');
        }
      });

      // Try to connect
      redis.connect().catch(() => {
        logger.info('ℹ️ Redis not available, running without cache');
        redisEnabled = false;
        redis = null;
      });
    } catch {
      logger.info('ℹ️ Redis not configured, running without cache');
      redisEnabled = false;
      redis = null;
    }
  }

  return redis;
};

export const isRedisAvailable = (): boolean => {
  return redisEnabled && redis !== null && redis.status === 'ready';
};

export const closeRedis = async () => {
  if (redis) {
    await redis.quit();
    redis = null;
    logger.info('Redis connection closed');
  }
};

// Cache utilities (gracefully handles Redis being unavailable)
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const client = getRedis();
    if (!client || !isRedisAvailable()) return null;
    
    try {
      const data = await client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const client = getRedis();
    if (!client || !isRedisAvailable()) return;
    
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await client.setex(key, ttlSeconds, serialized);
      } else {
        await client.set(key, serialized);
      }
    } catch {
      // Silently fail - cache is optional
    }
  },

  async del(key: string): Promise<void> {
    const client = getRedis();
    if (!client || !isRedisAvailable()) return;
    
    try {
      await client.del(key);
    } catch {
      // Silently fail
    }
  },

  async exists(key: string): Promise<boolean> {
    const client = getRedis();
    if (!client || !isRedisAvailable()) return false;
    
    try {
      const result = await client.exists(key);
      return result === 1;
    } catch {
      return false;
    }
  },

  async keys(pattern: string): Promise<string[]> {
    const client = getRedis();
    if (!client || !isRedisAvailable()) return [];
    
    try {
      return await client.keys(pattern);
    } catch {
      return [];
    }
  },

  async ttl(key: string): Promise<number> {
    const client = getRedis();
    if (!client || !isRedisAvailable()) return -1;
    
    try {
      return await client.ttl(key);
    } catch {
      return -1;
    }
  },
};

// Pub/Sub utilities (gracefully handles Redis being unavailable)
export const pubsub = {
  async publish(channel: string, message: unknown): Promise<void> {
    const client = getRedis();
    if (!client || !isRedisAvailable()) return;
    
    try {
      await client.publish(channel, JSON.stringify(message));
    } catch {
      // Silently fail
    }
  },

  subscribe(channel: string, callback: (message: unknown) => void): Redis | null {
    const client = getRedis();
    if (!client || !isRedisAvailable()) return null;
    
    try {
      const subscriber = client.duplicate();
      subscriber.subscribe(channel);
      subscriber.on('message', (_channel, message) => {
        callback(JSON.parse(message));
      });
      return subscriber;
    } catch {
      return null;
    }
  },
};
