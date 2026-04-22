import { createServer } from "node:http";

const apiPort = Number.parseInt(process.env.PLAYWRIGHT_API_PORT ?? "3400", 10);
const allowedOrigin = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3001";

const workflowDefinition = {
  steps: [
    {
      config: {},
      id: "step-trigger",
      key: "trigger",
      name: "Trigger",
      type: "TRIGGER"
    },
    {
      config: {},
      id: "step-condition",
      key: "condition",
      name: "Condition",
      type: "CONDITION"
    },
    {
      config: {},
      id: "step-agent",
      key: "agent-engine",
      name: "Agent Engine",
      type: "ACTION"
    }
  ],
  transitions: [
    {
      route: "ALWAYS",
      source: "trigger",
      target: "condition"
    },
    {
      route: "TRUE",
      source: "condition",
      target: "agent-engine"
    }
  ]
};

const workflowExecutions = [
  {
    completedAt: "2026-03-13T12:04:00.000Z",
    durationMs: 4000,
    errorMessage: "Agent timeout",
    id: "run-demo-failed",
    isDryRun: false,
    startedAt: "2026-03-13T12:00:00.000Z",
    status: "FAILED",
    stepResults: [
      {
        errorMessage: null,
        input: {
          leadId: "lead-001",
          source: "referral",
          tenantId: "birthhub-alpha"
        },
        output: {
          created: true
        },
        status: "SUCCESS",
        step: {
          id: "step-trigger",
          key: "trigger",
          name: "Trigger",
          type: "TRIGGER"
        }
      },
      {
        errorMessage: null,
        input: {
          leadScore: 87,
          minScore: 75
        },
        output: {
          result: true
        },
        status: "SUCCESS",
        step: {
          id: "step-condition",
          key: "condition",
          name: "Condition",
          type: "CONDITION"
        }
      },
      {
        errorMessage: "timeout",
        input: {
          campaign: "welcome-sequence"
        },
        output: null,
        status: "FAILED",
        step: {
          id: "step-agent",
          key: "agent-engine",
          name: "Agent Engine",
          type: "ACTION"
        }
      }
    ]
  }
];

const state = {
  budgetLimits: {
    "ceo-pack": 100
  },
  feedbackByExecutionId: {
    "exec-feedback": {
      expectedOutput: "",
      notes: "",
      rating: 0
    }
  },
  notifications: [
    {
      content: "Seu agente terminou com sucesso.",
      createdAt: "2026-03-13T12:30:00.000Z",
      id: "notif-1",
      isRead: false,
      link: "/outputs?executionId=exec-feedback",
      type: "WORKFLOW_COMPLETED"
    }
  ],
  preferences: {
    cookieConsent: "PENDING",
    emailNotifications: true,
    inAppNotifications: true,
    locale: "pt-BR",
    marketingEmails: false,
    pushNotifications: false
  },
  sessions: [
    {
      id: "sess-e2e",
      ipAddress: "127.0.0.1",
      lastActivityAt: "2026-03-13T12:00:00.000Z",
      userAgent: "Playwright Chromium"
    }
  ],
  workflow: {
    definition: workflowDefinition,
    executions: workflowExecutions,
    name: "demo",
    status: "PUBLISHED"
  }
};

function addCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Credentials", "true");
  response.setHeader("Access-Control-Allow-Headers", "content-type, x-active-tenant, x-csrf-token");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  response.setHeader("Vary", "Origin");
}

function sendJson(response, statusCode, payload) {
  addCorsHeaders(response);
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, payload, contentType = "text/plain; charset=utf-8") {
  addCorsHeaders(response);
  response.statusCode = statusCode;
  response.setHeader("Content-Type", contentType);
  response.end(payload);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk.toString("utf8");
    });
    request.on("end", () => {
      resolve(body);
    });
    request.on("error", reject);
  });
}

function decodePathname(url) {
  return decodeURIComponent(url.pathname);
}

function buildMePayload() {
  return {
    plan: {
      creditBalanceCents: 4200,
      currentPeriodEnd: "2026-04-13T00:00:00.000Z",
      hardLocked: false,
      isPaid: true,
      isWithinGracePeriod: false,
      name: "Professional",
      secondsUntilHardLock: null,
      status: "active"
    },
    requestId: "req-playwright-smoke",
    user: {
      id: "owner.alpha@birthub.local",
      organizationId: "org-birthhub-alpha",
      role: "OWNER",
      tenantId: "birthhub-alpha"
    }
  };
}

function buildWorkflowPayload() {
  return {
    workflow: {
      definition: state.workflow.definition,
      executions: state.workflow.executions,
      name: state.workflow.name,
      status: state.workflow.status
    }
  };
}

function findOutput(outputId) {
  return {
    agentId: "agent-engine",
    approvedAt: null,
    approvedByUserId: null,
    content: "Resumo executivo gerado para o fluxo de release.",
    createdAt: "2026-03-13T12:05:00.000Z",
    id: outputId,
    outputHash: "1234567890abcdef1234567890abcdef",
    status: "PENDING_REVIEW",
    type: "executive-report"
  };
}

const server = createServer(async (request, response) => {
  addCorsHeaders(response);

  if (!request.url) {
    sendJson(response, 400, { error: "Missing request URL." });
    return;
  }

  const url = new URL(request.url, `http://127.0.0.1:${apiPort}`);
  const pathname = decodePathname(url);

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (pathname === "/api/v1/me" && request.method === "GET") {
    sendJson(response, 200, buildMePayload());
    return;
  }

  if (pathname === "/api/v1/sessions" && request.method === "GET") {
    sendJson(response, 200, { items: state.sessions });
    return;
  }

  if (pathname.startsWith("/api/v1/sessions/") && request.method === "DELETE") {
    const sessionId = pathname.split("/").pop();
    state.sessions = state.sessions.filter((session) => session.id !== sessionId);
    sendJson(response, 200, { revoked: Boolean(sessionId) });
    return;
  }

  if (pathname === "/api/v1/sessions/logout-all" && request.method === "POST") {
    const revokedCount = state.sessions.length;
    state.sessions = [];
    sendJson(response, 200, { revokedCount });
    return;
  }

  if (pathname === "/api/v1/billing/usage" && request.method === "GET") {
    sendJson(response, 200, {
      usage: [
        { metric: "agent.tokens", quantity: 1800 },
        { metric: "workflow.runs", quantity: 44 }
      ]
    });
    return;
  }

  if (pathname === "/api/v1/billing/invoices" && request.method === "GET") {
    sendJson(response, 200, {
      items: [
        {
          amountPaidCents: 14900,
          createdAt: "2026-03-13T00:00:00.000Z",
          currency: "usd",
          id: "inv_01",
          invoicePdfUrl: "https://example.com/invoice.pdf",
          status: "paid"
        }
      ]
    });
    return;
  }

  if (pathname === "/api/v1/budgets/usage" && request.method === "GET") {
    sendJson(response, 200, {
      alerts: [
        {
          level: "INFO",
          message: "Consumo dentro da meta mensal.",
          timestamp: "2026-03-13T12:00:00.000Z"
        }
      ],
      records: [
        {
          agentId: "ceo-pack",
          consumed: 28,
          limit: state.budgetLimits["ceo-pack"] ?? 100
        }
      ],
      usageEvents: [
        {
          agentId: "ceo-pack",
          costBRL: 18.4,
          executionMode: "sync",
          timestamp: "2026-03-13T11:45:00.000Z"
        }
      ]
    });
    return;
  }

  if (pathname === "/api/v1/budgets/estimate" && request.method === "GET") {
    const agentId = url.searchParams.get("agentId") ?? "ceo-pack";
    sendJson(response, 200, {
      estimate: {
        avgCostBRL: agentId === "ceo-pack" ? 18.4 : 12.1,
        details: `Estimativa sintetica para ${agentId}.`
      }
    });
    return;
  }

  if (pathname === "/api/v1/budgets/limits" && request.method === "POST") {
    const rawBody = await readBody(request);
    const payload = rawBody ? JSON.parse(rawBody) : {};
    if (payload.agentId) {
      state.budgetLimits[payload.agentId] = Number(payload.limit) || 0;
    }
    sendJson(response, 200, { ok: true });
    return;
  }

  if (pathname === "/api/v1/budgets/export.csv" && request.method === "GET") {
    sendText(response, 200, "agentId,consumed,limit\nceo-pack,28,100\n", "text/csv; charset=utf-8");
    return;
  }

  if (pathname === "/api/v1/notifications/preferences" && request.method === "GET") {
    sendJson(response, 200, { preferences: state.preferences });
    return;
  }

  if (pathname === "/api/v1/notifications/preferences" && request.method === "PUT") {
    const rawBody = await readBody(request);
    const payload = rawBody ? JSON.parse(rawBody) : {};
    state.preferences = {
      ...state.preferences,
      ...payload
    };
    sendJson(response, 200, { preferences: state.preferences });
    return;
  }

  if (pathname === "/api/v1/notifications" && request.method === "GET") {
    const unreadCount = state.notifications.filter((item) => !item.isRead).length;
    sendJson(response, 200, {
      items: state.notifications,
      nextCursor: null,
      unreadCount
    });
    return;
  }

  if (pathname === "/api/v1/notifications/read-all" && request.method === "POST") {
    state.notifications = state.notifications.map((item) => ({
      ...item,
      isRead: true
    }));
    sendJson(response, 200, { readCount: state.notifications.length });
    return;
  }

  if (/^\/api\/v1\/notifications\/[^/]+\/read$/.test(pathname) && request.method === "POST") {
    const notificationId = pathname.split("/")[4];
    state.notifications = state.notifications.map((item) =>
      item.id === notificationId ? { ...item, isRead: true } : item
    );
    sendJson(response, 200, { readCount: 1 });
    return;
  }

  if (pathname === "/api/v1/workflows/demo" && request.method === "GET") {
    sendJson(response, 200, buildWorkflowPayload());
    return;
  }

  if (pathname === "/api/v1/workflows/demo" && request.method === "PUT") {
    const rawBody = await readBody(request);
    const payload = rawBody ? JSON.parse(rawBody) : {};
    state.workflow = {
      ...state.workflow,
      ...(payload.name ? { name: payload.name } : {}),
      ...(payload.status ? { status: payload.status } : {}),
      ...(payload.canvas ? { definition: payload.canvas } : {})
    };
    sendJson(response, 200, buildWorkflowPayload());
    return;
  }

  if (pathname === "/api/v1/workflows/demo/run" && request.method === "POST") {
    sendJson(response, 200, {
      accepted: true,
      executionId: "run-demo-retry",
      runId: "run-demo-retry"
    });
    return;
  }

  if (pathname === "/api/v1/outputs" && request.method === "GET") {
    const executionId = url.searchParams.get("executionId") ?? "exec-feedback";
    sendJson(response, 200, {
      outputs: [
        {
          ...findOutput("output-feedback"),
          executionId
        }
      ]
    });
    return;
  }

  if (/^\/api\/v1\/outputs\/[^/]+$/.test(pathname) && request.method === "GET") {
    const outputId = pathname.split("/").pop() ?? "output-feedback";
    sendJson(response, 200, {
      integrity: {
        expectedHash: "1234567890abcdef1234567890abcdef",
        isValid: true,
        recalculatedHash: "1234567890abcdef1234567890abcdef"
      },
      output: findOutput(outputId)
    });
    return;
  }

  if (/^\/api\/v1\/outputs\/[^/]+\/approve$/.test(pathname) && request.method === "POST") {
    sendJson(response, 200, {
      approvedAt: "2026-03-13T12:06:00.000Z",
      approvedByUserId: "owner.alpha@birthub.local",
      status: "APPROVED"
    });
    return;
  }

  if (/^\/api\/v1\/executions\/[^/]+\/feedback$/.test(pathname) && request.method === "GET") {
    const executionId = pathname.split("/")[4];
    sendJson(response, 200, {
      feedback: state.feedbackByExecutionId[executionId] ?? {
        expectedOutput: "",
        notes: "",
        rating: 0
      }
    });
    return;
  }

  if (/^\/api\/v1\/executions\/[^/]+\/feedback$/.test(pathname) && request.method === "POST") {
    const executionId = pathname.split("/")[4];
    const rawBody = await readBody(request);
    const payload = rawBody ? JSON.parse(rawBody) : {};
    state.feedbackByExecutionId[executionId] = {
      expectedOutput: payload.expectedOutput ?? "",
      notes: payload.notes ?? "",
      rating: payload.rating ?? 0
    };
    sendJson(response, 200, {
      feedback: state.feedbackByExecutionId[executionId]
    });
    return;
  }

  if (pathname === "/api/v1/invites/accept" && request.method === "POST") {
    sendJson(response, 200, { membershipId: "membership-e2e" });
    return;
  }

  sendJson(response, 404, {
    error: `No mock registered for ${request.method} ${pathname}.`
  });
});

server.listen(apiPort, "127.0.0.1", () => {
  process.stdout.write(`Playwright mock API listening on http://127.0.0.1:${apiPort}\n`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => {
      process.exit(0);
    });
  });
}
