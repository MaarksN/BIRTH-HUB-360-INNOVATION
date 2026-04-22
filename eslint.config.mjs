import tsParser from "@typescript-eslint/parser";
import noUnscopedPrismaQuery from "./eslint-rules/no-unscoped-prisma-query.mjs";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/.git/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/imports/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/out/**",
      "**/.tools/**"
    ]
  },
  {
    files: ["**/*.{js,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module"
    }
  },
  {
    files: ["**/*.cjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs"
    }
  },
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module"
    }
  },
  {
    files: [
      "apps/api/src/modules/connectors/service.oauth.ts",
      "apps/api/src/modules/connectors/service.shared.ts",
      "apps/api/src/modules/dashboard/service.ts",
      "apps/api/src/modules/dashboard/service.shared.ts",
      "apps/api/src/modules/marketplace/marketplace-service.ts",
      "apps/worker/src/agents/conversations.ts",
      "apps/worker/src/webhooks/outbound.ts",
      "apps/worker/src/worker.execution-state.ts"
    ],
    ignores: ["**/*.test.ts"],
    plugins: {
      "birthub-tenancy": {
        rules: {
          "no-unscoped-prisma-query": noUnscopedPrismaQuery
        }
      }
    },
    rules: {
      "birthub-tenancy/no-unscoped-prisma-query": "error"
    }
  }
];
