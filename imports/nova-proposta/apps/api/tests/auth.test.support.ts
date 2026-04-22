import assert from "node:assert/strict";

import type { ApiConfig } from "@birthub/config";

import { createApp } from "../src/app.js";
import { createTestApiConfig } from "./test-config.js";

export function stubMethod(target: object, key: string, value: unknown): () => void {
  const original: unknown = Reflect.get(target, key) as unknown;
  Reflect.set(target, key, value);
  return () => {
    Reflect.set(target, key, original);
  };
}

export function createAuthTestApp(config = createTestApiConfig()) {
  return createApp({
    config,
    healthService: () =>
      Promise.resolve({
        checkedAt: new Date("2026-03-13T00:00:00.000Z").toISOString(),
        services: {
          database: { status: "up" as const },
          externalDependencies: [],
          redis: { status: "up" as const }
        },
        status: "ok" as const
      }),
    shouldExposeDocs: false
  });
}

export function readSetCookies(response: { headers: Record<string, unknown> }): string[] {
  const headerValue = response.headers["set-cookie"];

  return Array.isArray(headerValue)
    ? headerValue.filter((value): value is string => typeof value === "string")
    : [];
}

export function assertAuthCookies(config: ApiConfig, cookies: string[]): void {
  for (const cookieName of [
    config.API_AUTH_COOKIE_NAME,
    config.API_AUTH_REFRESH_COOKIE_NAME,
    config.API_CSRF_COOKIE_NAME
  ]) {
    assert.ok(cookies.some((value) => value.startsWith(`${cookieName}=`)));
  }
}
