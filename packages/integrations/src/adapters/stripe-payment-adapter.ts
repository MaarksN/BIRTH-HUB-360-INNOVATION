export interface StripeAdapterFetchHeaders {
  get(name: string): string | null;
}

export interface StripeAdapterFetchResponse {
  headers?: StripeAdapterFetchHeaders | undefined;
  json(): Promise<unknown>;
  ok: boolean;
  status: number;
  text(): Promise<string>;
}

export type StripePaymentAdapterFetch = (
  input: string,
  init: {
    headers: Record<string, string>;
    method: "GET";
    signal?: AbortSignal;
  }
) => Promise<StripeAdapterFetchResponse>;

export interface StripePaymentAdapterOptions {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: StripePaymentAdapterFetch;
  timeoutMs?: number;
}

export interface StripePaymentReadInput {
  objectId: string;
  objectType: "charge" | "payment_intent";
}

export interface StripePaymentAdapterResponse {
  body: unknown;
  bodyText: string;
  objectId: string | null;
  objectType: StripePaymentReadInput["objectType"];
  paymentStatus: string | null;
  request: {
    method: "GET";
    path: string;
  };
  status: number;
}

export class StripeApiError extends Error {
  readonly code: string;
  readonly responseBody?: string | undefined;
  readonly retryable: boolean;
  readonly statusCode?: number | undefined;

  constructor(input: {
    code: string;
    message: string;
    responseBody?: string | undefined;
    retryable: boolean;
    statusCode?: number | undefined;
  }) {
    super(input.message);
    this.name = "StripeApiError";
    this.code = input.code;
    this.responseBody = input.responseBody;
    this.retryable = input.retryable;
    this.statusCode = input.statusCode;
  }
}

export class StripeRateLimitError extends StripeApiError {
  constructor(message = "Stripe API rate limit reached.", responseBody?: string) {
    super({
      code: "STRIPE_RATE_LIMIT",
      message,
      responseBody,
      retryable: true,
      statusCode: 429
    });
    this.name = "StripeRateLimitError";
  }
}

export class StripeTimeoutError extends StripeApiError {
  constructor(message = "Stripe API request timed out.") {
    super({
      code: "STRIPE_TIMEOUT",
      message,
      retryable: true,
      statusCode: 504
    });
    this.name = "StripeTimeoutError";
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

function parseObjectId(body: unknown): string | null {
  return readString(readObject(body)?.id);
}

function parsePaymentStatus(body: unknown): string | null {
  return readString(readObject(body)?.status);
}

function parseStripeErrorMessage(body: unknown, status: number): string {
  const errorBody = readObject(readObject(body)?.error);
  return (
    readString(errorBody?.message) ??
    `Stripe API request failed with status ${status}.`
  );
}

function buildStripeApiError(status: number, parsedBody: unknown, responseBody: string): StripeApiError {
  const message = parseStripeErrorMessage(parsedBody, status);

  if (status === 401 || status === 403) {
    return new StripeApiError({
      code: "STRIPE_AUTH_FAILED",
      message,
      responseBody,
      retryable: false,
      statusCode: status
    });
  }

  if (status === 408) {
    return new StripeApiError({
      code: "STRIPE_TIMEOUT",
      message,
      responseBody,
      retryable: true,
      statusCode: status
    });
  }

  if (status >= 500) {
    return new StripeApiError({
      code: "STRIPE_SERVER_ERROR",
      message,
      responseBody,
      retryable: true,
      statusCode: status
    });
  }

  return new StripeApiError({
    code: "STRIPE_REQUEST_FAILED",
    message,
    responseBody,
    retryable: false,
    statusCode: status >= 400 ? status : 400
  });
}

async function readResponseBody(response: StripeAdapterFetchResponse): Promise<{
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

function resolveReadPath(input: StripePaymentReadInput): string {
  const objectId = input.objectId.trim();
  if (!objectId) {
    throw new Error("STRIPE_PAYMENT_ID_REQUIRED");
  }

  switch (input.objectType) {
    case "payment_intent":
      return `/v1/payment_intents/${encodeURIComponent(objectId)}`;
    case "charge":
      return `/v1/charges/${encodeURIComponent(objectId)}`;
    default:
      throw new Error("STRIPE_PAYMENT_OBJECT_TYPE_UNSUPPORTED");
  }
}

export class StripePaymentAdapter {
  private readonly baseUrl: string;
  private readonly fetchImpl: StripePaymentAdapterFetch;
  private readonly timeoutMs: number;

  constructor(private readonly options: StripePaymentAdapterOptions) {
    this.baseUrl = options.baseUrl ?? "https://api.stripe.com";
    this.fetchImpl = options.fetchImpl ?? (fetch as unknown as StripePaymentAdapterFetch);
    this.timeoutMs = options.timeoutMs ?? 10_000;
  }

  private async request(input: {
    objectType: StripePaymentReadInput["objectType"];
    path: string;
  }): Promise<StripePaymentAdapterResponse> {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(`${this.baseUrl}${input.path}`, {
        headers: {
          authorization: `Bearer ${this.options.apiKey}`,
          "content-type": "application/x-www-form-urlencoded",
          "user-agent": "birthub-integrations/1.0"
        },
        method: "GET",
        signal: abortController.signal
      });
      const body = await readResponseBody(response);

      if (response.status === 429) {
        throw new StripeRateLimitError(undefined, body.text);
      }

      if (!response.ok) {
        throw buildStripeApiError(response.status, body.parsed, body.text);
      }

      return {
        body: body.parsed,
        bodyText: body.text,
        objectId: parseObjectId(body.parsed),
        objectType: input.objectType,
        paymentStatus: parsePaymentStatus(body.parsed),
        request: {
          method: "GET",
          path: input.path
        },
        status: response.status
      };
    } catch (error) {
      if (error instanceof StripeApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new StripeTimeoutError();
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async validateApiKey(): Promise<StripePaymentAdapterResponse> {
    return this.request({
      objectType: "payment_intent",
      path: "/v1/payment_intents?limit=1"
    });
  }

  async readPayment(input: StripePaymentReadInput): Promise<StripePaymentAdapterResponse> {
    return this.request({
      objectType: input.objectType,
      path: resolveReadPath(input)
    });
  }
}
