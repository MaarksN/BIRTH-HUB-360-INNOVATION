export interface SlackMessagePayload {
  blocks?: unknown[] | undefined;
  channel?: string | undefined;
  mrkdwn?: boolean | undefined;
  text: string;
  threadTs?: string | undefined;
  unfurlLinks?: boolean | undefined;
  unfurlMedia?: boolean | undefined;
  userId?: string | undefined;
}

function readObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function readNestedString(input: Record<string, unknown>, key: string): string | undefined {
  const direct = readString(input[key]);
  if (direct) {
    return direct;
  }

  const properties = readObject(input.properties);
  return properties ? readString(properties[key]) : undefined;
}

export function extractSlackMessagePayload(payload: Record<string, unknown>): SlackMessagePayload {
  const messagePayload = readObject(payload.message) ?? payload;
  const text = readNestedString(messagePayload, "text");
  const channel =
    readNestedString(messagePayload, "channel") ?? readNestedString(messagePayload, "channelId");
  const userId =
    readNestedString(messagePayload, "userId") ?? readNestedString(messagePayload, "user_id");
  const mrkdwn =
    readBoolean(messagePayload.mrkdwn) ?? readBoolean(readObject(messagePayload.options)?.mrkdwn);
  const unfurlLinks =
    readBoolean(messagePayload.unfurlLinks) ?? readBoolean(messagePayload.unfurl_links);
  const unfurlMedia =
    readBoolean(messagePayload.unfurlMedia) ?? readBoolean(messagePayload.unfurl_media);
  const threadTs =
    readNestedString(messagePayload, "threadTs") ?? readNestedString(messagePayload, "thread_ts");

  if (!text) {
    throw new Error("SLACK_MESSAGE_TEXT_REQUIRED");
  }

  if (!channel && !userId) {
    throw new Error("SLACK_MESSAGE_DESTINATION_REQUIRED");
  }

  return {
    ...(Array.isArray(messagePayload.blocks) ? { blocks: messagePayload.blocks } : {}),
    ...(channel ? { channel } : {}),
    ...(typeof mrkdwn === "boolean" ? { mrkdwn } : {}),
    text,
    ...(threadTs ? { threadTs } : {}),
    ...(typeof unfurlLinks === "boolean" ? { unfurlLinks } : {}),
    ...(typeof unfurlMedia === "boolean" ? { unfurlMedia } : {}),
    ...(userId ? { userId } : {})
  };
}
