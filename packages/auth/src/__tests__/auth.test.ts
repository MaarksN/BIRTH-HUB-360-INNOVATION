import test from "node:test";
import assert from "node:assert/strict";
import { createAuthService } from "../index.js";

const svc = createAuthService({ jwtSecret: "secret", accessTtlSec: 60, refreshTtlSec: 120 });
const user = { id: "u1", tenantId: "t1", roles: ["ADMIN"], permissions: ["agent:execute"], email: "a@b.com" };

void test("issue and verify access token", async () => {
  const pair = await svc.issueTokens(user);
  const payload = await svc.verifyAccessToken(pair.accessToken);
  assert.equal(payload.id, "u1");
  assert.equal(payload.email, "a@b.com");
});

void test("refresh rotation works", async () => {
  const pair = await svc.issueTokens(user);
  const rotated = await svc.rotateRefreshToken(pair.refreshToken);
  assert.ok(rotated.accessToken.length > 20);
  const rotatedPayload = await svc.verifyAccessToken(rotated.accessToken);
  assert.equal(rotatedPayload.email, "a@b.com");
});

void test("old refresh gets revoked", async () => {
  const pair = await svc.issueTokens(user);
  await svc.rotateRefreshToken(pair.refreshToken);
  await assert.rejects(() => svc.rotateRefreshToken(pair.refreshToken));
});

void test("verifyAccessToken rejects refresh tokens", async () => {
  const pair = await svc.issueTokens(user);
  await assert.rejects(() => svc.verifyAccessToken(pair.refreshToken), /invalid_token_type/);
});

void test("rotateRefreshToken rejects access tokens", async () => {
  const pair = await svc.issueTokens(user);
  await assert.rejects(() => svc.rotateRefreshToken(pair.accessToken), /invalid_token_type/);
});

void test("requireRole allows proper role", () => {
  assert.doesNotThrow(() => svc.requireRole("ADMIN")(user));
});

void test("requireRole blocks missing roles", () => {
  assert.throws(() => svc.requireRole("OWNER")(user), /forbidden_role/);
});

void test("requirePermission allows granted permissions", () => {
  assert.doesNotThrow(() => svc.requirePermission("agent:execute")(user));
});

void test("requirePermission blocks missing", () => {
  assert.throws(() => svc.requirePermission("billing:read")(user));
});
