"use client";

import type { CSSProperties } from "react";
import {
  BarChart3,
  Gauge,
  Map,
  RefreshCw,
  ShieldAlert
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Funnel,
  FunnelChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { SupportedLocale } from "../../lib/i18n";
import type {
  ChurnWatchEntry,
  FunnelPoint,
  LeadDashboardCopy,
  PipelinePoint,
  RegionalPerformancePoint
} from "./sdr-automatic-dashboard";
import { buildStageColor } from "./SdrLeadScoreWorkspace.helpers";
import shellStyles from "./sdr-automatic-platform.module.css";
import styles from "./sdr-lead-score.module.css";

type SdrLeadScoreWorkspaceAnalyticsProps = {
  churnLoading: boolean;
  churnSummary: string;
  churnWatchlist: ChurnWatchEntry[];
  dashboardCopy: LeadDashboardCopy;
  funnelData: FunnelPoint[];
  locale: SupportedLocale;
  onRefreshChurnSummary: () => void;
  pipelineData: PipelinePoint[];
  regionMetrics: RegionalPerformancePoint[];
  selectedRegions: string[];
  toggleRegion: (region: RegionalPerformancePoint["region"]) => void;
};

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export function SdrLeadScoreWorkspaceAnalytics(
  props: SdrLeadScoreWorkspaceAnalyticsProps
) {
  const {
    churnLoading,
    churnSummary,
    churnWatchlist,
    dashboardCopy,
    funnelData,
    locale,
    onRefreshChurnSummary,
    pipelineData,
    regionMetrics,
    selectedRegions,
    toggleRegion
  } = props;

  const focusedRegions =
    selectedRegions.length > 0
      ? regionMetrics.filter((entry) => selectedRegions.includes(entry.region))
      : regionMetrics;
  const focusedRegionLabel =
    selectedRegions.length === 0
      ? locale === "en-US"
        ? "All regions"
        : "Todas as regioes"
      : focusedRegions.map((entry) => entry.regionLabel).join(", ");
  const focusedRevenue = sum(focusedRegions.map((entry) => entry.revenuePotential));
  const focusedAccounts = sum(focusedRegions.map((entry) => entry.activeAccounts));
  const focusedCoverage =
    focusedRegions.length > 0
      ? (
          focusedRegions.reduce((total, entry) => total + entry.pipelineCoverage, 0) /
          focusedRegions.length
        ).toFixed(1)
      : "0.0";
  const focusedCompliance =
    focusedRegions.length > 0
      ? Math.round(
          focusedRegions.reduce((total, entry) => total + entry.slaCompliance, 0) / focusedRegions.length
        )
      : 0;
  const revenueLabel = new Intl.NumberFormat(locale, {
    currency: locale === "en-US" ? "USD" : "BRL",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(focusedRevenue);

  return (
    <section className={styles.analyticsGrid}>
      <article className={`${shellStyles.surfaceCard} ${styles.analyticsCard}`}>
        <div className={shellStyles.cardHeader}>
          <div>
            <strong>{dashboardCopy.funnelTitle}</strong>
            <p>{dashboardCopy.funnelSubtitle}</p>
          </div>
          <Gauge size={18} />
        </div>

        <div className={styles.funnelCanvas}>
          <ResponsiveContainer height="100%" width="100%">
            <FunnelChart>
              <Tooltip
                contentStyle={{
                  background: "var(--surface-panel-strong)",
                  border: "1px solid var(--border)",
                  borderRadius: 16
                }}
              />
              <Funnel data={funnelData} dataKey="count" isAnimationActive={false} />
            </FunnelChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.funnelStats}>
          {funnelData.map((entry, index) => {
            const previous = funnelData[index - 1];
            const conversion = previous ? Math.round((entry.count / Math.max(previous.count, 1)) * 100) : 100;

            return (
              <article className={styles.funnelStatCard} key={entry.id}>
                <strong>{entry.label}</strong>
                <span>{entry.count}</span>
                <small>
                  {dashboardCopy.conversionRateLabel}: {conversion}%
                </small>
              </article>
            );
          })}
        </div>
      </article>

      <article className={`${shellStyles.surfaceCard} ${styles.analyticsCard}`}>
        <div className={shellStyles.cardHeader}>
          <div>
            <strong>{dashboardCopy.pipelineTitle}</strong>
            <p>{dashboardCopy.pipelineSubtitle}</p>
          </div>
          <BarChart3 size={18} />
        </div>

        <div className={styles.pipelineCanvas}>
          <ResponsiveContainer height="100%" width="100%">
            <ComposedChart data={pipelineData}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.16)" strokeDasharray="4 4" />
              <XAxis dataKey="stageLabel" tickLine={false} />
              <YAxis allowDecimals={false} tickLine={false} yAxisId="count" />
              <YAxis
                domain={[0, 110]}
                orientation="right"
                tickLine={false}
                yAxisId="rate"
              />
              <Tooltip
                contentStyle={{
                  background: "var(--surface-panel-strong)",
                  border: "1px solid var(--border)",
                  borderRadius: 16
                }}
              />
              <Bar dataKey="count" fill="#1d8f84" radius={[14, 14, 6, 6]} yAxisId="count" />
              <Line
                dataKey="conversionRate"
                dot={{ fill: "#f97316", r: 4 }}
                stroke="#f97316"
                strokeWidth={3}
                type="monotone"
                yAxisId="rate"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.pipelineList}>
          {pipelineData.map((entry) => (
            <div className={styles.pipelineListItem} key={entry.stage}>
              <span
                className={styles.pipelineDot}
                style={
                  {
                    "--pipeline-color": buildStageColor(entry.stage)
                  } as CSSProperties
                }
              />
              <strong>{entry.stageLabel}</strong>
              <span>{entry.count}</span>
              <small>{entry.conversionRate}%</small>
            </div>
          ))}
        </div>
      </article>

      <article className={`${shellStyles.surfaceCard} ${styles.analyticsCard}`}>
        <div className={shellStyles.cardHeader}>
          <div>
            <strong>{dashboardCopy.mapTitle}</strong>
            <p>{dashboardCopy.mapSubtitle}</p>
          </div>
          <Map size={18} />
        </div>

        <div className={styles.mapShell}>
          <div className={styles.worldMap}>
            <div className={styles.worldMapGlow} />
            {regionMetrics.map((entry) => (
              <button
                className={styles.regionNode}
                data-active={selectedRegions.includes(entry.region) ? "true" : "false"}
                key={entry.region}
                onClick={() => toggleRegion(entry.region)}
                style={
                  {
                    "--region-x": `${entry.x}%`,
                    "--region-y": `${entry.y}%`
                  } as CSSProperties
                }
                type="button"
              >
                <span />
                <small>{entry.regionLabel}</small>
              </button>
            ))}
          </div>

          <div className={styles.mapMetrics}>
            <article className={styles.mapMetricCard}>
              <small>{dashboardCopy.mapActiveRegionLabel}</small>
              <strong>{focusedRegionLabel}</strong>
            </article>
            <article className={styles.mapMetricCard}>
              <small>{dashboardCopy.activeAccountsLabel}</small>
              <strong>{focusedAccounts}</strong>
            </article>
            <article className={styles.mapMetricCard}>
              <small>{dashboardCopy.revenuePotentialLabel}</small>
              <strong>{revenueLabel}</strong>
            </article>
            <article className={styles.mapMetricCard}>
              <small>{dashboardCopy.pipelineCoverageLabel}</small>
              <strong>{focusedCoverage}x</strong>
            </article>
            <article className={styles.mapMetricCard}>
              <small>{dashboardCopy.slaComplianceLabel}</small>
              <strong>{focusedCompliance}%</strong>
            </article>
          </div>
        </div>
      </article>

      <article className={`${shellStyles.surfaceCard} ${styles.analyticsCard}`}>
        <div className={shellStyles.cardHeader}>
          <div>
            <strong>{dashboardCopy.churnTitle}</strong>
            <p>{dashboardCopy.churnSubtitle}</p>
          </div>
          <button
            className={styles.secondaryButton}
            onClick={onRefreshChurnSummary}
            type="button"
          >
            <RefreshCw className={churnLoading ? styles.spinningIcon : undefined} size={16} />
            <span>{dashboardCopy.churnRefreshLabel}</span>
          </button>
        </div>

        <div className={styles.churnSummaryCard}>
          <span className={styles.analyticsBadge}>{dashboardCopy.churnAgentLabel}</span>
          <p>{churnSummary}</p>
        </div>

        {churnWatchlist.length === 0 ? (
          <p className={styles.emptyCopy}>{dashboardCopy.churnEmptyLabel}</p>
        ) : (
          <div className={styles.churnList}>
            {churnWatchlist.map((entry) => (
              <article className={styles.churnItem} data-tone={entry.tone} key={entry.lead.id}>
                <div>
                  <strong>{entry.lead.company}</strong>
                  <p>{entry.lead.support.summary}</p>
                </div>
                <div className={styles.churnMeta}>
                  <span className={styles.slaPill} data-tone={entry.tone === "critical" ? "breached" : entry.tone === "watch" ? "watch" : "healthy"}>
                    {entry.riskLabel}
                  </span>
                  <small>{entry.riskScore}/100</small>
                </div>
                <div className={styles.churnSignals}>
                  <ShieldAlert size={14} />
                  <span>
                    {entry.lead.support.sentiment} · {entry.lead.support.recentTickets} tickets
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
