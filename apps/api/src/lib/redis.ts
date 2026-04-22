import type { ApiConfig } from "@birthub/config";
import { Redis } from "ioredis";

const REDIS_CONNECT_TIMEOUT_MS = 5_000;
const redisClients = new Map<string, Redis>();

export function getSharedRedis(configOrUrl: ApiConfig | string): Redis {
  const redisUrl = typeof configOrUrl === "string" ? configOrUrl : configOrUrl.REDIS_URL;
  const existing = redisClients.get(redisUrl);

  if (existing) {
    return existing;
  }

  const redis = new Redis(redisUrl, {
    connectTimeout: REDIS_CONNECT_TIMEOUT_MS,
    enableOfflineQueue: false,
    lazyConnect: true,
    maxRetriesPerRequest: null
  });
  redisClients.set(redisUrl, redis);
  return redis;
}
