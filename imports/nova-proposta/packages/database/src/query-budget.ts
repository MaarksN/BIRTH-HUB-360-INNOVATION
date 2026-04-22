import { AsyncLocalStorage } from "node:async_hooks";

export type QueryBudgetCategory = "migration" | "oltp" | "report";

export interface QueryBudgetContext {
  category: QueryBudgetCategory;
  timeoutMs: number;
}

const DEFAULT_QUERY_BUDGET_CATEGORY: QueryBudgetCategory = "oltp";
const DEFAULT_QUERY_TIMEOUTS_MS: Record<QueryBudgetCategory, number> = {
  migration: 10 * 60 * 1000,
  oltp: 1_000,
  report: 30_000
};
const queryBudgetStorage = new AsyncLocalStorage<Readonly<QueryBudgetContext>>();

function resolveDefaultQueryTimeout(category: QueryBudgetCategory): number {
  return DEFAULT_QUERY_TIMEOUTS_MS[category];
}

function parseTimeoutOverride(category: QueryBudgetCategory): number {
  const envKey = `PRISMA_QUERY_TIMEOUT_${category.toUpperCase()}_MS`;
  const rawValue = process.env[envKey];
  const value = Number(rawValue);

  if (Number.isFinite(value) && value > 0) {
    return value;
  }

  return resolveDefaultQueryTimeout(category);
}

export function getCurrentQueryBudget(): Readonly<QueryBudgetContext> {
  return (
    queryBudgetStorage.getStore() ?? {
      category: DEFAULT_QUERY_BUDGET_CATEGORY,
      timeoutMs: parseTimeoutOverride(DEFAULT_QUERY_BUDGET_CATEGORY)
    }
  );
}

export function resolveQueryTimeoutMs(category: QueryBudgetCategory): number {
  return parseTimeoutOverride(category);
}

export function runWithQueryBudget<T>(category: QueryBudgetCategory, callback: () => T): T {
  return queryBudgetStorage.run(
    Object.freeze({
      category,
      timeoutMs: resolveQueryTimeoutMs(category)
    }),
    callback
  );
}
