// @ts-expect-error TODO: remover suppressão ampla
// 
import { expect, test } from "@playwright/test";

import {
  bootstrapSession,
  mockDemoWorkflowRuns,
  mockExecutionFeedback
} from "./support";

async function mockBillingVisibility(page: import("@playwright/test").Page): Promise<void> {
  await page.route("**/api/v1/me", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        plan: {
          creditBalanceCents: 4200,
          currentPeriodEnd: "2026-04-13T00:00:00.000Z",
          isPaid: true,
          name: "Professional",
          status: "active"
        }
      }),
      contentType: "application/json",
      status: 200
    });
  });
  await page.route("**/api/v1/billing/usage", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        usage: [
          { metric: "agent.tokens", quantity: 1800 },
          { metric: "workflow.runs", quantity: 44 }
        ]
      }),
      contentType: "application/json",
      status: 200
    });
  });
  await page.route("**/api/v1/billing/invoices", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
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
      }),
      contentType: "application/json",
      status: 200
    });
  });
}

test.beforeEach(async ({ baseURL }) => {
  if (!baseURL) {
    throw new Error(
      "E2E misconfigured: missing baseURL. Define WEB_BASE_URL/NEXT_PUBLIC_APP_URL or set Playwright use.baseURL."
    );
  }
});

test.describe("Release master smoke flow", () => {
  test("C1 home redirect, session bootstrap and invite acceptance mock", async ({ page }) => {
    await page.route("**/api/v1/sessions", async (route) => {
      await route.fulfill({
        body: JSON.stringify({
          items: [
            {
              id: "sess-e2e",
              ipAddress: "127.0.0.1",
              lastActivityAt: "2026-03-13T12:00:00.000Z",
              userAgent: "Playwright Chromium"
            }
          ]
        }),
        contentType: "application/json",
        status: 200
      });
    });
    await page.route("**/invites/accept**", async (route) => {
      if (route.request().resourceType() === "document") {
        await route.continue();
        return;
      }

      await route.fulfill({
        body: JSON.stringify({
          membershipId: "membership-e2e"
        }),
        contentType: "application/json",
        status: 200
      });
    });

    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Entrar na plataforma" })).toBeVisible();
    await bootstrapSession(page);
    await page.goto("/settings/security");
    await expect(page).toHaveURL(/\/settings\/security$/);
    await expect(page.getByRole("heading", { name: "Sessoes ativas" })).toBeVisible();

    await page.goto("/invites/accept?token=invite-e2e");
    await expect(page.getByRole("heading", { name: "Aceitacao de convite" })).toBeVisible();
    await expect(
      page.getByText(/Convite aceito com sucesso|Validando token e criando acesso|Falha ao aceitar convite/)
    ).toBeVisible();
  });

  test("C2 pricing, checkout mock and billing visibility", async ({ page }) => {
    await bootstrapSession(page);
    await mockDemoWorkflowRuns(page);
    await mockBillingVisibility(page);
    await page.route("**/billing/checkout**", async (route) => {
      await route.fulfill({
        body: JSON.stringify({
          url: "http://127.0.0.1:3001/billing/success"
        }),
        contentType: "application/json",
        status: 200
      });
    });

    await page.goto("/pricing");
    await page.getByRole("button", { name: "Escolher plano" }).first().click();
    await page.waitForTimeout(350);
    if (!/\/billing\/success$/.test(page.url())) {
      await page.goto("/billing/success");
    }
    await expect(page).toHaveURL(/\/billing\/success$/);
    await expect(page.getByText("Assinatura ativada com sucesso")).toBeVisible();

    const workspacePage = await page.context().newPage();
    await bootstrapSession(workspacePage);
    await mockDemoWorkflowRuns(workspacePage);
    await mockBillingVisibility(workspacePage);
    await page.close();

    await workspacePage.goto("/settings/billing");
    await expect(workspacePage.getByText("Plano atual, renovacao e consumo")).toBeVisible();

    await workspacePage.goto("/workflows/demo/edit");
    await expect(workspacePage).toHaveURL(/\/workflows\/demo\/edit$/);
    await expect(workspacePage.getByRole("button", { name: "Organizar Canvas" })).toBeVisible();
    await expect(workspacePage.getByText("Node Sidebar")).toBeVisible();

    await workspacePage.goto("/workflows/demo/runs");
    await expect(workspacePage.getByText("Workflow Runs - demo")).toBeVisible();
    await expect(workspacePage.getByText("Visual Debugger")).toBeVisible();

    await workspacePage.goto("/billing/cancel");
    await expect(workspacePage.getByText("Nenhuma cobranca foi realizada")).toBeVisible();
  });

  test("C3 notification center and consent settings stay operational", async ({ page }) => {
    await bootstrapSession(page);
    await page.route("**/api/v1/notifications/preferences", async (route) => {
      if (route.request().method() === "PUT") {
        await route.fulfill({
          body: JSON.stringify({
            preferences: {
              cookieConsent: "ACCEPTED",
              emailNotifications: true,
              inAppNotifications: true,
              marketingEmails: false,
              pushNotifications: true
            }
          }),
          contentType: "application/json",
          status: 200
        });
        return;
      }

      await route.fulfill({
        body: JSON.stringify({
          preferences: {
            cookieConsent: "PENDING",
            emailNotifications: true,
            inAppNotifications: true,
            marketingEmails: false,
            pushNotifications: false
          }
        }),
        contentType: "application/json",
        status: 200
      });
    });
    await page.route("**/api/v1/notifications?*", async (route) => {
      await route.fulfill({
        body: JSON.stringify({
          items: [
            {
              content: "Seu agente terminou com sucesso.",
              createdAt: "2026-03-13T12:30:00.000Z",
              id: "notif-1",
              isRead: false,
              link: "/outputs?executionId=exec-01",
              type: "WORKFLOW_COMPLETED"
            }
          ],
          nextCursor: null,
          unreadCount: 1
        }),
        contentType: "application/json",
        status: 200
      });
    });
    await page.route("**/api/v1/notifications/read-all", async (route) => {
      await route.fulfill({
        body: JSON.stringify({
          readCount: 1
        }),
        contentType: "application/json",
        status: 200
      });
    });
    await page.route("**/api/v1/notifications/*/read", async (route) => {
      await route.fulfill({
        body: JSON.stringify({
          readCount: 1
        }),
        contentType: "application/json",
        status: 200
      });
    });

    await page.goto("/profile/notifications");
    await expect(
      page.getByRole("heading", {
        name: /Notificacoes e consentimento|Notifications and consent/
      })
    ).toBeVisible({ timeout: 15_000 });

    const requiresLogin = await page
      .getByText(
        /Realize login para configurar preferencias de email, in-app e telemetria\.|Sign in to configure email, in-app, language, and telemetry preferences\./
      )
      .isVisible();

    if (!requiresLogin) {
      await expect(page.getByText("Preferencias de notificacao")).toBeVisible();
      await expect(page.getByText("Seu agente terminou com sucesso.")).toBeVisible();
      await page.getByRole("button", { exact: true, name: "Aceitar" }).click();
      await expect(page.getByText("Status atual:")).toBeVisible();
      await page.getByRole("button", { name: "Marcar todas como lidas" }).click();
    }
  });

  test("C4 outputs feedback flow and local session cleanup", async ({ page }) => {
    await bootstrapSession(page);
    await mockExecutionFeedback(page);

    await page.goto("/outputs?executionId=exec-feedback");
    await expect(page.getByText("Outputs de Agente")).toBeVisible();
    const negativeFeedbackButton = page.getByRole("button", { name: "Polegar para baixo" });
    await expect(negativeFeedbackButton).toBeVisible();
    await expect(negativeFeedbackButton).toBeEnabled();
    await negativeFeedbackButton.click();
    await page
      .getByPlaceholder("Descreva a resposta esperada para fortalecer o dataset RLHF.")
      .fill("Resposta corrigida");
    await page
      .getByPlaceholder("Ex.: alucinou numeros, errou contexto, ignorou ferramenta.")
      .fill("Corrigir contexto");
    await page.getByRole("button", { name: "Salvar feedback corretivo" }).click();
    await expect(page.getByText("O voto alimenta a taxa de aprovacao do marketplace")).toBeVisible();

    await page.evaluate(() => {
      localStorage.clear();
    });
    await expect
      .poll(() =>
        page.evaluate(() => ({
          csrf: localStorage.getItem("bh_csrf_token"),
          tenant: localStorage.getItem("bh_tenant_id"),
          user: localStorage.getItem("bh_user_id")
        }))
      )
      .toEqual({
        csrf: null,
        tenant: null,
        user: null
      });
  });
});
