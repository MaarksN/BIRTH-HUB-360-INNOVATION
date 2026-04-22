"use client";

import { MapPin } from "lucide-react";
import shellStyles from "./sdr-automatic-platform.module.css";
import styles from "./sdr-lead-score.module.css";

const MAP_REGIONS: Array<{ id: "NA" | "LATAM" | "EMEA" | "APAC", name: string, x: number, y: number, leads: number }> = [
  { id: "NA", name: "North America", x: 20, y: 35, leads: 245 },
  { id: "LATAM", name: "Latin America", x: 28, y: 70, leads: 138 },
  { id: "EMEA", name: "Europe & MEA", x: 50, y: 35, leads: 320 },
  { id: "APAC", name: "Asia-Pacific", x: 80, y: 55, leads: 190 }
];

type GeographicMapProps = {
  activeRegions: string[];
  onToggleRegion: (region: "APAC" | "EMEA" | "LATAM" | "NA") => void;
};

export function GeographicMap({ activeRegions, onToggleRegion }: GeographicMapProps) {
  return (
    <article className={`${shellStyles.surfaceCard} ${styles.chartCard}`}>
      <div className={shellStyles.cardHeader}>
        <div>
          <strong>Geographic Distribution</strong>
          <p>Filter active leads by region.</p>
        </div>
        <MapPin size={18} />
      </div>
      <div style={{ position: "relative", width: "100%", height: 300, background: "rgba(24, 122, 115, 0.04)", borderRadius: 16, overflow: "hidden" }}>
        {/* Simple decorative map background approximation */}
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <path d="M 0 0 Q 50 100 100 50 T 200 150 Q 250 50 300 100" stroke="rgba(148, 163, 184, 0.15)" strokeWidth="4" fill="none" opacity="0.6"/>
          <path d="M 0 50 Q 50 150 150 100 T 350 200 Q 400 100 450 150" stroke="rgba(148, 163, 184, 0.15)" strokeWidth="3" fill="none" opacity="0.4"/>
          <path d="M 0 100 Q 100 200 200 150 T 400 250 Q 450 150 500 200" stroke="rgba(148, 163, 184, 0.15)" strokeWidth="2" fill="none" opacity="0.3"/>
        </svg>

        {MAP_REGIONS.map((region) => {
          const isActive = activeRegions.includes(region.id);

          return (
            <button
              key={region.id}
              onClick={() => onToggleRegion(region.id)}
              style={{
                position: "absolute",
                left: `${region.x}%`,
                top: `${region.y}%`,
                transform: "translate(-50%, -50%)",
                background: isActive ? "var(--accent)" : "var(--surface-panel-strong)",
                border: `2px solid ${isActive ? "transparent" : "var(--accent)"}`,
                borderRadius: 24,
                padding: "0.5rem 0.8rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.2rem",
                boxShadow: isActive ? "var(--shadow-grow)" : "var(--shadow-glass)",
                color: isActive ? "white" : "var(--text)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                zIndex: isActive ? 10 : 1
              }}
              type="button"
            >
              <strong style={{ fontSize: "0.85rem", letterSpacing: "0.02em" }}>{region.name}</strong>
              <small style={{ fontSize: "0.75rem", opacity: isActive ? 0.9 : 0.6 }}>{region.leads} leads</small>
            </button>
          );
        })}
      </div>
    </article>
  );
}
