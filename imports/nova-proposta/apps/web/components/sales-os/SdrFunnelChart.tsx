"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import shellStyles from "./sdr-automatic-platform.module.css";
import styles from "./sdr-lead-score.module.css";
import { Filter } from "lucide-react";

type FunnelStage = {
  stage: string;
  count: number;
  conversionRate: string;
  fill: string;
};

const FUNNEL_DATA: FunnelStage[] = [
  { stage: "Subscriber", count: 1200, conversionRate: "100%", fill: "#1f2937" },
  { stage: "Lead", count: 850, conversionRate: "70.8%", fill: "#3b82f6" },
  { stage: "MQL", count: 400, conversionRate: "47.0%", fill: "#10b981" },
  { stage: "SQL", count: 150, conversionRate: "37.5%", fill: "#f59e0b" },
  { stage: "Customer", count: 45, conversionRate: "30.0%", fill: "#ec4899" }
];

export function SdrFunnelChart() {
  return (
    <article className={`${shellStyles.surfaceCard} ${styles.chartCard}`}>
      <div className={shellStyles.cardHeader}>
        <div>
          <strong>Sales Funnel</strong>
          <p>Progression from Subscriber to Customer.</p>
        </div>
        <Filter size={18} />
      </div>
      <div className={styles.chartCanvas}>
        <ResponsiveContainer height={300} width="100%">
          <BarChart
            data={FUNNEL_DATA}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid horizontal={false} stroke="rgba(148, 163, 184, 0.16)" />
            <XAxis type="number" hide />
            <YAxis dataKey="stage" type="category" tickLine={false} width={80} />
            <Tooltip
              contentStyle={{
                background: "var(--surface-panel-strong)",
                border: "1px solid var(--border)",
                borderRadius: 16
              }}
              formatter={(value, name, props) => {
                const payload = props.payload as { conversionRate?: string };
                return [
                  value,
                  `${name} (Conv: ${payload?.conversionRate ?? ""})`
                ];
              }}
            />
            <Bar dataKey="count" radius={[0, 12, 12, 0]} barSize={32}>
              {FUNNEL_DATA.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <LabelList dataKey="count" position="right" style={{ fill: "var(--muted)", fontSize: 12 }} />
              <LabelList dataKey="conversionRate" position="insideRight" style={{ fill: "#fff", fontSize: 11, fontWeight: 600 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
