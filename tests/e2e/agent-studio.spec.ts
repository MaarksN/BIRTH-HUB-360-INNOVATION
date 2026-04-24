// @ts-expect-error TODO: remover suppressão ampla
// 
import { expect, test } from "@playwright/test";

import { bootstrapSession } from "./support";

test.describe("Agent Studio critical flow", () => {
  test("agent inventory stays reachable from the canonical dashboard shell", async ({ page }) => {
    await bootstrapSession(page);
    await page.goto("/agents");
    await expect(page.getByText("Agents")).toBeVisible();
    await expect(
      page.getByText("Linha oficial de agentes instalados", { exact: false })
    ).toBeVisible();

    const emptyState = page.getByRole("heading", {
      name: "Nenhum agente oficial instalado"
    });

    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
      return;
    }

    await expect(page.getByRole("link", { name: "Overview" }).first()).toBeVisible();
  });
});
