export interface SlackAdapterHeaders {
  get(name: string): string | null;
}

export interface SlackAdapterFetchResponse {
  headers?: SlackAdapterHeaders | undefined;
  json(): Promise<unknown>;
  ok: boolean;
  status: number;
  text(): Promise<string>;
}

export type SlackAdapterFetch = (
  input: string,
  init: {
    body?: string;
    headers: Record<string, string>;
    method: "GET" | "POST";
    signal?: AbortSignal;
  }
) => Promise<SlackAdapterFetchResponse>;

export interface SlackMessageAdapterOptions {
  accessToken: string;
  baseUrl?: string;
  fetchImpl?: SlackAdapterFetch;
  timeoutMs?: number;
}

export interface SlackMessageSendInput {
  blocks?: unknown[] | undefined;
  channel?: string | undefined;
  mrkdwn?: boolean | undefined;
  text: string;
  threadTs?: string | undefined;
  unfurlLinks?: boolean | undefined;
  unfurlMedia?: boolean | undefined;
  userId?: string | undefined;
}

export interface SlackMessageAdapterResponse {
  body: unknown;
  bodyText: string;
  channelId: string | null;
  messageTs: string | null;
  request: {
    method: "GET" | "POST";
    path: string;
    payload?: Record<string, unknown> | undefined;
  };
  status: number;
}

export class SlackApiError extends Error {
  readonly code: string;
  readonly responseBody?: string | undefined;
  readonly retryAfterSeconds?: number | undefined;
  readonly retryable: boolean;
  readonly slackError?: string | undefined;
  readonly statusCode?: number | undefined;

  constructor(input: {
    code: string;
    message: string;
    responseBody?: string | undefined;
    retryAfterSeconds?: number | undefined;
    retryable: boolean;
    slackError?: string | undefined;
    statusCode?: number | undefined;
  }) {
    super(input.message);
    this.name = "SlackApiError";
    this.code = input.code;
    this.responseBody = input.responseBody;
    this.retryAfterSeconds = input.retryAfterSeconds;
    this.retryable = input.retryable;
    this.slackError = input.slackError;
    this.statusCode = input.statusCode;
  }
}

export class SlackRateLimitError extends SlackApiError {
  constructor(message = "Slack API rate limit reached.", responseBody?: string, retryAfterSeconds?: number) {
    super({
      code: "SLACK_RATE_LIMIT",
      message,
      responseBody,
      retryAfterSeconds,
      retryable: true,
      slackError: "ratelimited",
      statusCode: 429
    });
    this.name = "SlackRateLimitError";
  }
}

export class SlackTimeoutError extends SlackApiError {
  constructor(message = "Slack API request timed out.") {
    super({
      code: "SLACK_TIMEOUT",
      message,
      retryable: true,
      slackError: "request_timeout",
      statusCode: 504
    });
    this.name = "SlackTimeoutError";
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

function parseMessageChannelId(body: unknown): string | null {
  const parsed = readObject(body);
  return readString(parsed?.channel);
}

function parseMessageTimestamp(body: unknown): string | null {
  const parsed = readObject(body);
  return readString(parsed?.ts);
}

function parseConversationId(body: unknown): string | null {
  const parsed = readObject(body);
  const channel = readObject(parsed?.channel);
  return readString(channel?.id);
}

function readRetryAfterSeconds(response: SlackAdapterFetchResponse): number | undefined {
  const raw = response.headers?.get("retry-after") ?? response.headers?.get("Retry-After");
  if (!raw) {
    return undefined;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function isSlackRetryableErrorCode(code: string | undefined): boolean {
  return !!code && ["fatal_error", "internal_error", "ratelimited", "request_timeout", "service_unavailable"].includes(code);
}

function isSlackAuthErrorCode(code: string | undefined): boolean {
  return !!code && ["access_denied", "account_inactive", "invalid_auth", "not_authed", "token_expired", "token_revoked"].includes(code);
}

function buildSlackApiError(
  status: number,
  responseBody: string,
  input?: {
    retryAfterSeconds?: number | undefined;
    slackError?: string | undefined;
  }
): SlackApiError {
  if (status === 429 || input?.slackError === "ratelimited") {
    return new SlackRateLimitError(undefined, responseBody, input?.retryAfterSeconds);
  }

  if (isSlackAuthErrorCode(input?.slackError) || status === 401 || status === 403) {
    return new SlackApiError({
      code: "SLACK_AUTH_FAILED",
      message: `Slack authentication failed${input?.slackError ? ` (${input.slackError})` : ` with status ${status}`}.`,
      responseBody,
      retryable: false,
      slackError: input?.slackError,
      statusCode: status >= 400 ? status : 401
    });
  }

  if (status === 408 || input?.slackError === "request_timeout") {
    return new SlackApiError({
      code: "SLACK_TIMEOUT",
      message: `Slack request timed out${input?.slackError ? ` (${input.slackError})` : ` with status ${status}`}.`,
      responseBody,
      retryable: true,
      slackError: input?.slackError,
      statusCode: status >= 400 ? status : 408
    });
  }

  if (status >= 500 || isSlackRetryableErrorCode(input?.slackError)) {
    return new SlackApiError({
      code: "SLACK_SERVER_ERROR",
      message: `Slack server error${input?.slackError ? ` (${input.slackError})` : ` with status ${status}`}.`,
      responseBody,
      retryable: true,
      slackError: input?.slackError,
      statusCode: status >= 500 ? status : 503
    });
  }

  return new SlackApiError({
    code: "SLACK_REQUEST_FAILED",
    message: `Slack API request failed${input?.slackError ? ` (${input.slackError})` : ` with status ${status}`}.`,
    responseBody,
    retryable: false,
    slackError: input?.slackError,
    statusCode: status >= 400 ? status : 400
  });
}

async function readResponseBody(response: SlackAdapterFetchResponse): Promise<{
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

export class SlackMessageAdapter {
  private readonly baseUrl: string;
  private readonly fetchImpl: SlackAdapterFetch;
  private readonly timeoutMs: number;

  constructor(private readonly options: SlackMessageAdapterOptions) {
    this.baseUrl = options.baseUrl ?? "https://slack.com/api";
    this.fetchImpl = options.fetchImpl ?? (fetch as unknown as SlackAdapterFetch);
    this.timeoutMs = options.timeoutMs ?? 10_000;
  }

  private async request(input: {
    method: "GET" | "POST";
    path: string;
    payload?: Record<string, unknown> | undefined;
  }): Promise<SlackMessageAdapterResponse> {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(`${this.baseUrl}${input.path}`, {
        ...(input.method === "GET" ? {} : { body: JSON.stringify(input.payload ?? {}) }),
        headers: {
          authorization: `Bearer ${this.options.accessToken}`,
          "content-type": "application/json; charset=utf-8",
          "user-agent": "birthub-integrations/1.0"
        },
        method: input.method,
        signal: abortController.signal
      });
      const body = await readResponseBody(response);
      const parsedBody = readObject(body.parsed);
      const slackError = readString(parsedBody?.error) ?? undefined;
      const retryAfterSeconds = readRetryAfterSeconds(response);

      if (response.status === 429) {
        throw new SlackRateLimitError(undefined, body.text, retryAfterSeconds);
      }

      if (!response.ok) {
        throw buildSlackApiError(response.status, body.text, {
          retryAfterSeconds,
          slackError
        });
      }

      if (parsedBody && parsedBody.ok === false) {
        throw buildSlackApiError(response.status, body.text, {
          retryAfterSeconds,
          slackError
        });
      }

      return {
        body: body.parsed,
        bodyText: body.text,
        channelId: parseMessageChannelId(body.parsed) ?? parseConversationId(body.parsed),
        messageTs: parseMessageTimestamp(body.parsed),
        request: input,
        status: response.status
      };
    } catch (error) {
      if (error instanceof SlackApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new SlackTimeoutError();
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async resolveDestinationChannelId(input: SlackMessageSendInput): Promise<string> {
    const channel = readString(input.channel);
    if (channel) {
      return channel;
    }

    const userId = readString(input.userId);
    if (!userId) {
      throw new Error("SLACK_MESSAGE_DESTINATION_REQUIRED");
    }

    const response = await this.request({
      method: "POST",
      path: "/conversations.open",
      payload: {
        users: userId
      }
    });
    const channelId = parseConversationId(response.body);
    if (!channelId) {
      throw new Error("SLACK_CONVERSATION_CHANNEL_ID_MISSING");
    }

    return channelId;
  }

  async validateAccessToken(): Promise<SlackMessageAdapterResponse> {
    return this.request({
      method: "POST",
      path: "/auth.test"
    });
  }

  async sendMessage(input: SlackMessageSendInput): Promise<SlackMessageAdapterResponse> {
    const text = input.text.trim();
    if (!text) {
      throw new Error("SLACK_MESSAGE_TEXT_REQUIRED");
    }

    const channelId = await this.resolveDestinationChannelId(input);

    return this.request({
      method: "POST",
      path: "/chat.postMessage",
      payload: removeEmptyProperties({
        ...(Array.isArray(input.blocks) ? { blocks: input.blocks } : {}),
        channel: channelId,
        ...(typeof input.mrkdwn === "boolean" ? { mrkdwn: input.mrkdwn } : {}),
        text,
        ...(readString(input.threadTs) ? { thread_ts: readString(input.threadTs) } : {}),
        ...(typeof input.unfurlLinks === "boolean" ? { unfurl_links: input.unfurlLinks } : {}),
        ...(typeof input.unfurlMedia === "boolean" ? { unfurl_media: input.unfurlMedia } : {})
      })
    });
  }
}
