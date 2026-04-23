import { isSupportedSessionAction } from "../session-actions";
import { NextRequest, NextResponse } from "next/server";

import { fetchWithTimeout } from "../../../../lib/fetch-with-timeout";

import { resolveApiBaseUrl } from "../../../../lib/auth-client";

const AUTH_SESSION_PROXY_TIMEOUT_MS = 5_000;
type RouteContext = { params: Promise<{ session: string[] }> };

function buildProxyHeaders(request: NextRequest, initHeaders?: RequestInit["headers"]): Headers {
  const headers = new Headers(initHeaders);

  const forwardedHeaderNames = [
    "authorization",
    "cookie",
    "x-active-tenant",
    "x-csrf-token",
    "x-request-id",
  ];

  for (const headerName of forwardedHeaderNames) {
    const value = request.headers.get(headerName);

    if (value && !headers.has(headerName)) {
      headers.set(headerName, value);
    }
  }

  return headers;
}

async function proxyApi(
  request: NextRequest,
  path: string,
  init: RequestInit
): Promise<NextResponse> {
  const headers = buildProxyHeaders(request, init.headers);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetchWithTimeout(`${resolveApiBaseUrl()}${path}`, {
    ...init,
    headers,
    timeoutMessage: `Auth BFF exceeded the ${AUTH_SESSION_PROXY_TIMEOUT_MS}ms timeout budget.`,
    timeoutMs: AUTH_SESSION_PROXY_TIMEOUT_MS,
  });

  const responseBody = await response.text();
  const nextResponse = new NextResponse(responseBody, { status: response.status });
  const contentType = response.headers.get("content-type");
  const setCookie = response.headers.get("set-cookie");
  if (contentType) {
    nextResponse.headers.set("content-type", contentType);
  }
  if (setCookie) {
    nextResponse.headers.set("set-cookie", setCookie);
  }
  return nextResponse;
}

export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const params = await context.params;
  const action = params.session?.[0];
  const body = request.method === "POST" ? await request.text() : "";

  if (!isSupportedSessionAction(action)) {
    return NextResponse.json({ error: "Unsupported auth action." }, { status: 404 });
  }

  if (action === "signin") {
    return proxyApi(request, "/api/v1/auth/login", { body, method: "POST" });
  }

  if (action === "signout") {
    return proxyApi(request, "/api/v1/auth/logout", { method: "POST" });
  }

  if (action === "refresh") {
    return proxyApi(request, "/api/v1/auth/refresh", { body, method: "POST" });
  }

  if (action === "mfa") {
    return proxyApi(request, "/api/v1/auth/mfa/challenge", { body, method: "POST" });
  }

  return NextResponse.json({ error: "Unsupported auth action." }, { status: 404 });
}

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const params = await context.params;
  const action = params.session?.[0];

  if (action === "session") {
    return proxyApi(request, "/api/v1/sessions", {
      method: "GET",
    });
  }

  return NextResponse.json({ error: "Unsupported auth action." }, { status: 404 });
}
