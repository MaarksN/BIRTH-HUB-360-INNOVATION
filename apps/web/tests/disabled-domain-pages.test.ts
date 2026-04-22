import assert from "node:assert/strict";
import test from "node:test";
import React from "react";

import AppointmentsPage from "../app/(dashboard)/appointments/page";
import PatientsPage from "../app/(dashboard)/patients/page";
import { ClinicalWorkspaceDisabledState } from "../components/dashboard/ClinicalWorkspaceDisabledState";

function restoreEnvValue(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

void test("clinical dashboard pages short-circuit to the disabled state while the workspace is off", async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalEnvironment = process.env.NEXT_PUBLIC_ENVIRONMENT;
  const originalClinicalWorkspaceFlag = process.env.NEXT_PUBLIC_ENABLE_CLINICAL_WORKSPACE;
  const originalReact = globalThis.React;

  Object.assign(process.env, {
    NEXT_PUBLIC_ENABLE_CLINICAL_WORKSPACE: "false",
    NEXT_PUBLIC_ENVIRONMENT: "development",
    NODE_ENV: "test"
  });
  Object.defineProperty(globalThis, "React", {
    configurable: true,
    value: React
  });

  try {
    const patientsPage = await PatientsPage();
    const appointmentsPage = await AppointmentsPage();

    assert.equal(patientsPage.type, ClinicalWorkspaceDisabledState);
    assert.equal(appointmentsPage.type, ClinicalWorkspaceDisabledState);
  } finally {
    restoreEnvValue("NODE_ENV", originalNodeEnv);
    restoreEnvValue("NEXT_PUBLIC_ENVIRONMENT", originalEnvironment);
    restoreEnvValue("NEXT_PUBLIC_ENABLE_CLINICAL_WORKSPACE", originalClinicalWorkspaceFlag);
    Object.defineProperty(globalThis, "React", {
      configurable: true,
      value: originalReact
    });
  }
});
