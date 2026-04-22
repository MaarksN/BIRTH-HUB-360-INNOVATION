const SENSITIVE_KEY_PATTERN =
  /authorization|api[-_]?key|cookie|credential|password|secret|session|token/i;

const MAX_STRING_PREVIEW_LENGTH = 8_000;
const MAX_ARRAY_ITEMS = 50;
const MAX_OBJECT_KEYS = 100;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function maskString(value: string): string {
  if (value.length <= MAX_STRING_PREVIEW_LENGTH) {
    return value;
  }

  return `${value.slice(0, MAX_STRING_PREVIEW_LENGTH)}...[truncated]`;
}

function maskSensitiveValue(value: unknown, depth: number): unknown {
  if (depth <= 0) {
    return "[TRUNCATED]";
  }

  if (typeof value === "string") {
    return maskString(value);
  }

  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_ITEMS).map((item) => maskSensitiveValue(item, depth - 1));
  }

  if (!isPlainRecord(value)) {
    return value;
  }

  const output: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value).slice(0, MAX_OBJECT_KEYS)) {
    output[key] = SENSITIVE_KEY_PATTERN.test(key)
      ? "[REDACTED]"
      : maskSensitiveValue(entry, depth - 1);
  }

  return output;
}

export function maskSensitivePayload<T>(value: T): T {
  return maskSensitiveValue(value, 8) as T;
}
