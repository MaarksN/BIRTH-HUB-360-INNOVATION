import { Redis } from "ioredis";

export class QueueIdempotencyStore {
  constructor(private readonly redis: Redis) {}

  async has(key: string): Promise<boolean> {
    const value = await this.redis.get(key);
    return value !== null;
  }

  async put(key: string, value: unknown, options?: { ttlSeconds?: number }): Promise<void> {
    const payload = JSON.stringify(value ?? null);
    if (options?.ttlSeconds) {
      await this.redis.set(key, payload, "EX", options.ttlSeconds);
    } else {
      await this.redis.set(key, payload);
    }
  }

  async claim(key: string, value: unknown, options?: { ttlSeconds?: number }): Promise<boolean> {
    const payload = JSON.stringify(value ?? null);
    const ttl = options?.ttlSeconds ?? 86400;
    const result = await this.redis.set(key, payload, "EX", ttl, "NX");
    return result === "OK";
  }
}
