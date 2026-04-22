import { createHmac, timingSafeEqual } from "node:crypto";

const HUBSPOT_SIGNATURE_TOLERANCE_MS = 5 * 60 * 1000;
const uriDecodingMap = new Map([
  ["%3A", ":"],
  ["%2F", "/"],
  ["%3F", "?"],
  ["%40", "@"],
  ["%21", "!"],
  ["%24", "$"],
  ["%27", "'"],
  ["%28", "("],
  ["%29", ")"],
  ["%2A", "*"],
  ["%2C", ","],
  ["%3B", ";"]
]);

export interface HubspotSignatureV3VerificationInput {
  body: string;
  clientSecret: string;
  method: string;
  nowMs?: number | undefined;
  signature: string | null | undefined;
  timestamp: string | null | undefined;
  toleranceMs?: number | undefined;
  url: string;
}

function normalizeHubspotUri(uri: string): string {
  return uri.replace(/%3A|%2F|%3F|%40|%21|%24|%27|%28|%29|%2A|%2C|%3B/gi, (match) => {
    const decoded = uriDecodingMap.get(match.toUpperCase());
    return decoded ?? match;
  });
}

function safeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function createHubspotSignatureV3(input: {
  body: string;
  clientSecret: string;
  method: string;
  timestamp: string;
  url: string;
}): string {
  const source = `${input.method.toUpperCase()}${normalizeHubspotUri(input.url)}${input.body}${input.timestamp}`;
  return createHmac("sha256", input.clientSecret).update(source).digest("base64");
}

export function verifyHubspotSignatureV3(
  input: HubspotSignatureV3VerificationInput
): boolean {
  if (!input.clientSecret || !input.signature || !input.timestamp) {
    return false;
  }

  const timestampMs = Number(input.timestamp);
  if (!Number.isFinite(timestampMs)) {
    return false;
  }

  const toleranceMs = input.toleranceMs ?? HUBSPOT_SIGNATURE_TOLERANCE_MS;
  if (Math.abs((input.nowMs ?? Date.now()) - timestampMs) > toleranceMs) {
    return false;
  }

  const expected = createHubspotSignatureV3({
    body: input.body,
    clientSecret: input.clientSecret,
    method: input.method,
    timestamp: input.timestamp,
    url: input.url
  });

  return safeCompare(expected, input.signature);
}
