import { createRequire } from "node:module";
import path from "node:path";
const nodeRequire = createRequire(path.join(process.cwd(), "package.json"));
function loadOpenTelemetryApi() {
    try {
        return nodeRequire("@opentelemetry/api");
    }
    catch {
        return null;
    }
}
function getActiveSpan() {
    const otel = loadOpenTelemetryApi();
    if (!otel) {
        return null;
    }
    const span = otel.trace.getSpan(otel.context.active());
    if (!span) {
        return null;
    }
    return {
        addEvent: (name, attributes) => span.addEvent?.(name, attributes),
        recordException: (error) => span.recordException?.(error),
        setAttributes: (attributes) => span.setAttributes?.(attributes)
    };
}
export function getActiveTraceContext() {
    const otel = loadOpenTelemetryApi();
    if (!otel) {
        return null;
    }
    const span = otel.trace.getSpan(otel.context.active());
    if (!span) {
        return null;
    }
    const context = span.spanContext();
    return {
        spanId: context.spanId ?? null,
        traceId: context.traceId ?? null
    };
}
export function setActiveSpanAttributes(attributes) {
    getActiveSpan()?.setAttributes(attributes);
}
export function addActiveSpanEvent(name, attributes) {
    getActiveSpan()?.addEvent(name, attributes);
}
export function recordActiveSpanException(error) {
    getActiveSpan()?.recordException(error);
}
export async function withActiveSpan(name, options, callback) {
    const otel = loadOpenTelemetryApi();
    if (!otel) {
        return callback();
    }
    const tracer = otel.trace.getTracer(options.tracerName ?? "@birthub/logger");
    return tracer.startActiveSpan(name, async (span) => {
        try {
            if (options.attributes) {
                span.setAttributes?.(options.attributes);
            }
            return await callback();
        }
        catch (error) {
            span.recordException?.(error);
            throw error;
        }
        finally {
            span.end();
        }
    });
}
