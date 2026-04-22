import type { PrismaClient } from "@prisma/client";

type ClientMethod = (...args: never[]) => unknown;
type ProxyTarget = Record<PropertyKey, never>;

function bindClientValue(client: PrismaClient, value: unknown): unknown {
  if (typeof value !== "function") {
    return value;
  }

  return (value as ClientMethod).bind(client);
}

export function createPrismaProxy(getClient: () => PrismaClient): PrismaClient {
  return new Proxy<ProxyTarget>(
    {},
    {
      get(_target, property) {
        const client = getClient();
        const value: unknown = Reflect.get(client, property, client);
        return bindClientValue(client, value);
      },
      set(_target, property, value) {
        return Reflect.set(getClient(), property, value);
      }
    }
  ) as unknown as PrismaClient;
}
