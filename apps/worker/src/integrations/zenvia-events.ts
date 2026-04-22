import type { ZenviaMessageSendInput } from "@birthub/integrations/zenvia-message-adapter";

export interface ZenviaMessagePayload extends ZenviaMessageSendInput {}

function readObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function readNestedString(input: Record<string, unknown>, key: string): string | undefined {
  const direct = readString(input[key]);
  if (direct) {
    return direct;
  }

  const properties = readObject(input.properties);
  return properties ? readString(properties[key]) : undefined;
}

export function extractZenviaMessagePayload(payload: Record<string, unknown>): ZenviaMessagePayload {
  const messagePayload = readObject(payload.message) ?? payload;
  const channel =
    readNestedString(messagePayload, "channel") ??
    readNestedString(messagePayload, "channelType");
  const from = readNestedString(messagePayload, "from");
  const to = readNestedString(messagePayload, "to");
  const text = readNestedString(messagePayload, "text");

  if (!channel) {
    throw new Error("ZENVIA_MESSAGE_CHANNEL_REQUIRED");
  }

  if (!from) {
    throw new Error("ZENVIA_MESSAGE_FROM_REQUIRED");
  }

  if (!to) {
    throw new Error("ZENVIA_MESSAGE_TO_REQUIRED");
  }

  if (!text) {
    throw new Error("ZENVIA_MESSAGE_TEXT_REQUIRED");
  }

  return {
    channel,
    from,
    text,
    to
  };
}
