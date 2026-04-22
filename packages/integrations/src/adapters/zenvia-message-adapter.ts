export interface ZenviaAdapterHeaders {
  get(name: string): string | null;
}

export interface ZenviaAdapterFetchResponse {
  headers?: ZenviaAdapterHeaders | undefined;
  json(): Promise<unknown>;
  ok: boolean;
  status: number;
  text(): Promise<string>;
}

export type ZenviaAdapterFetch = (
  input: string,
  init: {
    body?: string;
    headers: Record<string, string>;
    method: "GET" | "POST";
    signal?: AbortSignal;
  }
) => Promise<ZenviaAdapterFetchResponse>;

export interface ZenviaMessageAdapterOptions {
  apiToken: string;
  baseUrl?: string;
  fetchImpl?: ZenviaAdapterFetch;
  timeoutMs?: number;
}

export interface ZenviaMessageSendInput {
  channel: string;
  externalId?: string | undefined;
  from: string;
  text: string;
  to: string;
}

export interface ZenviaMessageAdapterResponse {
  body: unknown;
  bodyText: string;
  externalId: string | null;
  messageId: string | null;
  request: {
    method: "GET" | "POST";
    path: string;
    payload?: Record<string, unknown> | undefined;
  };
  status: number;
}

export class ZenviaApiError extends Error {
  readonly code: string;
  readonly responseBody?: string | undefined;
  readonly retryAfterSeconds?: number | undefined;
  readonly retryable: boolean;
  readonly statusCode?: number | undefined;

  constructor(input: {
    code: string;
    message: string;
    responseBody?: string | undefined;
    retryAfterSeconds?: number | undefined;
    retryable: boolean;
    statusCode?: number | undefined;
  }) {
    super(input.message);
    this.name = "ZenviaApiError";
    this.code = input.code;
    this.responseBody = input.responseBody;
    this.retryAfterSeconds = input.retryAfterSeconds;
    this.retryable = input.retryable;
    this.statusCode = input.statusCode;
  }
}

export class ZenviaRateLimitError extends ZenviaApiError {
  constructor(message = "Zenvia API rate limit reached.", responseBody?: string, retryAfterSeconds?: number) {
    super({
      code: "ZENVIA_RATE_LIMIT",
      message,
      responseBody,
      retryAfterSeconds,
      retryable: true,
      statusCode: 429
    });
    this.name = "ZenviaRateLimitError";
  }
}

export class ZenviaTimeoutError extends ZenviaApiError {
  constructor(message = "Zenvia API request timed out.") {
    super({
      code: "ZENVIA_TIMEOUT",
      message,
      retryable: true,
      statusCode: 504
    });
    this.name = "ZenviaTimeoutError";
  }
}

function readObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function removeEmptyProperties(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => {
      if (value === undefined || value === null) {
        return false;
      }

      if (typeof value === "string") {
        return value.trim().length > 0;
      }

      if (Array.isArray(value)) {
        return value.length > 0;
      }

      return true;
    })
  );
}

function readRetryAfterSeconds(response: ZenviaAdapterFetchResponse): number | undefined {
  const raw = response.headers?.get("retry-after") ?? response.headers?.get("Retry-After");
  if (!raw) {
    return undefined;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function buildZenviaApiError(
  status: number,
  responseBody: string,
  input?: {
    retryAfterSeconds?: number | undefined;
  }
): ZenviaApiError {
  if (status === 429) {
    return new ZenviaRateLimitError(undefined, responseBody, input?.retryAfterSeconds);
  }

  if (status === 401 || status === 403) {
    return new ZenviaApiError({
      code: "ZENVIA_AUTH_FAILED",
      message: `Zenvia authentication failed with status ${status}.`,
      responseBody,
      retryable: false,
      statusCode: status
    });
  }

  if (status === 408) {
    return new ZenviaApiError({
      code: "ZENVIA_TIMEOUT",
      message: "Zenvia API request timed out.",
      responseBody,
      retryable: true,
      statusCode: status
    });
  }

  if (status >= 500) {
    return new ZenviaApiError({
      code: "ZENVIA_SERVER_ERROR",
      message: `Zenvia server error with status ${status}.`,
      responseBody,
      retryable: true,
      statusCode: status
    });
  }

  return new ZenviaApiError({
    code: "ZENVIA_REQUEST_FAILED",
    message: `Zenvia API request failed with status ${status}.`,
    responseBody,
    retryable: false,
    statusCode: status >= 400 ? status : 400
  });
}

async function readResponseBody(response: ZenviaAdapterFetchResponse): Promise<{
  parsed: unknown;
  text: string;
}> {
  const text = await response.text();
  if (!text) {
    return {
      parsed: null,
      text
    };
  }

  try {
    return {
      parsed: JSON.parse(text) as unknown,
      text
    };
  } catch {
    return {
      parsed: text,
      text
    };
  }
}

function parseMessageId(body: unknown): string | null {
  const parsed = readObject(body);
  return readString(parsed?.id);
}

function parseExternalId(body: unknown): string | null {
  const parsed = readObject(body);
  return readString(parsed?.externalId);
}

export class ZenviaMessageAdapter {
  private readonly baseUrl: string;
  private readonly fetchImpl: ZenviaAdapterFetch;
  private readonly timeoutMs: number;

  constructor(private readonly options: ZenviaMessageAdapterOptions) {
    this.baseUrl = options.baseUrl ?? "https://api.zenvia.com/v2";
    this.fetchImpl = options.fetchImpl ?? (fetch as unknown as ZenviaAdapterFetch);
    this.timeoutMs = options.timeoutMs ?? 10_000;
  }

  private async request(input: {
    method: "GET" | "POST";
    path: string;
    payload?: Record<string, unknown> | undefined;
  }): Promise<ZenviaMessageAdapterResponse> {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(`${this.baseUrl}${input.path}`, {
        ...(input.method === "GET" ? {} : { body: JSON.stringify(input.payload ?? {}) }),
        headers: {
          "content-type": "application/json; charset=utf-8",
          "user-agent": "birthub-integrations/1.0",
          "X-API-TOKEN": this.options.apiToken
        },
        method: input.method,
        signal: abortController.signal
      });
      const body = await readResponseBody(response);
      const retryAfterSeconds = readRetryAfterSeconds(response);

      if (response.status === 429) {
        throw new ZenviaRateLimitError(undefined, body.text, retryAfterSeconds);
      }

      if (!response.ok) {
        throw buildZenviaApiError(response.status, body.text, {
          retryAfterSeconds
        });
      }

      return {
        body: body.parsed,
        bodyText: body.text,
        externalId: parseExternalId(body.parsed),
        messageId: parseMessageId(body.parsed),
        request: input,
        status: response.status
      };
    } catch (error) {
      if (error instanceof ZenviaApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new ZenviaTimeoutError();
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async validateApiToken(): Promise<ZenviaMessageAdapterResponse> {
    return this.request({
      method: "GET",
      path: "/subscriptions"
    });
  }

  async sendMessage(input: ZenviaMessageSendInput): Promise<ZenviaMessageAdapterResponse> {
    const channel = readString(input.channel);
    if (!channel) {
      throw new Error("ZENVIA_MESSAGE_CHANNEL_REQUIRED");
    }

    const from = readString(input.from);
    if (!from) {
      throw new Error("ZENVIA_MESSAGE_FROM_REQUIRED");
    }

    const to = readString(input.to);
    if (!to) {
      throw new Error("ZENVIA_MESSAGE_TO_REQUIRED");
    }

    const text = readString(input.text);
    if (!text) {
      throw new Error("ZENVIA_MESSAGE_TEXT_REQUIRED");
    }

    return this.request({
      method: "POST",
      path: `/channels/${encodeURIComponent(channel)}/messages`,
      payload: removeEmptyProperties({
        ...(readString(input.externalId) ? { externalId: readString(input.externalId) } : {}),
        contents: [
          {
            text,
            type: "text"
          }
        ],
        from,
        to
      })
    });
  }
}
