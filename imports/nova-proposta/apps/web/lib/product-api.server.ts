import { getWebConfig } from "@birthub/config/web";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { fetchWithTimeout } from "@birthub/utils/fetch";
import { ACTIVE_TENANT_COOKIE_NAME } from "./session-context";

const PRODUCT_API_TIMEOUT_MS = 8_000;

class ProductApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "ProductApiError";
  }
}

export async function fetchProductJson<T>(path: string, init?: RequestInit): Promise<T> {
  const config = getWebConfig();
  const cookieStore = await cookies();
  const requestHeaders = new Headers(init?.headers);
  const activeTenant = cookieStore.get(ACTIVE_TENANT_COOKIE_NAME)?.value?.trim();

  requestHeaders.set("cookie", cookieStore.toString());

  if (activeTenant) {
    requestHeaders.set("x-active-tenant", activeTenant);
  }

  const response = await fetchWithTimeout(`${config.NEXT_PUBLIC_API_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: requestHeaders,
    timeoutMessage: `Product API exceeded the ${PRODUCT_API_TIMEOUT_MS}ms timeout budget for ${path}.`,
    timeoutMs: PRODUCT_API_TIMEOUT_MS
  });

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    throw new ProductApiError(`Failed to fetch ${path}: ${response.status}`, response.status);
  }

  return (await response.json()) as T;
}
