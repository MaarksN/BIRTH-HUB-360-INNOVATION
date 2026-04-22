export const DEFAULT_DURATION_BUCKETS_MS = [
    5,
    10,
    25,
    50,
    100,
    250,
    500,
    1000,
    2500,
    5000,
    10000
];
export class MetricsRegistry {
    metrics = new Map();
    registerCounter(name, help) {
        const existing = this.metrics.get(name);
        if (existing) {
            if (existing.type !== "counter") {
                throw new Error(`Metric ${name} is already registered with a different type.`);
            }
            return existing;
        }
        const metric = {
            help,
            type: "counter",
            values: new Map()
        };
        this.metrics.set(name, metric);
        return metric;
    }
    registerGauge(name, help) {
        const existing = this.metrics.get(name);
        if (existing) {
            if (existing.type !== "gauge") {
                throw new Error(`Metric ${name} is already registered with a different type.`);
            }
            return existing;
        }
        const metric = {
            help,
            type: "gauge",
            values: new Map()
        };
        this.metrics.set(name, metric);
        return metric;
    }
    registerHistogram(name, help) {
        const existing = this.metrics.get(name);
        if (existing) {
            if (existing.type !== "histogram") {
                throw new Error(`Metric ${name} is already registered with a different type.`);
            }
            return existing;
        }
        const metric = {
            help,
            type: "histogram",
            values: new Map()
        };
        this.metrics.set(name, metric);
        return metric;
    }
    incrementCounter(name, labels, amount, help) {
        const metric = this.registerCounter(name, help);
        const key = serializeLabels(labels);
        metric.values.set(key, (metric.values.get(key) ?? 0) + amount);
    }
    setGauge(name, value, labels, help) {
        const metric = this.registerGauge(name, help);
        metric.values.set(serializeLabels(labels), value);
    }
    observeHistogram(name, value, labels, options) {
        const metric = this.registerHistogram(name, options.help);
        const key = serializeLabels(labels);
        const buckets = [...options.buckets].sort((left, right) => left - right);
        const series = metric.values.get(key) ??
            {
                buckets,
                count: 0,
                counts: Array.from({ length: buckets.length }, () => 0),
                sum: 0
            };
        series.count += 1;
        series.sum += value;
        for (let index = 0; index < buckets.length; index += 1) {
            const bucket = buckets[index];
            if (bucket !== undefined && value <= bucket) {
                series.counts[index] = (series.counts[index] ?? 0) + 1;
            }
        }
        metric.values.set(key, series);
    }
    reset() {
        this.metrics.clear();
    }
    render() {
        const sections = [];
        for (const [name, metric] of this.metrics.entries()) {
            sections.push(`# HELP ${name} ${metric.help}`);
            sections.push(`# TYPE ${name} ${metric.type}`);
            if (metric.type === "counter" || metric.type === "gauge") {
                for (const [labels, value] of metric.values.entries()) {
                    sections.push(`${name}${labels} ${value}`);
                }
                continue;
            }
            const histogramValues = metric.values;
            for (const [labels, series] of histogramValues.entries()) {
                const baseLabels = labels === "" ? [] : labels.slice(1, -1).split(",").filter(Boolean);
                for (let index = 0; index < series.buckets.length; index += 1) {
                    const bucketLabels = [...baseLabels, `le="${series.buckets[index]}"`].join(",");
                    sections.push(`${name}_bucket{${bucketLabels}} ${series.counts[index]}`);
                }
                const infLabels = [...baseLabels, 'le="+Inf"'].join(",");
                sections.push(`${name}_bucket{${infLabels}} ${series.count}`);
                sections.push(`${name}_sum${labels} ${series.sum}`);
                sections.push(`${name}_count${labels} ${series.count}`);
            }
        }
        return sections.join("\n");
    }
}
function normalizeLabels(labels = {}) {
    return Object.entries(labels)
        .filter(([, value]) => value !== null && value !== undefined)
        .map(([key, value]) => [key, String(value).replace(/"/g, '\\"')])
        .sort(([left], [right]) => left.localeCompare(right));
}
function serializeLabels(labels = {}) {
    const normalized = normalizeLabels(labels);
    if (normalized.length === 0) {
        return "";
    }
    return `{${normalized.map(([key, value]) => `${key}="${value}"`).join(",")}}`;
}
const globalMetrics = globalThis;
export function getMetricsRegistry() {
    globalMetrics.__birthubMetricsRegistry ??= new MetricsRegistry();
    globalMetrics.__birthubMetricsApi ??= {
        incrementCounter,
        observeHistogram,
        setGauge
    };
    return globalMetrics.__birthubMetricsRegistry;
}
export function incrementCounter(name, labels = {}, amount = 1, help = `${name} counter`) {
    getMetricsRegistry().incrementCounter(name, labels, amount, help);
}
export function setGauge(name, value, labels = {}, help = `${name} gauge`) {
    getMetricsRegistry().setGauge(name, value, labels, help);
}
export function observeHistogram(name, value, labels = {}, options = {}) {
    getMetricsRegistry().observeHistogram(name, value, labels, {
        buckets: options.buckets ?? DEFAULT_DURATION_BUCKETS_MS,
        help: options.help ?? `${name} histogram`
    });
}
export function renderPrometheusMetrics() {
    return getMetricsRegistry().render();
}
export function resetMetricsRegistry() {
    getMetricsRegistry().reset();
}
