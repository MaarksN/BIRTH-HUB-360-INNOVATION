import { NextRequest, NextResponse } from "next/server";

import { getWebConfig } from "@birthub/config/web";
import { fetchWithTimeout } from "@birthub/utils/fetch";

import {
  buildChatbookReply,
  isChatbookTool,
  type ChatbookAttachmentContext,
  type ChatbookLivePlatformResult,
  type ChatbookTool
} from "../../../../lib/chatbook";

const webConfig = getWebConfig();
const SEARCH_TIMEOUT_MS = 4_500;

interface SearchPayload {
  groups?: Array<{
    items?: Array<{
      href?: string;
      id?: string;
      subtitle?: string;
      title?: string;
      type?: string;
    }>;
    label?: string;
  }>;
}

function buildSearchHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  const forwardedHeaderNames = ["cookie", "x-active-tenant", "x-csrf-token", "x-request-id"];

  for (const headerName of forwardedHeaderNames) {
    const value = request.headers.get(headerName);

    if (value) {
      headers.set(headerName, value);
    }
  }

  return headers;
}

async function fetchLivePlatformResults(
  request: NextRequest,
  message: string
): Promise<ChatbookLivePlatformResult[]> {
  if (message.trim().length < 3) {
    return [];
  }

  const query = new URLSearchParams({
    q: message.trim()
  });

  try {
    const response = await fetchWithTimeout(
      `${webConfig.NEXT_PUBLIC_API_URL}/api/v1/search?${query.toString()}`,
      {
        cache: "no-store",
        headers: buildSearchHeaders(request),
        timeoutMessage: `ChatBook internal search exceeded the ${SEARCH_TIMEOUT_MS}ms budget.`,
        timeoutMs: SEARCH_TIMEOUT_MS
      }
    );

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as SearchPayload;

    return (payload.groups ?? [])
      .flatMap((group) =>
        (group.items ?? []).map((item) => ({
          href: item.href ?? "",
          id: item.id ?? `${group.label ?? "group"}-${item.title ?? "item"}`,
          module: group.label ?? "Busca interna",
          subtitle: item.subtitle ?? "",
          title: item.title ?? "Resultado interno",
          type: item.type ?? "registro"
        }))
      )
      .filter((item) => item.href.trim().length > 0 || item.subtitle.trim().length > 0)
      .slice(0, 6);
  } catch {
    return [];
  }
}

function parsePreferredTools(value: unknown): ChatbookTool[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isChatbookTool);
}

function parseAttachmentNames(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 6);
}

function parseAttachmentContexts(value: unknown): ChatbookAttachmentContext[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item): ChatbookAttachmentContext | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const name = typeof record.name === "string" ? record.name.trim() : "";
      const text = typeof record.text === "string" ? record.text.trim() : "";

      if (!name || !text) {
        return null;
      }

      return {
        ...(typeof record.contentType === "string" ? { contentType: record.contentType } : {}),
        name,
        ...(typeof record.size === "number" && Number.isFinite(record.size)
          ? { size: record.size }
          : {}),
        text: text.slice(0, 4_000)
      };
    })
    .filter((item): item is ChatbookAttachmentContext => item !== null)
    .slice(0, 4);
}

function parseSimulationInput(value: unknown) {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;

  return {
    ...(typeof record.activeUsers === "number" && Number.isFinite(record.activeUsers)
      ? { activeUsers: record.activeUsers }
      : {}),
    ...(typeof record.annualVolume === "number" && Number.isFinite(record.annualVolume)
      ? { annualVolume: record.annualVolume }
      : {}),
    ...(typeof record.currentMonthlyCost === "number" && Number.isFinite(record.currentMonthlyCost)
      ? { currentMonthlyCost: record.currentMonthlyCost }
      : {}),
    ...(typeof record.currentPlan === "string" && record.currentPlan.trim()
      ? { currentPlan: record.currentPlan.trim() }
      : {}),
    ...(typeof record.onboardingBacklog === "number" && Number.isFinite(record.onboardingBacklog)
      ? { onboardingBacklog: record.onboardingBacklog }
      : {}),
    ...(typeof record.recommendedPlan === "string" && record.recommendedPlan.trim()
      ? { recommendedPlan: record.recommendedPlan.trim() }
      : {})
  };
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const message = typeof payload?.message === "string" ? payload.message.trim() : "";

  if (!message) {
    return NextResponse.json(
      {
        error: "message is required"
      },
      { status: 400 }
    );
  }

  const requestId =
    request.headers.get("x-request-id") ?? `chatbook-${Date.now().toString(36)}`;
  const livePlatformResults = await fetchLivePlatformResults(request, message);
  const reply = buildChatbookReply({
    attachmentContexts: parseAttachmentContexts(payload?.attachmentContexts),
    attachmentNames: parseAttachmentNames(payload?.attachmentNames),
    livePlatformResults,
    message,
    preferredTools: parsePreferredTools(payload?.preferredTools),
    requestId,
    simulationInput: parseSimulationInput(payload?.simulationInput),
    voiceEnabled: payload?.voiceEnabled === true
  });

  return NextResponse.json(
    {
      reply
    },
    {
      headers: {
        "cache-control": "no-store"
      }
    }
  );
}
