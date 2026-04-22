"use client";

import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ShieldAlert,
  Users
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { SdrAutomaticCopy, SdrAutomaticLead } from "./sdr-automatic-data";
import type {
  LeadDashboardCopy,
  LiveDashboardMetrics,
  TrendPoint
} from "./sdr-automatic-dashboard";
import shellStyles from "./sdr-automatic-platform.module.css";
import styles from "./sdr-lead-score.module.css";
import { SdrFunnelChart } from "./SdrFunnelChart";

type SdrLeadScoreWorkspaceTopProps = {
  copy: SdrAutomaticCopy;
  dashboardCopy: LeadDashboardCopy;
  highlightedLeads: SdrAutomaticLead[];
  metrics: LiveDashboardMetrics;
  secondsSinceUpdate: number;
  trendPoints: TrendPoint[];
};

export function SdrLeadScoreWorkspaceTop(props: SdrLeadScoreWorkspaceTopProps) {
  const {
    copy,
    dashboardCopy,
    highlightedLeads,
    metrics,
    secondsSinceUpdate,
    trendPoints
  } = props;

  return (
    <>
      <article className={`${shellStyles.surfaceCard} ${styles.summaryCard}`}>
        <div className={shellStyles.cardHeader}>
          <div>
            <strong>{copy.leadTitle}</strong>
            <p>{copy.leadSubtitle}</p>
          </div>
          <div className={styles.summaryHighlights}>
            {highlightedLeads.map((lead) => (
              <span key={lead.id}>
                {lead.name.split(" ")[0]} {lead.score}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.metricGrid}>
          <article className={styles.metricCard}>
            <span className={styles.metricIcon}>
              <Users size={18} />
            </span>
            <div>
              <small>{dashboardCopy.activeLeadsLabel}</small>
              <strong>{metrics.activeLeads}</strong>
            </div>
          </article>
          <article className={styles.metricCard}>
            <span className={styles.metricIcon}>
              <CheckCircle2 size={18} />
            </span>
            <div>
              <small>{dashboardCopy.mqlsGeneratedLabel}</small>
              <strong>{metrics.mqlsGenerated}</strong>
            </div>
          </article>
          <article className={styles.metricCard}>
            <span className={styles.metricIcon}>
              <ShieldAlert size={18} />
            </span>
            <div>
              <small>{dashboardCopy.slaViolationsLabel}</small>
              <strong>{metrics.slaViolations}</strong>
            </div>
          </article>
          <article className={styles.metricCard}>
            <span className={styles.metricIcon}>
              <BrainCircuit size={18} />
            </span>
            <div>
              <small>{dashboardCopy.aiExecutionsLabel}</small>
              <strong>{metrics.aiExecutions}</strong>
            </div>
          </article>
        </div>

        <div className={styles.liveStatus}>
          <span className={styles.liveDot} />
          <span>{dashboardCopy.metricsUpdatedLabel(secondsSinceUpdate)}</span>
        </div>
      </article>

      <section className={styles.chartGrid} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <SdrFunnelChart />

        <article className={`${shellStyles.surfaceCard} ${styles.chartCard}`}>
          <div className={shellStyles.cardHeader}>
            <div>
              <strong>{dashboardCopy.leadsTrendTitle}</strong>
              <p>{dashboardCopy.leadsTrendSubtitle}</p>
            </div>
            <Activity size={18} />
          </div>
          <div className={styles.chartCanvas}>
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={trendPoints}>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.16)" strokeDasharray="4 4" />
                <XAxis dataKey="label" tickLine={false} />
                <YAxis tickLine={false} width={34} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-panel-strong)",
                    border: "1px solid var(--border)",
                    borderRadius: 16
                  }}
                />
                <Bar dataKey="leads" fill="#187a73" radius={[12, 12, 4, 4]} />
                <Bar dataKey="mqls" fill="#0ea5e9" radius={[12, 12, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className={`${shellStyles.surfaceCard} ${styles.chartCard}`}>
          <div className={shellStyles.cardHeader}>
            <div>
              <strong>{dashboardCopy.slaTrendTitle}</strong>
              <p>{dashboardCopy.slaTrendSubtitle}</p>
            </div>
            <AlertTriangle size={18} />
          </div>
          <div className={styles.chartCanvas}>
            <ResponsiveContainer height="100%" width="100%">
              <LineChart data={trendPoints}>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.16)" strokeDasharray="4 4" />
                <XAxis dataKey="label" tickLine={false} />
                <YAxis domain={[0, 100]} tickLine={false} width={34} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-panel-strong)",
                    border: "1px solid var(--border)",
                    borderRadius: 16
                  }}
                />
                <Line
                  dataKey="slaCompliance"
                  dot={{ fill: "#7dd7c2", r: 3 }}
                  stroke="#7dd7c2"
                  strokeWidth={3}
                  type="monotone"
                />
                <Line
                  dataKey="slaViolations"
                  dot={{ fill: "#ef4444", r: 3 }}
                  stroke="#ef4444"
                  strokeWidth={2.4}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
    </>
  );
}
