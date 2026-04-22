import assert from "node:assert/strict";
import test from "node:test";

import type { Request, Response } from "express";

import { sendEtaggedJson } from "../src/common/cache/http-cache.js";

function createResponseDouble() {
  const headers = new Map<string, string>();
  let statusCode = 200;
  let contentType: string | null = null;
  let body: string | null = null;
  let ended = false;

  const response = {
    end() {
      ended = true;
      return response;
    },
    send(value: string) {
      body = value;
      return response;
    },
    setHeader(name: string, value: string) {
      headers.set(name, value);
    },
    status(code: number) {
      statusCode = code;
      return response;
    },
    type(value: string) {
      contentType = value;
      return response;
    }
  } as unknown as Response;

  return {
    response,
    snapshot: () => ({
      body,
      contentType,
      ended,
      headers,
      statusCode
    })
  };
}

function createRequestDouble(ifNoneMatch?: string): Request {
  return {
    header(name: string) {
      if (name.toLowerCase() === "if-none-match") {
        return ifNoneMatch;
      }
      return undefined;
    }
  } as unknown as Request;
}

void test("sendEtaggedJson returns 200 with cache headers and serialized JSON", () => {
  const payload = {
    ok: true
  };
  const responseDouble = createResponseDouble();

  sendEtaggedJson(createRequestDouble(), responseDouble.response, payload, "public, max-age=120");

  const snapshot = responseDouble.snapshot();
  assert.equal(snapshot.statusCode, 200);
  assert.equal(snapshot.contentType, "application/json");
  assert.equal(snapshot.body, JSON.stringify(payload));
  assert.equal(snapshot.headers.get("Cache-Control"), "public, max-age=120");
  assert.match(snapshot.headers.get("ETag") ?? "", /^"[a-f0-9]{64}"$/);
  assert.equal(snapshot.ended, false);
});

void test("sendEtaggedJson returns 304 when the caller already has the current ETag", () => {
  const payload = {
    feature: "cache"
  };
  const firstResponse = createResponseDouble();

  sendEtaggedJson(createRequestDouble(), firstResponse.response, payload);

  const etag = firstResponse.snapshot().headers.get("ETag");
  assert.ok(etag);

  const secondResponse = createResponseDouble();
  sendEtaggedJson(createRequestDouble(etag), secondResponse.response, payload);

  const snapshot = secondResponse.snapshot();
  assert.equal(snapshot.statusCode, 304);
  assert.equal(snapshot.ended, true);
  assert.equal(snapshot.body, null);
});
