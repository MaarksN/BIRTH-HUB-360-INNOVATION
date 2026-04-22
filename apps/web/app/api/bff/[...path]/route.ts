import { NextRequest, NextResponse } from "next/server";

import { getWebConfig } from "@birthub/config/web";

import { fetchWithTimeout } from "@birthub/utils/fetch";

import { isBffPathAllowed } from "../policy";

const webConfig = getWebConfig();
const BFF_PROXY_TIMEOUT_MS = 8_000;

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

function buildProxyHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  const forwardedHeaderNames = [
    "authorization",
    "content-type",
    "cookie",
    "x-active-tenant",
    "x-correlation-id",
    "x-csrf-token",
    "x-request-id"
  ];

  for (const headerName of forwardedHeaderNames) {
    const value = request.headers.get(headerName);

    if (value) {
      headers.set(headerName, value);
    }
  }

  return headers;
}

async function proxy(request: NextRequest, path: string): Promise<NextResponse> {
  if (!isBffPathAllowed(path)) {
    return NextResponse.json({ error: "Path is not allowed by BFF policy." }, { status: 403 });
  }

  const requestInit: RequestInit = {
    headers: buildProxyHeaders(request),
    method: request.method
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    requestInit.body = await request.text();
  }

  const response = await fetchWithTimeout(`${webConfig.NEXT_PUBLIC_API_URL}/${path}`, {
    ...requestInit,
    timeoutMessage: `BFF proxy exceeded the ${BFF_PROXY_TIMEOUT_MS}ms timeout budget.`,
    timeoutMs: BFF_PROXY_TIMEOUT_MS
  });

  const nextResponse = new NextResponse(await response.text(), { status: response.status });
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

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxy(request, path.join("/"));
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path.join("/"));
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path.join("/"));
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path.join("/"));
}
