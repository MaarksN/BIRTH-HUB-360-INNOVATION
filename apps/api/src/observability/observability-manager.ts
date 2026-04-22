import { context, trace } from "@opentelemetry/api";
import { createLogger } from "@birthub/logger";

/**
 * Advanced observability layer with tracing, metrics, and structured logging
 */

export interface TraceSpanContext {
  traceId: string;
  spanId: string;
  userId?: string;
  organizationId?: string;
  tenantId?: string;
  requestId?: string;
}

export interface MetricEvent {
  name: string;
  value: number;
  unit: string;
  tags: Record<string, string>;
  timestamp: Date;
}

export class ObservabilityManager {
  private logger = createLogger("observability");
  private tracer = trace.getTracer("birthub-api");
  private metrics: Map<string, MetricEvent[]> = new Map();

  /**
   * Create a span for a specific operation
   */
  createSpan<T>(
    name: string,
    fn: (span: ReturnType<typeof this.tracer.startSpan>) => Promise<T>,
    attributes?: Record<string, string | number | boolean>
  ): Promise<T> {
    const span = this.tracer.startSpan(name, {
      attributes
    });

    return context.with(trace.setSpan(context.active(), span), async () => {
      try {
        const result = await fn(span);
        span.setStatus({ code: 0 }); // OK
        return result;
      } catch (error) {
        span.setStatus({ code: 2, message: String(error) }); // ERROR
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Record a metric event
   */
  recordMetric(event: MetricEvent): void {
    const key = event.name;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    this.metrics.get(key)!.push(event);
  }

  /**
   * Record operation timing
   */
  async measureDuration<T>(
    operationName: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.recordMetric({
        name: `operation_duration_ms`,
        value: duration,
        unit: "ms",
        tags: {
          operation: operationName,
          status: "success",
          ...tags
        },
        timestamp: new Date()
      });
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name: `operation_duration_ms`,
        value: duration,
        unit: "ms",
        tags: {
          operation: operationName,
          status: "error",
          ...tags
        },
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary(): Record<string, any> {
    const summary: Record<string, any> = {};

    for (const [name, events] of this.metrics) {
      if (events.length === 0) continue;

      const values = events.map((e) => e.value);
      summary[name] = {
        count: events.length,
        sum: values.reduce((a, b) => a + b, 0),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        unit: events[0].unit,
        tags: events[0].tags
      };
    }

    return summary;
  }

  /**
   * Clear metrics (e.g., after exporting)
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Export metrics to JSON
   */
  exportMetrics(): { name: string; events: MetricEvent[] }[] {
    return Array.from(this.metrics).map(([name, events]) => ({ name, events }));
  }
}

/**
 * Request-scoped observability context
 */
export class RequestObservabilityContext {
  readonly spanContext: TraceSpanContext;
  readonly manager: ObservabilityManager;

  constructor(spanContext: TraceSpanContext) {
    this.spanContext = spanContext;
    this.manager = new ObservabilityManager();
  }

  /**
   * Log structured message with context
   */
  log(level: "info" | "warn" | "error" | "debug", message: string, data?: unknown): void {
    const logger = createLogger("request");
    logger[level](
      {
        ...this.spanContext,
        ...data
      },
      message
    );
  }

  /**
   * Create child span
   */
  createSpan<T>(
    name: string,
    fn: (span: ReturnType<ReturnType<typeof trace.getTracer>["startSpan"]>) => Promise<T>
  ): Promise<T> {
    return this.manager.createSpan(name, fn, this.spanContext as any);
  }

  /**
   * Measure operation with automatic logging
   */
  async measure<T>(operationName: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      this.log("info", `Operation completed: ${operationName}`, {
        durationMs: duration,
        status: "success"
      });
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.log("error", `Operation failed: ${operationName}`, {
        durationMs: duration,
        error: String(error)
      });
      throw error;
    }
  }
}

/**
 * Express middleware for request observability
 */
export function requestObservabilityMiddleware(
  req: any,
  _res: any,
  next: any
): void {
  const spanContext: TraceSpanContext = {
    traceId: req.context.traceId,
    spanId: req.context.requestId,
    userId: req.context.userId,
    organizationId: req.context.organizationId,
    tenantId: req.context.tenantId,
    requestId: req.context.requestId
  };

  req.observability = new RequestObservabilityContext(spanContext);
  next();
}

/**
 * Singleton observability manager
 */
export const globalObservability = new ObservabilityManager();
