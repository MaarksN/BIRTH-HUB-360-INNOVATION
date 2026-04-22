
// 
import { createLogger } from "@birthub/logger";

const logger = createLogger("integrations-http");

export interface HttpRequestOptions {
  idempotencyKey?: string;
  providerName?: string;
  apiKey?: string;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  headers?: Record<string, string>;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

export async function postJson<T>(
  url: string,
  payload: unknown,
  options: HttpRequestOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 10_000;
  const retries = options.retries ?? 2;
  const retryDelayMs = options.retryDelayMs ?? 250;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), timeoutMs);


    logger.info({ url, attempt, provider: options.providerName ?? "unknown" }, "Starting external API call");
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "user-agent": "birthub-integrations/1.0",
          ...(options.apiKey ? { authorization: `Bearer ${options.apiKey}` } : {}),
          ...(options.headers ?? {}),
          ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {})
        },
        body: JSON.stringify(payload),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const body = await response.text();
        const error = new Error(`HTTP ${response.status}: ${body}`);
        if (attempt < retries && isRetryableStatus(response.status)) {
          await sleep(retryDelayMs * (attempt + 1));
          continue;
        }
        throw error;
      }

      return response.json() as Promise<T>;
    } catch (error) {

      logger.error({ url, attempt, error: error instanceof Error ? error.message : "Unknown error", provider: options.providerName ?? "unknown" }, "External API call failed");

      lastError = error;
      if (attempt < retries) {
        await sleep(retryDelayMs * (attempt + 1));
        continue;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Failed to call external API");
}

export async function getJson<T>(
  url: string,
  options: HttpRequestOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 10_000;
  const retries = options.retries ?? 2;
  const retryDelayMs = options.retryDelayMs ?? 250;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "user-agent": "birthub-integrations/1.0",
          ...(options.apiKey ? { authorization: `Bearer ${options.apiKey}` } : {}),
          ...(options.headers ?? {}),
        },
        signal: abortController.signal,
      });

      if (!response.ok) {
        const body = await response.text();
        const error = new Error(`HTTP ${response.status}: ${body}`);
        if (attempt < retries && isRetryableStatus(response.status)) {
          await sleep(retryDelayMs * (attempt + 1));
          continue;
        }
        throw error;
      }

      return response.json() as Promise<T>;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(retryDelayMs * (attempt + 1));
        continue;
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Failed to call external API");
}
