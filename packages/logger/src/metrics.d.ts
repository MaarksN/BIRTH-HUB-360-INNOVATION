export type MetricLabelValue = string | number | boolean | null | undefined;
export type MetricLabels = Record<string, MetricLabelValue>;
export declare const DEFAULT_DURATION_BUCKETS_MS: number[];
interface CounterMetric {
    help: string;
    type: "counter";
    values: Map<string, number>;
}
interface GaugeMetric {
    help: string;
    type: "gauge";
    values: Map<string, number>;
}
interface HistogramMetricSeries {
    buckets: number[];
    count: number;
    counts: number[];
    sum: number;
}
interface HistogramMetric {
    help: string;
    type: "histogram";
    values: Map<string, HistogramMetricSeries>;
}
export declare class MetricsRegistry {
    private readonly metrics;
    registerCounter(name: string, help: string): CounterMetric;
    registerGauge(name: string, help: string): GaugeMetric;
    registerHistogram(name: string, help: string): HistogramMetric;
    incrementCounter(name: string, labels: MetricLabels, amount: number, help: string): void;
    setGauge(name: string, value: number, labels: MetricLabels, help: string): void;
    observeHistogram(name: string, value: number, labels: MetricLabels, options: {
        buckets: number[];
        help: string;
    }): void;
    reset(): void;
    render(): string;
}
declare const globalMetrics: typeof globalThis & {
    __birthubMetricsApi?: {
        incrementCounter: (name: string, labels?: MetricLabels, amount?: number, help?: string) => void;
        observeHistogram: (name: string, value: number, labels?: MetricLabels, options?: {
            buckets?: number[];
            help?: string;
        }) => void;
        setGauge: (name: string, value: number, labels?: MetricLabels, help?: string) => void;
    };
    __birthubMetricsRegistry?: MetricsRegistry;
};
export declare function getMetricsRegistry(): MetricsRegistry;
export declare function incrementCounter(name: string, labels?: MetricLabels, amount?: number, help?: string): void;
export declare function setGauge(name: string, value: number, labels?: MetricLabels, help?: string): void;
export declare function observeHistogram(name: string, value: number, labels?: MetricLabels, options?: {
    buckets?: number[];
    help?: string;
}): void;
export declare function renderPrometheusMetrics(): string;
export declare function resetMetricsRegistry(): void;
export type GlobalMetricsRegistry = typeof globalMetrics;
export {};
//# sourceMappingURL=metrics.d.ts.map