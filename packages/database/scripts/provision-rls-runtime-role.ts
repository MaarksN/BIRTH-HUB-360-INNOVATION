// 
import { Prisma } from "@prisma/client";

import { createPrismaClient } from "../src/client.js";

const DEFAULT_ROLE_NAME = "api_worker";
const DEFAULT_SCHEMA_NAME = "public";

type RoleExistsRow = {
  exists: boolean;
};

type RuntimeRoleRow = {
  bypass: boolean;
  canLogin: boolean;
  currentUser: string;
};

function quoteIdentifier(identifier: string): string {
  if (!identifier.trim()) {
    throw new Error("SQL identifier cannot be empty.");
  }

  return `"${identifier.replaceAll('"', '""')}"`;
}

function quoteLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function requireDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to provision the RLS runtime role.");
  }

  return databaseUrl;
}

function resolveAppRoleName(): string {
  return process.env.DB_APP_ROLE?.trim() || DEFAULT_ROLE_NAME;
}

function resolveAppRolePassword(adminDatabaseUrl: string): string {
  const explicitPassword = process.env.DB_APP_PASSWORD?.trim();
  if (explicitPassword) {
    return explicitPassword;
  }

  const parsed = new URL(adminDatabaseUrl);
  if (parsed.password) {
    return parsed.password;
  }

  return "postgres";
}

function describeDatabase(adminDatabaseUrl: string): {
  databaseName: string;
  schemaName: string;
} {
  const parsed = new URL(adminDatabaseUrl);
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  const schemaName = parsed.searchParams.get("schema") || DEFAULT_SCHEMA_NAME;

  if (!databaseName) {
    throw new Error("DATABASE_URL must include the target database name.");
  }

  return {
    databaseName,
    schemaName
  };
}

function buildRuntimeDatabaseUrl(
  adminDatabaseUrl: string,
  roleName: string,
  rolePassword: string
): string {
  const parsed = new URL(adminDatabaseUrl);
  parsed.username = roleName;
  parsed.password = rolePassword;
  return parsed.toString();
}

function redactDatabaseUrl(databaseUrl: string): string {
  const parsed = new URL(databaseUrl);
  if (parsed.password) {
    parsed.username = "REDACTED";
  }
  return parsed.toString().replace(":REDACTED@", ":****@").replace("REDACTED:****@", "****:****@");
}

async function executeStatement(prisma: ReturnType<typeof createPrismaClient>, sql: string) {
  await prisma.$executeRaw(Prisma.raw(sql));
}

async function main(): Promise<void> {
  const adminDatabaseUrl = requireDatabaseUrl();
  const roleName = resolveAppRoleName();
  const rolePassword = resolveAppRolePassword(adminDatabaseUrl);
  const { databaseName, schemaName } = describeDatabase(adminDatabaseUrl);
  const runtimeDatabaseUrl = buildRuntimeDatabaseUrl(adminDatabaseUrl, roleName, rolePassword);
  const adminPrisma = createPrismaClient({ databaseUrl: adminDatabaseUrl });

  try {
    const roleExistsRows = await adminPrisma.$queryRaw<RoleExistsRow[]>`
      SELECT EXISTS (
        SELECT 1
        FROM pg_roles
        WHERE rolname = ${roleName}
      ) AS "exists"
    `;
    const roleExisted = roleExistsRows[0]?.exists ?? false;
    const quotedRole = quoteIdentifier(roleName);
    const quotedDatabase = quoteIdentifier(databaseName);
    const quotedSchema = quoteIdentifier(schemaName);
    const quotedPassword = quoteLiteral(rolePassword);

    const statements = [
      roleExisted
        ? `ALTER ROLE ${quotedRole} WITH LOGIN PASSWORD ${quotedPassword} NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT NOBYPASSRLS`
        : `CREATE ROLE ${quotedRole} LOGIN PASSWORD ${quotedPassword} NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT NOBYPASSRLS`,
      `ALTER ROLE ${quotedRole} SET row_security = on`,
      `GRANT CONNECT ON DATABASE ${quotedDatabase} TO ${quotedRole}`,
      `GRANT USAGE ON SCHEMA ${quotedSchema} TO ${quotedRole}`,
      `GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA ${quotedSchema} TO ${quotedRole}`,
      `GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA ${quotedSchema} TO ${quotedRole}`,
      `GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA ${quotedSchema} TO ${quotedRole}`,
      `ALTER DEFAULT PRIVILEGES IN SCHEMA ${quotedSchema} GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLES TO ${quotedRole}`,
      `ALTER DEFAULT PRIVILEGES IN SCHEMA ${quotedSchema} GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO ${quotedRole}`,
      `ALTER DEFAULT PRIVILEGES IN SCHEMA ${quotedSchema} GRANT EXECUTE ON FUNCTIONS TO ${quotedRole}`
    ];

    for (const statement of statements) {
      await executeStatement(adminPrisma, statement);
    }

    const runtimePrisma = createPrismaClient({ databaseUrl: runtimeDatabaseUrl });

    try {
      await runtimePrisma.$queryRaw`SELECT 1`;
      const runtimeRoleRows = await runtimePrisma.$queryRaw<RuntimeRoleRow[]>`
        SELECT
          current_user AS "currentUser",
          (r.rolsuper OR r.rolbypassrls) AS "bypass",
          r.rolcanlogin AS "canLogin"
        FROM pg_roles r
        WHERE r.rolname = current_user
      `;

      console.log(
        JSON.stringify(
          {
            checkedAt: new Date().toISOString(),
            databaseName,
            roleExisted,
            roleName,
            runtimeDatabaseUrl,
            runtimeDatabaseUrlRedacted: redactDatabaseUrl(runtimeDatabaseUrl),
            runtimeRole: runtimeRoleRows[0] ?? null,
            schemaName,
            status: "ready"
          },
          null,
          2
        )
      );
    } finally {
      await runtimePrisma.$disconnect();
    }
  } finally {
    await adminPrisma.$disconnect();
  }
}

void main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
        status: "failed"
      },
      null,
      2
    )
  );
  process.exitCode = 1;
});
