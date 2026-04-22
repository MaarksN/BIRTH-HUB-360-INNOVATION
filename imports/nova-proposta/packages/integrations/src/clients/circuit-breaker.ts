import CircuitBreaker from "opossum";
import { createLogger } from "@birthub/logger";

const logger = createLogger("integration-circuit-breaker");

export interface CircuitBreakerOptions extends CircuitBreaker.Options {
  name: string;
}

export function createCircuitBreaker<TI extends unknown[], TO>(
  action: (...args: TI) => Promise<TO>,
  options: CircuitBreakerOptions
): CircuitBreaker<TI, TO> {
  const breaker = new CircuitBreaker<TI, TO>(action, {
    timeout: options.timeout ?? 10_000,
    errorThresholdPercentage: options.errorThresholdPercentage ?? 50,
    resetTimeout: options.resetTimeout ?? 30_000,
    rollingCountTimeout: options.rollingCountTimeout ?? 60_000,
    ...options
  });

  breaker.on("open", () => {
    logger.warn({ breaker: options.name }, "Circuit breaker OPENED");
  });

  breaker.on("halfOpen", () => {
    logger.warn({ breaker: options.name }, "Circuit breaker HALF-OPEN");
  });

  breaker.on("close", () => {
    logger.info({ breaker: options.name }, "Circuit breaker CLOSED");
  });

  breaker.on("fallback", (result: unknown, err?: Error) => {
    logger.warn(
      { breaker: options.name, error: err?.message },
      "Circuit breaker FALLBACK executed"
    );
  });

  return breaker;
}

export function withCircuitBreaker<TI extends unknown[], TO>(
  name: string,
  action: (...args: TI) => Promise<TO>,
  options?: Omit<CircuitBreakerOptions, "name">
): (...args: TI) => Promise<TO> {
  const breaker = createCircuitBreaker(action, { ...options, name });
  return (...args: TI) => breaker.fire(...args);
}
