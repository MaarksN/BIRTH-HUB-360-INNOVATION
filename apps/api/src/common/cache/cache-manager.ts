import type Redis from "ioredis";

/**
 * Intelligent caching layer with TTL, tagging, and invalidation strategies
 */

export interface CacheEntry<T> {
  value: T;
  expiresAt: Date;
  tags: Set<string>;
  version: number;
}

export interface CacheStrategy {
  ttl: number; // milliseconds
  tags?: string[];
  version?: number;
  skipIfError?: boolean; // Return stale data on Redis error
}

export class CacheManager {
  private redis: Redis;
  private localCache: Map<string, CacheEntry<unknown>> = new Map();
  private logger: any;

  constructor(redis: Redis, logger: any) {
    this.redis = redis;
    this.logger = logger;
  }

  /**
   * Get value from cache (Redis + local memory)
   */
  async get<T>(key: string): Promise<T | null> {
    // Check local cache first
    const localEntry = this.localCache.get(key);
    if (localEntry && new Date() < localEntry.expiresAt) {
      return localEntry.value as T;
    }

    // Check Redis
    try {
      const redisData = await this.redis.getex(key, "EX", "3600");
      if (redisData) {
        const value = JSON.parse(redisData) as T;
        this.localCache.set(key, {
          value,
          expiresAt: new Date(Date.now() + 3600000),
          tags: new Set(),
          version: 1
        });
        return value;
      }
    } catch (error) {
      this.logger.warn({ error, key }, "Cache read error");
    }

    this.localCache.delete(key);
    return null;
  }

  /**
   * Set value in cache with strategy
   */
  async set<T>(key: string, value: T, strategy: CacheStrategy): Promise<void> {
    try {
      const ttlSeconds = Math.ceil(strategy.ttl / 1000);
      const serialized = JSON.stringify(value);

      // Store in Redis
      await this.redis.setex(key, ttlSeconds, serialized);

      // Store tags for invalidation
      if (strategy.tags && strategy.tags.length > 0) {
        const tagKeys = strategy.tags.map((tag) => `cache:tag:${tag}`);
        await this.redis.sadd(tagKeys[0], key);
        for (let i = 1; i < tagKeys.length; i++) {
          await this.redis.sadd(tagKeys[i], key);
        }
        await this.redis.expire(`cache:tag:${strategy.tags[0]}`, ttlSeconds);
      }

      // Store in local cache
      this.localCache.set(key, {
        value,
        expiresAt: new Date(Date.now() + strategy.ttl),
        tags: new Set(strategy.tags),
        version: strategy.version ?? 1
      });
    } catch (error) {
      if (!strategy.skipIfError) {
        throw error;
      }
      this.logger.warn({ error, key }, "Cache write error (skipped)");
    }
  }

  /**
   * Get or compute (cache-aside pattern)
   */
  async getOrCompute<T>(
    key: string,
    computeFn: () => Promise<T>,
    strategy: CacheStrategy
  ): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Compute and cache
    const value = await computeFn();
    await this.set(key, value, strategy);
    return value;
  }

  /**
   * Invalidate by key
   */
  async invalidate(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      this.localCache.delete(key);
      this.logger.debug({ key }, "Cache invalidated");
    } catch (error) {
      this.logger.error({ error, key }, "Cache invalidation error");
    }
  }

  /**
   * Invalidate by tag
   */
  async invalidateByTag(tag: string): Promise<number> {
    try {
      const tagKey = `cache:tag:${tag}`;
      const keys = await this.redis.smembers(tagKey);

      if (keys.length > 0) {
        await this.redis.del(...keys);
        for (const key of keys) {
          this.localCache.delete(key);
        }
      }

      await this.redis.del(tagKey);
      this.logger.info({ tag, keysInvalidated: keys.length }, "Cache tag invalidated");
      return keys.length;
    } catch (error) {
      this.logger.error({ error, tag }, "Cache tag invalidation error");
      return 0;
    }
  }

  /**
   * Invalidate pattern (glob)
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
        for (const key of keys) {
          this.localCache.delete(key);
        }
      }

      this.logger.info({ pattern, keysInvalidated: keys.length }, "Cache pattern invalidated");
      return keys.length;
    } catch (error) {
      this.logger.error({ error, pattern }, "Cache pattern invalidation error");
      return 0;
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      await this.redis.flushdb();
      this.localCache.clear();
      this.logger.info("Cache cleared");
    } catch (error) {
      this.logger.error({ error }, "Cache clear error");
    }
  }

  /**
   * Get cache stats
   */
  async getStats(): Promise<{
    localSize: number;
    redisMemoryUsage: number;
    redisKeyCount: number;
  }> {
    try {
      const info = await this.redis.info("memory");
      const dbsize = await this.redis.dbsize();

      return {
        localSize: this.localCache.size,
        redisKeyCount: dbsize,
        redisMemoryUsage: parseInt(info.split("\r\n")[1].split(":")[1] ?? "0")
      };
    } catch (error) {
      this.logger.error({ error }, "Cache stats retrieval error");
      return { localSize: 0, redisMemoryUsage: 0, redisKeyCount: 0 };
    }
  }
}

/**
 * Common cache strategies
 */
export const CACHE_STRATEGIES = {
  SHORT: {
    ttl: 5 * 60 * 1000, // 5 minutes
    tags: ["short-lived"]
  } as CacheStrategy,

  MEDIUM: {
    ttl: 30 * 60 * 1000, // 30 minutes
    tags: ["medium-lived"]
  } as CacheStrategy,

  LONG: {
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    tags: ["long-lived"]
  } as CacheStrategy,

  USER_PROFILE: {
    ttl: 60 * 60 * 1000, // 1 hour
    tags: ["user-profile"],
    skipIfError: true
  } as CacheStrategy,

  ORGANIZATION_DATA: {
    ttl: 30 * 60 * 1000, // 30 minutes
    tags: ["organization"],
    skipIfError: true
  } as CacheStrategy,

  WORKFLOW_DEFINITION: {
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    tags: ["workflow"],
    skipIfError: false
  } as CacheStrategy
};
