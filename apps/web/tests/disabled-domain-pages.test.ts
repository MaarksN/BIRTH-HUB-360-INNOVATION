import assert from "node:assert/strict";
import test from "node:test";

import AppointmentsPage from "../app/(dashboard)/appointments/page";
import PatientsPage from "../app/(dashboard)/patients/page";

function isDashboardRedirect(error: unknown): boolean {
  const digest = typeof error === "object" && error !== null && "digest" in error
    ? String((error as { digest?: unknown }).digest)
    : "";

  return digest.includes("NEXT_REDIRECT") && digest.includes("/dashboard");
}

void test("legacy non-commercial dashboard pages redirect to the revenue dashboard", async () => {
  await assert.rejects(() => PatientsPage(), isDashboardRedirect);
  await assert.rejects(() => AppointmentsPage(), isDashboardRedirect);
});
