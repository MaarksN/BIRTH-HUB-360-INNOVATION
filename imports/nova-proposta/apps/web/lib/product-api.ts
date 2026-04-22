import { fetchWithSession } from "./auth-client";

const PRODUCT_MUTATION_TIMEOUT_MS = 8_000;

function ensureOk(response: Response, fallback: string): Response {
  if (!response.ok) {
    throw new Error(`${fallback} (${response.status})`);
  }

  return response;
}

function appendQuery(pathname: string, query: URLSearchParams): string {
  const serialized = query.toString();
  return serialized ? `${pathname}?${serialized}` : pathname;
}

export async function fetchSearchResults(query: string) {
  const response = await fetchWithSession(`/api/v1/search?q=${encodeURIComponent(query)}`, {
    cache: "no-store",
    timeoutMessage: `Falha ao buscar resultados dentro de ${PRODUCT_MUTATION_TIMEOUT_MS}ms.`,
    timeoutMs: PRODUCT_MUTATION_TIMEOUT_MS
  });

  ensureOk(response, "Falha ao buscar resultados");
  return (await response.json()) as {
    groups: Array<{
      id: string;
      items: Array<{
        href: string;
        id: string;
        subtitle: string;
        title: string;
        type: string;
      }>;
      label: string;
    }>;
  };
}

export async function updateOnboardingState(enabled: boolean) {
  const response = await fetchWithSession("/api/v1/dashboard/onboarding", {
    body: JSON.stringify({
      enabled
    }),
    headers: {
      "content-type": "application/json"
    },
    method: "PATCH",
    timeoutMessage: `Falha ao salvar onboarding dentro de ${PRODUCT_MUTATION_TIMEOUT_MS}ms.`,
    timeoutMs: PRODUCT_MUTATION_TIMEOUT_MS
  });

  ensureOk(response, "Falha ao salvar onboarding");
  return (await response.json()) as {
    enabled: boolean;
  };
}

export async function runWorkflow(workflowId: string) {
  const response = await fetchWithSession(`/api/v1/workflows/${encodeURIComponent(workflowId)}/run`, {
    body: JSON.stringify({
      async: true,
      payload: {}
    }),
    headers: {
      "content-type": "application/json"
    },
    method: "POST",
    timeoutMessage: `Falha ao disparar workflow dentro de ${PRODUCT_MUTATION_TIMEOUT_MS}ms.`,
    timeoutMs: PRODUCT_MUTATION_TIMEOUT_MS
  });

  ensureOk(response, "Falha ao disparar workflow");
  return (await response.json()) as {
    executionId: string;
  };
}

export async function createStarterWorkflow() {
  const response = await fetchWithSession("/api/v1/workflows", {
    body: JSON.stringify({
      canvas: {
        steps: [
          {
            config: {
              method: "POST",
              path: "/webhooks/trigger/default"
            },
            isTrigger: true,
            key: "trigger_1",
            name: "Webhook Trigger",
            type: "TRIGGER_WEBHOOK"
          }
        ],
        transitions: []
      },
      description: "Workflow inicial criado a partir da central do produto.",
      name: `Workflow Inicial ${new Date().toLocaleDateString("pt-BR")}`,
      status: "DRAFT",
      triggerConfig: {},
      triggerType: "WEBHOOK"
    }),
    headers: {
      "content-type": "application/json"
    },
    method: "POST",
    timeoutMessage: `Falha ao criar workflow dentro de ${PRODUCT_MUTATION_TIMEOUT_MS}ms.`,
    timeoutMs: PRODUCT_MUTATION_TIMEOUT_MS
  });

  ensureOk(response, "Falha ao criar workflow");
  return (await response.json()) as {
    workflow: {
      id: string;
    };
  };
}

export async function fetchConversationList(params: {
  channel?: string;
  q?: string;
  status?: string;
}) {
  const query = new URLSearchParams();

  if (params.channel) {
    query.set("channel", params.channel);
  }

  if (params.q) {
    query.set("q", params.q);
  }

  if (params.status) {
    query.set("status", params.status);
  }

  const response = await fetchWithSession(appendQuery("/api/v1/conversations", query), {
    cache: "no-store"
  });

  ensureOk(response, "Falha ao carregar conversas");
  return (await response.json()) as {
    items: Array<{
      channel: string;
      createdAt: string;
      customerReference: string | null;
      id: string;
      lastMessageAt: string | null;
      lastMessagePreview: string | null;
      leadReference: string | null;
      messageCount: number;
      status: string;
      subject: string | null;
      updatedAt: string;
    }>;
  };
}

export async function fetchConversationDetail(conversationId: string) {
  const response = await fetchWithSession(`/api/v1/conversations/${encodeURIComponent(conversationId)}`, {
    cache: "no-store"
  });

  ensureOk(response, "Falha ao carregar conversa");
  return (await response.json()) as {
    conversation: {
      channel: string;
      createdAt: string;
      customerReference: string | null;
      id: string;
      leadReference: string | null;
      messages: Array<{
        agentId: string | null;
        content: string;
        contentPreview: string | null;
        createdAt: string;
        direction: string;
        id: string;
        metadata: Record<string, unknown> | null;
        role: string | null;
      }>;
      metadata: Record<string, unknown> | null;
      status: string;
      subject: string | null;
      updatedAt: string;
    };
  };
}

export async function createConversation(input: {
  initialMessage?: string;
  subject: string;
}) {
  const response = await fetchWithSession("/api/v1/conversations", {
    body: JSON.stringify(input),
    headers: {
      "content-type": "application/json"
    },
    method: "POST"
  });

  ensureOk(response, "Falha ao criar conversa");
  return (await response.json()) as {
    conversation: {
      id: string;
    };
  };
}

export async function appendConversationNote(conversationId: string, content: string) {
  const response = await fetchWithSession(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      body: JSON.stringify({
        content
      }),
      headers: {
        "content-type": "application/json"
      },
      method: "POST"
    }
  );

  ensureOk(response, "Falha ao publicar nota");
  return (await response.json()) as {
    message: {
      id: string;
    };
  };
}

export async function updateConversationStatus(conversationId: string, status: string) {
  const response = await fetchWithSession(
    `/api/v1/conversations/${encodeURIComponent(conversationId)}/status`,
    {
      body: JSON.stringify({
        status
      }),
      headers: {
        "content-type": "application/json"
      },
      method: "PATCH"
    }
  );

  ensureOk(response, "Falha ao atualizar status");
  return (await response.json()) as {
    conversation: {
      id: string;
      status: string;
    };
  };
}
