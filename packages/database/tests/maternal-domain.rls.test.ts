import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";

import { createPrismaClient } from "../src/client.js";
import {
  ensureDatabaseAvailableOrSkip,
  requireDatabaseUrlOrSkip,
  shouldRequireDeterministicIsolationValidation
} from "./database-availability.js";
import { parsePrismaSchema } from "../scripts/lib/prisma-schema.js";

const databaseUrl = process.env.DATABASE_URL ?? "";
const requireRlsValidation = shouldRequireDeterministicIsolationValidation();
type PatientDelegate = {
  create: (args: {
    data: {
      fullName: string;
      organizationId: string;
      tenantId: string;
    };
  }) => Promise<{ id: string }>;
};

void test("RLS bloqueia leitura cruzada de patients entre tenants no dominio clinico", async (context) => {
  if (
    !requireDatabaseUrlOrSkip(context, databaseUrl, {
      label: "a suite clinica de isolamento RLS",
      required: requireRlsValidation
    })
  ) {
    return;
  }

  const prisma = createPrismaClient({ databaseUrl });

  try {
    const schemaModels = await parsePrismaSchema();
    if (!schemaModels.some((model) => model.name === "Patient")) {
      context.skip("O schema atual nao publica o modelo Patient; teste clinico de RLS ignorado.");
      return;
    }

    const databaseAvailable = await ensureDatabaseAvailableOrSkip(context, prisma, {
      label: "a suite clinica de isolamento RLS",
      required: requireRlsValidation
    });
    if (!databaseAvailable) {
      return;
    }

    if (!Reflect.get(prisma, "patient")) {
      context.skip("O cliente Prisma atual nao expoe o delegate patient; teste clinico de RLS ignorado.");
      return;
    }
    const patientDelegate = Reflect.get(prisma, "patient") as PatientDelegate | undefined;
    if (!patientDelegate) {
      context.skip("O cliente Prisma atual nao expoe o delegate patient; teste clinico de RLS ignorado.");
      return;
    }

    const roleRows = await prisma.$queryRaw<Array<{ bypass: boolean }>>`
      SELECT (r.rolsuper OR r.rolbypassrls) AS "bypass"
      FROM pg_roles r
      WHERE r.rolname = current_user
    `;

    if ((roleRows[0]?.bypass ?? false) === true) {
      if (requireRlsValidation) {
        throw new Error("A role atual ignora RLS e nao permite validar isolamento clinico por tenant.");
      }
      context.skip("A role atual ignora RLS e nao permite validar isolamento clinico por tenant.");
      return;
    }

    const tenantIdA = randomUUID();
    const tenantIdB = randomUUID();

    const organizationA = await prisma.organization.create({
      data: {
        id: tenantIdA,
        name: "Tenant Materno A",
        slug: `materno-a-${Date.now()}`,
        tenantId: tenantIdA
      }
    });

    const organizationB = await prisma.organization.create({
      data: {
        id: tenantIdB,
        name: "Tenant Materno B",
        slug: `materno-b-${Date.now()}`,
        tenantId: tenantIdB
      }
    });

    const patientB = await patientDelegate.create({
      data: {
        fullName: "Paciente Tenant B",
        organizationId: organizationB.id,
        tenantId: organizationB.tenantId
      }
    });

    const rows = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT set_config('app.current_tenant_id', ${organizationA.tenantId}, true)`;
      return tx.$queryRaw<Array<{ id: string }>>`SELECT id FROM patients WHERE id = ${patientB.id}`;
    });

    assert.equal(rows.length, 0, "O RLS deveria bloquear a visibilidade do patient do outro tenant.");
  } finally {
    await prisma.$disconnect();
  }
});
